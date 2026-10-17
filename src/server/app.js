/**
 * CollabWrite - Express Application (Phases 1, 2, 7, 9, 10)
 *
 * Builds the HTTP surface described in design.md section 13. The app is a
 * factory rather than a module-level singleton so that tests can construct
 * one against an in-memory store and a temporary engine data directory.
 */

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { createAuthController } = require('./controllers/authController');
const { createDocumentController } = require('./controllers/documentController');
const { createEditController } = require('./controllers/editController');
const { createAdminController, requireAdmin } = require('./controllers/adminController');
const { requireAuth, requireDocumentAccess, requireOwner, HttpError } = require('./middleware/auth');
const { notFound, errorHandler, asyncHandler } = require('./middleware/errors');
const { LOCK_MODES } = require('../engine/lock/LockManager');

/**
 * @param {object} deps
 * @param {object} deps.store - Support store (PostgreSQL or in-memory).
 * @param {import('../engine/Engine').Engine} deps.engine
 * @returns {import('express').Express}
 */
function createApp({ store, engine }) {
  const app = express();

  app.use(helmet());

  // CORS is an allowlist, never a wildcard. A permissive origin combined with
  // credentials would let any site drive the API with a victim's session, so
  // the fallback is the local dev origin rather than '*'. Several origins may
  // be given as a comma-separated list.
  const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.use(cors({ origin: allowedOrigins, credentials: true }));

  app.use(express.json({ limit: '1mb' }));

  // Authentication is the one unauthenticated surface, so it gets its own
  // tighter budget than the general API.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT || 50),
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test'
  });
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Number(process.env.API_RATE_LIMIT || 600),
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test'
  });

  // Every /api route is rate limited, not only the ones that write. A route
  // that merely performs an authorization check is still an oracle an
  // attacker can hammer, so the limiter is mounted on the prefix rather than
  // being remembered per route.
  app.use('/api', apiLimiter);

  const auth = createAuthController({ store });
  const documents = createDocumentController({ store, engine });
  const edits = createEditController({ store, engine });
  const admin = createAdminController({ store, engine });

  const readAccess = requireDocumentAccess({ store });
  const writeAccess = requireDocumentAccess({ store, write: true });

  // ----------------------------------------------------------- health
  app.get('/health', (_req, res) => {
    res.json({
      status: engine.started ? 'ok' : 'starting',
      documents: engine.storage.listDocuments().length,
      uptimeSeconds: Math.round(process.uptime())
    });
  });

  // ------------------------------------------------------------- auth
  app.post('/api/auth/register', authLimiter, asyncHandler(auth.register));
  app.post('/api/auth/login', authLimiter, asyncHandler(auth.login));
  app.get('/api/auth/me', requireAuth, asyncHandler(auth.profile));

  // -------------------------------------------------------- documents
  app.post('/api/documents', requireAuth, asyncHandler(documents.create));
  app.get('/api/documents', requireAuth, asyncHandler(documents.list));
  app.get('/api/documents/:id', requireAuth, asyncHandler(readAccess), asyncHandler(documents.read));
  app.patch('/api/documents/:id', requireAuth, asyncHandler(writeAccess), asyncHandler(documents.rename));
  app.delete(
    '/api/documents/:id',
    requireAuth,
    asyncHandler(readAccess),
    requireOwner(),
    asyncHandler(documents.remove)
  );

  app.get(
    '/api/documents/:id/permissions',
    requireAuth,
    asyncHandler(readAccess),
    asyncHandler(documents.listPermissions)
  );
  app.put(
    '/api/documents/:id/permissions',
    requireAuth,
    asyncHandler(readAccess),
    requireOwner(),
    asyncHandler(documents.share)
  );
  app.delete(
    '/api/documents/:id/permissions/:userId',
    requireAuth,
    asyncHandler(readAccess),
    requireOwner(),
    asyncHandler(documents.revoke)
  );

  // ------------------------------------------------------------ edits
  app.post(
    '/api/documents/:id/edit',
    requireAuth,
    asyncHandler(writeAccess),
    asyncHandler(edits.edit)
  );

  // ----------------------------------------------------------- search
  app.get('/api/search', requireAuth, asyncHandler(edits.search));
  app.get('/api/search/benchmark', requireAuth, requireAdmin, asyncHandler(edits.benchmark));

  // ------------------------------------------------------------ admin
  app.get('/api/admin/stats', requireAuth, requireAdmin, asyncHandler(admin.stats));
  app.get('/api/admin/locks', requireAuth, requireAdmin, asyncHandler(admin.locks));
  app.get('/api/admin/scheduler', requireAuth, requireAdmin, asyncHandler(admin.scheduler));
  app.post('/api/admin/scheduler/policy', requireAuth, requireAdmin, asyncHandler(admin.setPolicy));
  app.get('/api/admin/audit', requireAuth, requireAdmin, asyncHandler(admin.audit));
  app.post('/api/admin/checkpoint', requireAuth, requireAdmin, asyncHandler(admin.checkpoint));

  // -------------------------------------------------------- inspector
  app.get(
    '/api/engine/inspector',
    requireAuth,
    asyncHandler(async (_req, res) => {
      res.json({
        stats: engine.getStats(),
        waitForGraph: engine.lockManager.getWaitForEdges(),
        deadlocks: engine.deadlockDetector.getStats(),
        scheduler: engine.scheduler.getMetrics()
      });
    })
  );
  app.post(
    '/api/engine/scheduler/policy',
    requireAuth,
    asyncHandler(async (req, res) => {
      const policy = String((req.body && req.body.policy) || '').toUpperCase();
      try {
        engine.scheduler.setPolicy(policy);
      } catch (error) {
        throw new HttpError(400, error.message, 'INVALID_POLICY');
      }
      res.json({ policy: engine.scheduler.policy });
    })
  );
  app.post(
    '/api/engine/deadlock/simulate',
    requireAuth,
    asyncHandler(async (_req, res) => {
      let pageA = 4;
      let pageB = 5;
      try {
        if (engine.storage && typeof engine.storage.getDocumentPages === 'function') {
          const p1 = engine.storage.getDocumentPages(1);
          const p2 = engine.storage.getDocumentPages(2);
          if (p1 && p1.length > 0) pageA = p1[0];
          if (p2 && p2.length > 0) pageB = p2[0];
        }
      } catch {
        // Fallback to default pages
      }

      const manager = engine.transactionManager;
      const txA = manager.begin({ label: 'T-Sim-A' });
      const txB = manager.begin({ label: 'T-Sim-B' });

      // Step 1: Each transaction takes its first lock on different pages
      await manager.acquireLock(txA, 1, pageA, LOCK_MODES.EXCLUSIVE);
      await manager.acquireLock(txB, 2, pageB, LOCK_MODES.EXCLUSIVE);

      // Step 2: Each mutually requests the lock held by the other -> Circular Wait
      const outcomeA = manager.acquireLock(txA, 2, pageB, LOCK_MODES.EXCLUSIVE)
        .then(() => 'ACQUIRED', (e) => e.name);
      const outcomeB = manager.acquireLock(txB, 1, pageA, LOCK_MODES.EXCLUSIVE)
        .then(() => 'ACQUIRED', (e) => e.name);

      // Step 3: Trigger DeadlockDetector sweep with Tarjan's SCC
      if (engine.deadlockDetector) {
        engine.deadlockDetector.detect();
      }

      const [resA, resB] = await Promise.all([outcomeA, outcomeB]);

      // Complete the survivor transaction and clean up victim
      if (resA === 'ACQUIRED') {
        try {
          await manager.commit(txA);
        } catch (_err) {
          try { await manager.abort(txA, 'deadlock-cleanup'); } catch (_e) { /* ignore */ }
        }
      } else {
        try { await manager.abort(txA, 'deadlock-victim-cleanup'); } catch (_err) { /* ignore */ }
      }

      if (resB === 'ACQUIRED') {
        try {
          await manager.commit(txB);
        } catch (_err) {
          try { await manager.abort(txB, 'deadlock-cleanup'); } catch (_e) { /* ignore */ }
        }
      } else {
        try { await manager.abort(txB, 'deadlock-victim-cleanup'); } catch (_err) { /* ignore */ }
      }

      res.json({
        success: true,
        deadlocks: engine.deadlockDetector ? engine.deadlockDetector.getStats() : {},
        outcomes: { txA: resA, txB: resB },
        pages: { pageA, pageB }
      });
    })
  );

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };

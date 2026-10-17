/**
 * CollabWrite - Document Controller (Phases 2 and 5)
 *
 * The application layer is deliberately thin (architecture.md section 1): it
 * authenticates, authorises, validates input, and forwards to the engine. It
 * contains no concurrency logic of its own.
 *
 * Document metadata (title, owner, permissions) lives in PostgreSQL; the
 * content lives in the engine. Creation therefore writes both, metadata
 * first so that a failure in the engine leaves an empty document rather than
 * orphaned content with no owner.
 */

'use strict';

const { HttpError } = require('../middleware/auth');
const { ROLES } = require('../stores/InMemoryStore');

/**
 * @param {object} deps
 * @param {object} deps.store
 * @param {import('../../engine/Engine').Engine} deps.engine
 */
function createDocumentController({ store, engine }) {
  return {
    /** POST /api/documents */
    async create(req, res) {
      const title = String((req.body && req.body.title) || 'Untitled').slice(0, 255);

      const document = await store.createDocument({ title, ownerId: req.user.id });
      try {
        await engine.createDocument({ docId: document.id, title, ownerId: req.user.id });
      } catch (error) {
        await store.softDeleteDocument(document.id);
        throw error;
      }

      await store.recordAudit({
        userId: req.user.id,
        documentId: document.id,
        action: 'document.create',
        details: { title }
      });
      res.status(201).json({ document: { ...document, role: ROLES.OWNER, version: 1, text: '' } });
    },

    /** GET /api/documents */
    async list(req, res) {
      const documents = await store.listDocumentsForUser(req.user.id);
      res.json({ documents });
    },

    /** GET /api/documents/:id */
    async read(req, res) {
      const content = await engine.readDocument(req.document.id);
      res.json({
        document: {
          ...req.document,
          role: req.documentRole,
          version: content.version,
          text: content.text,
          pages: content.pages
        }
      });
    },

    /** PATCH /api/documents/:id */
    async rename(req, res) {
      const title = String((req.body && req.body.title) || '').trim();
      if (!title) throw new HttpError(400, 'A non-empty title is required', 'INVALID_TITLE');

      const document = await store.renameDocument(req.document.id, title.slice(0, 255));
      await store.recordAudit({
        userId: req.user.id,
        documentId: req.document.id,
        action: 'document.rename',
        details: { title }
      });
      res.json({ document: { ...document, role: req.documentRole } });
    },

    /**
     * DELETE /api/documents/:id
     *
     * The metadata row is soft-deleted and the engine's pages are left in
     * place. Reclaiming pages needs a free-space map, which design.md does
     * not specify; an unreferenced page chain is inert.
     */
    async remove(req, res) {
      await store.softDeleteDocument(req.document.id);
      engine.indexManager.removeDocument(req.document.id);
      await store.recordAudit({
        userId: req.user.id,
        documentId: req.document.id,
        action: 'document.delete'
      });
      res.status(204).send();
    },

    /** PUT /api/documents/:id/permissions */
    async share(req, res) {
      const { userId, username, role } = req.body || {};
      let target;
      if (userId !== undefined && userId !== null) {
        if (!Number.isInteger(Number(userId))) {
          throw new HttpError(400, 'A numeric userId is required', 'INVALID_USER_ID');
        }
        target = await store.findUserById(Number(userId));
      } else if (username) {
        target = await store.findUserByUsername(String(username).trim());
      } else {
        throw new HttpError(400, 'A numeric userId is required', 'INVALID_USER_ID');
      }

      if (!Object.values(ROLES).includes(role)) {
        throw new HttpError(400, `Role must be one of ${Object.values(ROLES).join(', ')}`, 'INVALID_ROLE');
      }

      if (!target) throw new HttpError(404, `User ${userId || username} not found`, 'USER_NOT_FOUND');

      const permission = await store.setPermission(req.document.id, target.id, role);
      await store.recordAudit({
        userId: req.user.id,
        documentId: req.document.id,
        action: 'document.share',
        details: { grantedTo: target.id, role }
      });
      res.json({ permission });
    },

    /** GET /api/documents/:id/permissions */
    async listPermissions(req, res) {
      res.json({ permissions: await store.listPermissions(req.document.id) });
    },

    /** DELETE /api/documents/:id/permissions/:userId */
    async revoke(req, res) {
      const userId = Number(req.params.userId);
      if (userId === req.document.ownerId) {
        throw new HttpError(400, 'The owner permission cannot be revoked', 'CANNOT_REVOKE_OWNER');
      }
      const removed = await store.revokePermission(req.document.id, userId);
      if (!removed) throw new HttpError(404, 'No such permission', 'PERMISSION_NOT_FOUND');

      await store.recordAudit({
        userId: req.user.id,
        documentId: req.document.id,
        action: 'document.revoke',
        details: { revokedFrom: userId }
      });
      res.status(204).send();
    }
  };
}

module.exports = { createDocumentController };

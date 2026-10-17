/**
 * CollabWrite - Server Bootstrap
 *
 * Start-up order matters and is enforced here:
 *   1. Open the support store (PostgreSQL) - needed for authentication.
 *   2. Start the engine, which runs crash recovery before serving anything.
 *   3. Only then bind the HTTP and WebSocket listeners.
 *
 * Accepting a request before recovery finished would let a client read a page
 * that is about to be rolled back, which would defeat the whole point of the
 * recovery manager.
 */

'use strict';

require('dotenv').config();

const http = require('http');

const { createApp } = require('./app');
const { attachSocketServer } = require('./realtime/socket');
const { createStore } = require('./stores');
const { Engine } = require('../engine/Engine');
const { createLogger } = require('../config/logger');

const log = createLogger('Server');

/**
 * Builds a fully wired server without listening. Exported for integration
 * tests, which drive it through supertest.
 *
 * @param {object} [options]
 * @param {object} [options.engineConfig]
 * @param {object} [options.storeConfig]
 * @returns {Promise<{app:object, server:object, engine:Engine, store:object, io:object}>}
 */
async function buildServer({ engineConfig = {}, storeConfig = {} } = {}) {
  const store = await createStore(storeConfig);
  const engine = new Engine(engineConfig);
  await engine.start();

  const app = createApp({ store, engine });
  const server = http.createServer(app);
  const io = attachSocketServer(server, { store, engine });

  return { app, server, engine, store, io };
}

/** Boots and listens. */
async function main() {
  const port = Number(process.env.PORT || 3001);
  const host = process.env.HOST || '0.0.0.0';

  const { server, engine, store, io } = await buildServer();

  let bound = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          server.removeListener('error', reject);
          resolve();
        });
      });
      bound = true;
      break;
    } catch (err) {
      if (err.code === 'EADDRINUSE' && attempt < 5) {
        log.warn('Port in use or lingering in TIME_WAIT, retrying in 1s...', { port, attempt, maxRetries: 5 });
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        throw err;
      }
    }
  }

  if (bound) {
    log.info('CollabWrite listening', { host, port, recovery: engine.recoveryReport });
  }

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info('Shutting down', { signal });

    try {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      io.close();
      await new Promise((resolve) => server.close(resolve));
      await engine.stop();
      await store.close();
    } catch (_err) {
      // Ignore cleanup error during shutdown
    }
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2'));
}

if (require.main === module) {
  main().catch((error) => {
    log.error('Fatal start-up error', { message: error.message, stack: error.stack });
    process.exit(1);
  });
}

module.exports = { buildServer, main };

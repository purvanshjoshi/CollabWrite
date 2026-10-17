/**
 * Vite configuration for the React presentation layer.
 *
 * The client is a separate build from the server: `npm run client:build`
 * emits static files that nginx serves in the Docker setup, while the Express
 * app serves only the API. Keeping them apart is what lets architecture.md's
 * claim that the presentation layer never touches storage internals be true
 * by construction rather than by discipline.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src/client',
  plugins: [react()],
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api/': { target: process.env.VITE_API_URL || 'http://localhost:3001', changeOrigin: true },
      '/socket.io': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (['ECONNABORTED', 'ECONNRESET', 'ECONNREFUSED'].includes(err?.code)) {
              return;
            }
            // eslint-disable-next-line no-console
            console.error('[proxy-error]', err.message);
          });
        }
      }
    }
  },
  resolve: {
    alias: {
      'socket.io-client': 'socket.io-client/dist/socket.io.js'
    }
  }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Base path resolution:
 * - Local dev / generic static hosting: '/' (default).
 * - GitHub Pages project sites: the deploy workflow sets VITE_BASE_PATH to
 *   "/<repository-name>/" so asset URLs resolve under the repo sub-path.
 * - User/Org pages sites (user.github.io) can set VITE_BASE_PATH='/'.
 */
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});

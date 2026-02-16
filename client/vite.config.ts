import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// The SPA lives at /app on the server, so all asset paths must be relative.
// Setting base to './' means the built index.html uses relative paths, which
// allows the Express catch-all to serve it correctly from any /app/* sub-path.
export default defineConfig({
  plugins: [vue()],
  base: './',
  // root must point to the client/ directory so Vite can find index.html
  // regardless of which directory the build command is invoked from.
  root: fileURLToPath(new URL('.', import.meta.url)),
  build: {
    outDir: fileURLToPath(new URL('../dist/public', import.meta.url)),
    emptyOutDir: true,
  },
})

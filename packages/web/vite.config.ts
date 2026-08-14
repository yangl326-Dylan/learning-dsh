import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static build for the learning page.
// The dist/ output is served by the dsh plugin (@dylan/learning-dsh)
// under the /learning route. All routes are hash-based so the plugin
// only needs to serve one path (/learning).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
})
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  root: './',
  publicDir: 'public',
  server: {
    port: 5173,  // Changed to match your backend's CORS settings
    proxy: {
      '/api': {
        target: 'http://localhost:3001',  // Your backend server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      }
    },
    cors: true,
    open: true
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    emptyOutDir: true
  }
})
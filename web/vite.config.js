import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server forwards /api/* to the FastAPI backend, so the browser only
// ever talks to one origin (no CORS headaches while developing).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': process.env.VITE_BACKEND || 'http://127.0.0.1:8002' },
  },
})

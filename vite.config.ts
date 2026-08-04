import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In dev, `npm run dev` only serves the frontend (port 5173) — proxy
    // /api/* to the FastAPI backend (`uvicorn api.index:app --reload`,
    // port 8000) so relative fetches from src/lib/apiClient.ts work the
    // same way they do in production (same-origin on Vercel).
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})

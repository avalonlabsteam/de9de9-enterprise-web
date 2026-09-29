import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // The API's CORS allowlist names http://localhost:5173 (and the production
    // front, https://entreprise.de9de9.dz). If 5173 is taken, fail loudly
    // instead of drifting to 5174, where every call would be blocked by CORS.
    port: 5173,
    strictPort: true,
  },
})

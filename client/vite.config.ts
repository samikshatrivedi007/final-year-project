import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['scms.clg'],
    proxy: {
      '/api': {
        target: 'https://final-year-project-2-acp7.onrender.com',
        changeOrigin: true
      }
    }
  }
})

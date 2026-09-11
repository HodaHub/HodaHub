import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // allows access from your phone over the network/ngrok
    allowedHosts: ['.ngrok-free.app'], // allow any ngrok-free.app subdomain
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/search': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
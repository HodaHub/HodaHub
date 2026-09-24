import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { spawn } from 'child_process'
import http from 'http'

// Auto-start WhatsApp Gateway in dev mode if not already running on port 3001
function whatsappGatewayPlugin() {
  return {
    name: 'whatsapp-gateway-plugin',
    configureServer(server: any) {
      setTimeout(() => {
        const req = http.get('http://localhost:3001/status', () => {
          // Already running
        })
        req.on('error', () => {
          console.log('\n📲 [HodaHub Vite] Auto-starting WhatsApp Gateway on port 3001...')
          const child = spawn('node', ['server/whatsapp-gateway.js'], {
            stdio: 'inherit',
            shell: true,
          })
          server.httpServer?.on('close', () => {
            try {
              child.kill()
            } catch {
              // ignore
            }
          })
        })
      }, 800)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), whatsappGatewayPlugin()],
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
      '/whatsapp-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/whatsapp-api/, ''),
      },
    },
  },
})
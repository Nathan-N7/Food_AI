import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      '/auth/': 'http://localhost:8000',
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        // OAuth starts with a full-page navigation to the backend. Do not
        // satisfy it with the cached SPA shell, or React will receive
        // `/auth/42` and report that the route does not exist.
        navigateFallbackDenylist: [/^\/auth\//],
      },
      manifest: {
        name: 'Food AI',
        short_name: 'Food',
        description: 'Crie imagens profissional de lanches com IA',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})

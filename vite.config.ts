import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Auf GitHub Pages liegt die App unter /<repo>/. Lokal und bei eigenem Host: '/'.
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: base + 'index.html',
      },
      manifest: {
        name: 'RLT-Schema',
        short_name: 'RLT-Schema',
        description: 'Anlagenschemata fuer Raumlufttechnik zeichnen und dokumentieren',
        lang: 'de',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'any',
        background_color: '#f4f5f7',
        theme_color: '#1f2933',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
  },
})

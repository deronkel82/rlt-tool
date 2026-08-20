import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Auf GitHub Pages liegt die App unter /<repo>/. Lokal und bei eigenem Host: '/'.
const rawBase = process.env.VITE_BASE ?? '/'
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`

const APP_NAME = 'RLT-Schema'

function manifest() {
  return {
    name: 'RLT-Schema',
    short_name: 'RLT-Schema',
    description: 'Anlagenschemata für Raumlufttechnik zeichnen und dokumentieren',
    lang: 'de',
    dir: 'ltr',
    start_url: base,
    scope: base,
    display: 'standalone',
    orientation: 'any',
    background_color: '#eef0f4',
    theme_color: '#1f2933',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

/** Alle Dateien unterhalb eines Verzeichnisses, mit Schrägstrichen als Trenner. */
function alleDateien(dir: string, wurzel = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const voll = join(dir, name)
    return statSync(voll).isDirectory()
      ? alleDateien(voll, wurzel)
      : [relative(wurzel, voll).split('\\').join('/')]
  })
}

/**
 * Erzeugt Manifest und Service Worker selbst. Das ist wenig Code, laeuft in
 * jeder Umgebung zuverlaessig und legt genau fest, was offline verfuegbar ist.
 */
function pwa(): Plugin {
  return {
    name: 'rlt-pwa',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: JSON.stringify(manifest(), null, 2),
      })
    },
    closeBundle() {
      const out = 'dist'
      const vorrat = alleDateien(out)
        .filter((f) => /\.(js|css|html|png|svg|webmanifest|woff2)$/.test(f))
        .filter((f) => f !== 'sw.js')
        .sort()

      const version = createHash('sha1')
        .update(vorrat.map((f) => `${f}:${statSync(join(out, f)).size}`).join('|'))
        .digest('hex')
        .slice(0, 12)

      const vorlage = readFileSync('src/sw-template.js', 'utf8')
      const sw = vorlage
        .replace('__CACHE_NAME__', `${APP_NAME}-${version}`)
        .replace('__BASE__', base)
        .replace('__ASSETS__', JSON.stringify(vorrat.map((f) => base + f), null, 2))

      writeFileSync(join(out, 'sw.js'), sw)
      this.info?.(`Service Worker geschrieben: ${vorrat.length} Dateien im Offline-Vorrat`)
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), pwa()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
  },
})

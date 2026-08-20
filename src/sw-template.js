/*
 * Service Worker für RLT-Schema. Die Platzhalter werden beim Bauen ersetzt
 * (siehe vite.config.ts). Strategie: alles Nötige beim Installieren in den
 * Vorrat legen, danach zuerst aus dem Vorrat bedienen. So startet die App auf
 * dem iPad auch ohne Netzverbindung.
 */
const CACHE = '__CACHE_NAME__'
const BASE = '__BASE__'
const ASSETS = __ASSETS__

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'sofort-aktualisieren') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Seitenaufrufe immer auf die App-Seite zurückführen, damit ein Neuladen
  // auch offline funktioniert.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(BASE + 'index.html').then((treffer) => treffer || fetch(request)),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((treffer) => {
      if (treffer) return treffer
      return fetch(request)
        .then((antwort) => {
          if (antwort.ok && antwort.type === 'basic') {
            const kopie = antwort.clone()
            caches.open(CACHE).then((cache) => cache.put(request, kopie))
          }
          return antwort
        })
        .catch(() => caches.match(BASE + 'index.html'))
    }),
  )
})

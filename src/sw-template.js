/*
 * Service Worker für RLT-Schema. Die Platzhalter werden beim Bauen ersetzt
 * (siehe vite.config.ts).
 *
 * Strategie:
 * - Der Seitenaufruf geht zuerst ans Netz, damit eine neu veröffentlichte
 *   Fassung sofort ankommt; erst wenn das Netz fehlt oder zu lange braucht,
 *   kommt die Seite aus dem Vorrat. Ohne das bliebe die App auf dem Stand
 *   stehen, der beim Ablegen auf dem Home-Bildschirm aktuell war.
 * - Alles Übrige trägt eine Prüfsumme im Dateinamen und kann darum bedenkenlos
 *   zuerst aus dem Vorrat kommen.
 */
const CACHE = '__CACHE_NAME__'
const BASE = '__BASE__'
const ASSETS = __ASSETS__

/** Nach dieser Zeit gilt das Netz als nicht verfügbar. */
const NETZ_TIMEOUT = 3500

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

// Die Seite bittet um sofortiges Übernehmen, wenn der Nutzer die neue Fassung
// laden möchte.
self.addEventListener('message', (event) => {
  if (event.data === 'sofort-aktualisieren') self.skipWaiting()
})

function mitZeitgrenze(request) {
  return new Promise((erfuellen, ablehnen) => {
    const uhr = setTimeout(() => ablehnen(new Error('Zeitüberschreitung')), NETZ_TIMEOUT)
    fetch(request).then(
      (antwort) => {
        clearTimeout(uhr)
        erfuellen(antwort)
      },
      (fehler) => {
        clearTimeout(uhr)
        ablehnen(fehler)
      },
    )
  })
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Seitenaufruf: zuerst das Netz, dann der Vorrat.
  if (request.mode === 'navigate') {
    event.respondWith(
      mitZeitgrenze(new Request(url.href, { cache: 'no-cache', credentials: 'same-origin' }))
        .then((antwort) => {
          if (antwort.ok) {
            const kopie = antwort.clone()
            caches.open(CACHE).then((cache) => cache.put(BASE + 'index.html', kopie))
          }
          return antwort
        })
        .catch(() =>
          caches.match(BASE + 'index.html').then((treffer) => treffer || fetch(request)),
        ),
    )
    return
  }

  // Übrige Dateien: zuerst der Vorrat, sonst nachladen und aufnehmen.
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

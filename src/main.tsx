import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AKTUALISIERUNG } from './pwa'
import './styles.css'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Offlinebetrieb: Der Service Worker wird nur im gebauten Stand registriert,
// damit die Entwicklung nicht gegen einen alten Vorrat läuft.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      // 'none' erzwingt, dass der Browser das Worker-Skript selbst nicht aus
      // seinem Zwischenspeicher bedient — sonst käme eine neue Fassung erst
      // verzögert an.
      .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
      .then((reg) => {
        const melden = (worker: ServiceWorker | null) => {
          if (!worker) return
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent(AKTUALISIERUNG, { detail: reg }))
            }
          })
        }
        // Beim Start bereits wartende Fassung melden, sonst auf neue warten.
        if (reg.waiting && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent(AKTUALISIERUNG, { detail: reg }))
        }
        reg.addEventListener('updatefound', () => melden(reg.installing))

        // Beim Zurückholen der App nachsehen, ob es etwas Neues gibt. Auf dem
        // iPad wird eine Web-App aus dem Speicher fortgesetzt statt neu
        // gestartet; ohne diese Prüfung bliebe sie lange auf ihrem Stand.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void reg.update().catch(() => {})
        })
      })
      .catch(() => {
        /* Ohne Service Worker läuft die App weiter, nur nicht offline. */
      })

    // Übernimmt eine neue Fassung, wird einmalig neu geladen. Das geschieht nur
    // nach ausdrücklicher Bestätigung, da der Wechsel sonst nicht ausgelöst wird.
    let neuGeladen = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (neuGeladen) return
      neuGeladen = true
      window.location.reload()
    })
  })
}

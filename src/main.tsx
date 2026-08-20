import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
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
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* Ohne Service Worker läuft die App weiter, nur nicht offline. */
    })
  })
}

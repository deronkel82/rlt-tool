/** Ereignis, mit dem der Service Worker eine bereitliegende Fassung meldet. */
export const AKTUALISIERUNG = 'rlt:aktualisierung'

/**
 * Bittet die wartende Fassung, sofort zu übernehmen. Der anschließende Wechsel
 * löst in main.tsx ein einmaliges Neuladen aus.
 */
export function aktualisierungAnwenden(reg: ServiceWorkerRegistration): void {
  if (reg.waiting) reg.waiting.postMessage('sofort-aktualisieren')
  else void reg.update().catch(() => {})
}

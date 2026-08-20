/** UTF-8-sicherer Base64-Datenstring fuer ein SVG. */
export function svgToDataUrl(svg: string): string {
  const bytes = new TextEncoder().encode(svg)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return `data:image/svg+xml;base64,${btoa(binary)}`
}

/** SVG über ein Bild auf eine Leinwand zeichnen und als PNG ausgeben. */
export function svgToPngBlob(svg: string, width: number, height: number, scale: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'sync'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(width * scale))
      canvas.height = Math.max(1, Math.round(height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Die Zeichenfläche konnte nicht vorbereitet werden.'))
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Das Bild konnte nicht erzeugt werden.'))
      }, 'image/png')
    }
    img.onerror = () => reject(new Error('Das Schema konnte nicht in ein Bild umgewandelt werden.'))
    img.src = svgToDataUrl(svg)
  })
}

/**
 * Datei an den Nutzer ausgeben. Auf dem iPad wird der Teilen-Dialog verwendet,
 * damit die Datei in Dateien, Fotos oder eine App gelegt werden kann; sonst
 * laeuft es als normaler Download.
 */
export async function deliverFile(blob: Blob, filename: string, titel: string): Promise<'geteilt' | 'geladen'> {
  const file = new File([blob], filename, { type: blob.type })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: titel })
      return 'geteilt'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'geteilt'
      // Sonst auf den Download zurückfallen
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'geladen'
}

/** Dateinamen aus dem Projektnamen ableiten. */
export function safeFilename(base: string, ext: string): string {
  const clean = (base || 'RLT-Schema')
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\-_ ]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
  return `${clean || 'RLT-Schema'}.${ext}`
}

/** Datei vom Nutzer einlesen. */
export function readTextFile(accept: string): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      const reader = new FileReader()
      reader.onload = () => resolve({ name: file.name, text: String(reader.result ?? '') })
      reader.onerror = () => resolve(null)
      reader.readAsText(file)
    }
    input.click()
  })
}

// Erzeugt die App-Icons als PNG ohne zusaetzliche Abhaengigkeiten.
// Motiv: das Ventilatorsymbol nach DIN EN 12792 — Kreis mit Foerderrichtungsdreieck.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public', 'icons')

const BG = [31, 41, 51]
const FG = [255, 255, 255]
const SS = 3 // Kantenglättung durch dreifaches Überabtasten

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** Punkt im Dreieck? */
function inTriangle(px, py, a, b, c) {
  const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
  const w1 = ((b[1] - c[1]) * (px - c[0]) + (c[0] - b[0]) * (py - c[1])) / d
  const w2 = ((c[1] - a[1]) * (px - c[0]) + (a[0] - c[0]) * (py - c[1])) / d
  const w3 = 1 - w1 - w2
  return w1 >= 0 && w2 >= 0 && w3 >= 0
}

function drawIcon(size, { padding = 0.1, rounded = true }) {
  const S = size * SS
  const rgba = Buffer.alloc(size * size * 4)
  const cx = S / 2
  const cy = S / 2
  const radius = (S / 2) * (1 - padding * 2)
  const ring = radius * 0.075
  const tri = [
    [cx - radius * 0.5, cy - radius * 0.62],
    [cx - radius * 0.5, cy + radius * 0.62],
    [cx + radius * 0.76, cy],
  ]
  const corner = rounded ? S * 0.22 : 0

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rs = 0
      let gs = 0
      let bs = 0
      let as = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x * SS + sx + 0.5
          const py = y * SS + sy + 0.5
          // Abgerundetes Quadrat als Hintergrund
          let inside = true
          if (corner > 0) {
            const dx = Math.max(corner - px, px - (S - corner), 0)
            const dy = Math.max(corner - py, py - (S - corner), 0)
            inside = Math.hypot(dx, dy) <= corner
          }
          if (!inside) continue
          const d = Math.hypot(px - cx, py - cy)
          const onRing = d <= radius && d >= radius - ring
          const inTri = inTriangle(px, py, tri[0], tri[1], tri[2])
          const triEdge = inTri && !inTriangleShrunk(px, py, tri, ring, radius)
          const white = onRing || triEdge
          const c = white ? FG : BG
          rs += c[0]
          gs += c[1]
          bs += c[2]
          as += 255
        }
      }
      const n = SS * SS
      const i = (y * size + x) * 4
      rgba[i] = Math.round(rs / n)
      rgba[i + 1] = Math.round(gs / n)
      rgba[i + 2] = Math.round(bs / n)
      rgba[i + 3] = Math.round(as / n)
    }
  }
  return encodePng(size, size, rgba)
}

/** Dreieck um die Strichstaerke verkleinert, ergibt die Kontur. */
function inTriangleShrunk(px, py, tri, w, radius) {
  const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3
  const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3
  // Inkreisradius des Dreiecks naeherungsweise, damit die Kontur die gewuenschte Staerke bekommt.
  const k = Math.max(0, 1 - w / (radius * 0.33))
  const s = tri.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k])
  return inTriangle(px, py, s[0], s[1], s[2])
}

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'icon-192.png'), drawIcon(192, { padding: 0.16 }))
writeFileSync(join(outDir, 'icon-512.png'), drawIcon(512, { padding: 0.16 }))
writeFileSync(join(outDir, 'icon-maskable-512.png'), drawIcon(512, { padding: 0.26 }))
writeFileSync(join(outDir, 'apple-touch-icon.png'), drawIcon(180, { padding: 0.16 }))
console.log('Icons erzeugt in', outDir)

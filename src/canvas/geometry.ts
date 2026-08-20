import type { PortDef, PortDir, SymbolDef } from '../catalog/types'
import type { RltNode } from '../state/types'

export interface Pt {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface PortPoint extends Pt {
  dir: PortDir
}

const DIRS: PortDir[] = ['right', 'bottom', 'left', 'top']

/** Anschlussrichtung nach Drehung und Spiegelung des Symbols. */
export function rotateDir(d: PortDir, rot: number, flip: boolean): PortDir {
  let dd = d
  if (flip) dd = dd === 'left' ? 'right' : dd === 'right' ? 'left' : dd
  const i = DIRS.indexOf(dd)
  return DIRS[(i + rot / 90 + 4) % 4]
}

export function dirVector(d: PortDir): Pt {
  switch (d) {
    case 'left': return { x: -1, y: 0 }
    case 'right': return { x: 1, y: 0 }
    case 'top': return { x: 0, y: -1 }
    default: return { x: 0, y: 1 }
  }
}

export function isHorizontal(d: PortDir): boolean {
  return d === 'left' || d === 'right'
}

/** Lage eines Anschlusses in Zeichnungskoordinaten. */
export function portPoint(node: RltNode, port: PortDef): PortPoint {
  let px = port.rx * node.w
  const py = port.ry * node.h
  if (node.flip) px = node.w - px
  const cx = node.w / 2
  const cy = node.h / 2
  const a = (node.rot * Math.PI) / 180
  const dx = px - cx
  const dy = py - cy
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  return {
    x: node.x + cx + dx * cos - dy * sin,
    y: node.y + cy + dx * sin + dy * cos,
    dir: rotateDir(port.dir, node.rot, node.flip),
  }
}

/** Sichtbarer Rahmen einer Komponente, Drehung eingerechnet. */
export function nodeBounds(node: RltNode): Rect {
  const cx = node.x + node.w / 2
  const cy = node.y + node.h / 2
  const swap = node.rot === 90 || node.rot === 270
  const w = swap ? node.h : node.w
  const h = swap ? node.w : node.h
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

export function findPort(def: SymbolDef, portId: string): PortDef | undefined {
  return def.ports.find((p) => p.id === portId)
}

export function rectContains(r: Rect, p: Pt): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y)
}

export function unionRect(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const r of rects) {
    x0 = Math.min(x0, r.x)
    y0 = Math.min(y0, r.y)
    x1 = Math.max(x1, r.x + r.w)
    y1 = Math.max(y1, r.y + r.h)
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

const STUB = 18
/** Ausweichabstand, wenn eine Leitung um die Bauteile herumgeführt werden muss. */
const DETOUR = 44

/**
 * Orthogonale Führung zwischen zwei Anschlüssen. Die Leitung verlaesst jeden
 * Anschluss zunächst geradlinig in dessen Richtung und wird dann über ein
 * verschiebbares Mittelsegment verbunden.
 */
export function routeOrthogonal(a: PortPoint, b: PortPoint, offset = 0): Pt[] {
  const va = dirVector(a.dir)
  const vb = dirVector(b.dir)
  // Stehen die Bauteile dicht beieinander, wird das gerade Anfangsstück
  // gekürzt, damit die Leitung keinen unnoetigen Bogen schlaegt.
  const dx = b.x - a.x
  const dy = b.y - a.y
  const reichweiteA = va.x * dx + va.y * dy
  const reichweiteB = vb.x * -dx + vb.y * -dy
  const sa = reichweiteA > 0 ? Math.max(4, Math.min(STUB, reichweiteA / 2)) : STUB
  const sb = reichweiteB > 0 ? Math.max(4, Math.min(STUB, reichweiteB / 2)) : STUB
  const a1 = { x: a.x + va.x * sa, y: a.y + va.y * sa }
  const b1 = { x: b.x + vb.x * sb, y: b.y + vb.y * sb }
  const pts: Pt[] = [{ x: a.x, y: a.y }, a1]

  const ah = isHorizontal(a.dir)
  const bh = isHorizontal(b.dir)

  if (ah && bh) {
    const mx = (a1.x + b1.x) / 2 + offset
    const okA = a.dir === 'right' ? mx >= a1.x : mx <= a1.x
    const okB = b.dir === 'right' ? mx >= b1.x : mx <= b1.x
    if (okA && okB) {
      pts.push({ x: mx, y: a1.y }, { x: mx, y: b1.y })
    } else {
      // Das Ziel liegt hinter dem Anschluss: senkrecht ausweichen.
      const flach = Math.abs(a1.y - b1.y) < 1
      const my = flach ? a1.y + DETOUR + offset : (a1.y + b1.y) / 2 + offset
      pts.push({ x: a1.x, y: my }, { x: b1.x, y: my })
    }
  } else if (!ah && !bh) {
    const my = (a1.y + b1.y) / 2 + offset
    const okA = a.dir === 'bottom' ? my >= a1.y : my <= a1.y
    const okB = b.dir === 'bottom' ? my >= b1.y : my <= b1.y
    if (okA && okB) {
      pts.push({ x: a1.x, y: my }, { x: b1.x, y: my })
    } else {
      const flach = Math.abs(a1.x - b1.x) < 1
      const mx = flach ? a1.x + DETOUR + offset : (a1.x + b1.x) / 2 + offset
      pts.push({ x: mx, y: a1.y }, { x: mx, y: b1.y })
    }
  } else if (ah) {
    pts.push({ x: b1.x, y: a1.y })
  } else {
    pts.push({ x: a1.x, y: b1.y })
  }

  pts.push(b1, { x: b.x, y: b.y })
  return simplify(pts)
}

/** Doppelte und auf einer Geraden liegende Punkte entfernen. */
export function simplify(pts: Pt[]): Pt[] {
  const out: Pt[] = []
  for (const p of pts) {
    const last = out[out.length - 1]
    if (last && Math.abs(last.x - p.x) < 0.01 && Math.abs(last.y - p.y) < 0.01) continue
    out.push(p)
  }
  const res: Pt[] = []
  for (let i = 0; i < out.length; i++) {
    const prev = res[res.length - 1]
    const next = out[i + 1]
    if (prev && next) {
      const collinearX = Math.abs(prev.x - out[i].x) < 0.01 && Math.abs(out[i].x - next.x) < 0.01
      const collinearY = Math.abs(prev.y - out[i].y) < 0.01 && Math.abs(out[i].y - next.y) < 0.01
      if (collinearX || collinearY) continue
    }
    res.push(out[i])
  }
  return res
}

/** Punktzug als SVG-Pfad mit abgerundeten Ecken. */
export function polylinePath(pts: Pt[], radius = 5): string {
  if (pts.length === 0) return ''
  if (pts.length < 3) return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${r2(p.x)} ${r2(p.y)}`).join('')
  let d = `M${r2(pts[0].x)} ${r2(pts[0].y)}`
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1]
    const cur = pts[i]
    const next = pts[i + 1]
    const inLen = Math.hypot(cur.x - prev.x, cur.y - prev.y)
    const outLen = Math.hypot(next.x - cur.x, next.y - cur.y)
    const rr = Math.min(radius, inLen / 2, outLen / 2)
    if (rr < 0.5) {
      d += `L${r2(cur.x)} ${r2(cur.y)}`
      continue
    }
    const p1 = lerp(cur, prev, rr / inLen)
    const p2 = lerp(cur, next, rr / outLen)
    d += `L${r2(p1.x)} ${r2(p1.y)}Q${r2(cur.x)} ${r2(cur.y)} ${r2(p2.x)} ${r2(p2.y)}`
  }
  const last = pts[pts.length - 1]
  d += `L${r2(last.x)} ${r2(last.y)}`
  return d
}

function lerp(from: Pt, to: Pt, t: number): Pt {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
}

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

/** Punkt in der Mitte eines Streckenzugs, fuer Beschriftung und Griff. */
export function polylineMidpoint(pts: Pt[]): Pt {
  if (pts.length === 0) return { x: 0, y: 0 }
  const lens: number[] = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    lens.push(l)
    total += l
  }
  let acc = 0
  for (let i = 0; i < lens.length; i++) {
    if (acc + lens[i] >= total / 2) {
      const t = lens[i] === 0 ? 0 : (total / 2 - acc) / lens[i]
      return lerp(pts[i], pts[i + 1], t)
    }
    acc += lens[i]
  }
  return pts[pts.length - 1]
}

/** Kürzester Abstand eines Punktes zu einem Streckenzug. */
export function distanceToPolyline(pts: Pt[], p: Pt): number {
  let min = Infinity
  for (let i = 1; i < pts.length; i++) {
    min = Math.min(min, distanceToSegment(pts[i - 1], pts[i], p))
  }
  return min
}

function distanceToSegment(a: Pt, b: Pt, p: Pt): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

export function snap(v: number, grid: number): number {
  return Math.round(v / grid) * grid
}

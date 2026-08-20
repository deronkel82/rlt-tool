import type { ReactNode } from 'react'
import type { DrawCtx } from './types'

/** Linienstärken im Symbol. Aeussere Kontur kraeftiger als Innenzeichnung. */
export const SW = { outline: 1.6, inner: 1.15, bold: 2.2, hair: 0.8 }

export function n(v: number): number {
  return Math.round(v * 100) / 100
}

/** Rechteckige Umhüllende eines Kanalbauteils. */
export function Box({ c, r = 0, fill }: { c: DrawCtx; r?: number; fill?: string }): ReactNode {
  return <rect x={0} y={0} width={c.w} height={c.h} rx={r} fill={fill ?? c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
}

/** Schraffur als einzelner Pfad. angle in Grad, gemessen von der x-Achse. */
export function hatch(x: number, y: number, w: number, h: number, spacing = 5, angle = 45): string {
  const rad = (angle * Math.PI) / 180
  const dx = Math.cos(rad)
  const dy = Math.sin(rad)
  // Normale der Schraffurlinien
  const nx = -dy
  const ny = dx
  const corners = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ]
  const proj = corners.map(([cx, cy]) => cx * nx + cy * ny)
  const min = Math.min(...proj)
  const max = Math.max(...proj)
  const len = Math.hypot(w, h)
  const parts: string[] = []
  for (let d = Math.ceil(min / spacing) * spacing; d <= max; d += spacing) {
    // Punkt auf der Linie
    const px = nx * d
    const py = ny * d
    const seg = clipToRect(px - dx * len, py - dy * len, px + dx * len, py + dy * len, x, y, w, h)
    if (seg) parts.push(`M${n(seg[0])} ${n(seg[1])}L${n(seg[2])} ${n(seg[3])}`)
  }
  return parts.join('')
}

/** Liang-Barsky: Strecke auf ein Rechteck zuschneiden. */
function clipToRect(
  x0: number, y0: number, x1: number, y1: number,
  rx: number, ry: number, rw: number, rh: number,
): [number, number, number, number] | null {
  const dx = x1 - x0
  const dy = y1 - y0
  let t0 = 0
  let t1 = 1
  const p = [-dx, dx, -dy, dy]
  const q = [x0 - rx, rx + rw - x0, y0 - ry, ry + rh - y0]
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null
    } else {
      const t = q[i] / p[i]
      if (p[i] < 0) { if (t > t1) return null; if (t > t0) t0 = t }
      else { if (t < t0) return null; if (t < t1) t1 = t }
    }
  }
  return [x0 + t0 * dx, y0 + t0 * dy, x0 + t1 * dx, y0 + t1 * dy]
}

/** Zickzacklinie, z.B. Tropfenabscheider. Verlaeuft entlang y von y0 bis y1. */
export function zigzagV(x: number, y0: number, y1: number, amp: number, teeth: number): string {
  const step = (y1 - y0) / teeth
  let d = `M${n(x - amp)} ${n(y0)}`
  for (let i = 0; i < teeth; i++) {
    const yMid = y0 + step * (i + 0.5)
    const yEnd = y0 + step * (i + 1)
    d += `L${n(x + amp)} ${n(yMid)}L${n(x - amp)} ${n(yEnd)}`
  }
  return d
}

/** Wellenlinie entlang x. */
export function waveH(x0: number, x1: number, y: number, amp: number, waves: number): string {
  const step = (x1 - x0) / waves
  let d = `M${n(x0)} ${n(y)}`
  for (let i = 0; i < waves; i++) {
    const a = x0 + step * i
    d += `q${n(step / 4)} ${n(-amp)} ${n(step / 2)} 0q${n(step / 4)} ${n(amp)} ${n(step / 2)} 0`
    void a
  }
  return d
}

/** Punktraster, z.B. Schalldämpfer-Füllung oder Aktivkohle. */
export function dots(c: DrawCtx, x: number, y: number, w: number, h: number, step: number, r: number): ReactNode {
  const out: ReactNode[] = []
  let k = 0
  for (let iy = y + step / 2; iy < y + h; iy += step) {
    for (let ix = x + step / 2; ix < x + w; ix += step) {
      out.push(<circle key={k++} cx={n(ix)} cy={n(iy)} r={r} fill={c.t.line} stroke="none" />)
    }
  }
  return <g>{out}</g>
}

/** Pfeilspitze an (x,y), Richtung dir in Grad (0 = nach rechts). */
export function arrowHead(x: number, y: number, dir: number, size = 5): string {
  const rad = (dir * Math.PI) / 180
  const ux = Math.cos(rad)
  const uy = Math.sin(rad)
  const px = -uy
  const py = ux
  const bx = x - ux * size
  const by = y - uy * size
  return `M${n(x)} ${n(y)}L${n(bx + px * size * 0.55)} ${n(by + py * size * 0.55)}L${n(bx - px * size * 0.55)} ${n(by - py * size * 0.55)}Z`
}

/** Kleiner Buchstabe/Zeichen mittig in einem Symbol. */
export function Glyph({
  c, x, y, children, size = 11, weight = 500, anchor = 'middle', baseline = 'central', color,
}: {
  c: DrawCtx; x: number; y: number; children: ReactNode; size?: number; weight?: number
  anchor?: 'start' | 'middle' | 'end'; baseline?: 'central' | 'auto'; color?: string
}): ReactNode {
  // Drehung und Spiegelung des Symbols zurückrechnen, damit Schrift lesbar bleibt.
  const gegen =
    c.rot === 0 && !c.flip
      ? undefined
      : `translate(${n(x)} ${n(y)}) scale(${c.flip ? -1 : 1} 1) rotate(${-c.rot}) translate(${n(-x)} ${n(-y)})`
  return (
    <text
      transform={gegen}
      x={n(x)} y={n(y)} fontSize={size} fontWeight={weight}
      textAnchor={anchor} dominantBaseline={baseline}
      fill={color ?? c.t.line} stroke="none"
      fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
    >
      {children}
    </text>
  )
}

/** Stellantrieb-Symbol (Kreis mit M) über einem Bauteil. */
export function Actuator({ c, x, y, letter = 'M', r = 7 }: { c: DrawCtx; x: number; y: number; letter?: string; r?: number }): ReactNode {
  return (
    <g>
      <circle cx={n(x)} cy={n(y)} r={r} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.inner} />
      <Glyph c={c} x={x} y={y} size={r * 1.3}>{letter}</Glyph>
    </g>
  )
}

/** Archimedische Spirale, z. B. Spiralgehäuse eines Radialventilators. */
export function spiral(cx: number, cy: number, r0: number, r1: number, turns = 1, startDeg = 180, steps = 48): string {
  const a0 = (startDeg * Math.PI) / 180
  const total = turns * 2 * Math.PI
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const ang = a0 + total * t
    const r = r0 + (r1 - r0) * t
    const x = cx + Math.cos(ang) * r
    const y = cy + Math.sin(ang) * r
    d += (i === 0 ? 'M' : 'L') + n(x) + ' ' + n(y)
  }
  return d
}

/** Heizwendel als Zickzack entlang x (Elektroerhitzer). */
export function coil(x0: number, x1: number, y: number, amp: number, teeth: number): string {
  const step = (x1 - x0) / teeth
  let d = `M${n(x0)} ${n(y)}`
  for (let i = 0; i < teeth; i++) {
    d += `L${n(x0 + step * (i + 0.25))} ${n(y - amp)}L${n(x0 + step * (i + 0.75))} ${n(y + amp)}`
  }
  d += `L${n(x1)} ${n(y)}`
  return d
}

/** Kreisbogen als Pfad. */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0x = cx + Math.cos((a0 * Math.PI) / 180) * r
  const p0y = cy + Math.sin((a0 * Math.PI) / 180) * r
  const p1x = cx + Math.cos((a1 * Math.PI) / 180) * r
  const p1y = cy + Math.sin((a1 * Math.PI) / 180) * r
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0
  const sweep = a1 > a0 ? 1 : 0
  return `M${n(p0x)} ${n(p0y)}A${r} ${r} 0 ${large} ${sweep} ${n(p1x)} ${n(p1y)}`
}

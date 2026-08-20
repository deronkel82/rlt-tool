import { requireSymbol } from '../catalog'
import type { PortDef } from '../catalog/types'
import type { RltDoc, RltNode } from '../state/types'
import { dirVector, portPoint, type Pt } from './geometry'

export interface SnapResult {
  /** Zusaetzliche Verschiebung, damit die Anschlüsse fluchten */
  dx: number
  dy: number
  from: { node: string; port: string }
  to: { node: string; port: string }
}

/** Abstand zwischen zwei aneinandergereihten Bauteilen. */
const GAP = 24
const THRESHOLD = 34

const OPPOSITE: Record<string, string> = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' }

function freePorts(doc: RltDoc, nodeId: string, ports: PortDef[]): PortDef[] {
  return ports.filter(
    (p) => !doc.edges.some((e) => (e.a.node === nodeId && e.a.port === p.id) || (e.b.node === nodeId && e.b.port === p.id)),
  )
}

/**
 * Strang-Modus: eine gezogene Komponente rastet an einem freien Anschluss einer
 * anderen Komponente ein, sobald sich zwei zueinander passende Anschlüsse nahe
 * kommen.
 */
export function findSnap(doc: RltDoc, moved: RltNode): SnapResult | null {
  const def = requireSymbol(moved.type)
  const own = freePorts(doc, moved.id, def.ports)
  if (own.length === 0) return null

  let best: SnapResult | null = null
  let bestDist = THRESHOLD

  for (const other of doc.nodes) {
    if (other.id === moved.id) continue
    const otherDef = requireSymbol(other.type)
    if (otherDef.layer === 'background') continue
    const others = freePorts(doc, other.id, otherDef.ports)
    for (const op of others) {
      const opw = portPoint(other, op)
      for (const mp of own) {
        if (mp.kind !== op.kind) continue
        const mpw = portPoint(moved, mp)
        if (mpw.dir !== OPPOSITE[opw.dir]) continue
        const v = dirVector(opw.dir)
        const target: Pt = { x: opw.x + v.x * GAP, y: opw.y + v.y * GAP }
        const d = Math.hypot(target.x - mpw.x, target.y - mpw.y)
        if (d < bestDist) {
          bestDist = d
          best = {
            dx: target.x - mpw.x,
            dy: target.y - mpw.y,
            from: { node: moved.id, port: mp.id },
            to: { node: other.id, port: op.id },
          }
        }
      }
    }
  }
  return best
}

/** Nächstgelegener Anschluss zu einem Punkt, fuer das Ziehen einer Leitung. */
export function nearestPort(
  doc: RltDoc,
  p: Pt,
  radius: number,
  filter?: (nodeId: string, port: PortDef) => boolean,
): { node: string; port: string; kind: PortDef['kind'] } | null {
  let best: { node: string; port: string; kind: PortDef['kind'] } | null = null
  let bestDist = radius
  for (const node of doc.nodes) {
    const def = requireSymbol(node.type)
    for (const port of def.ports) {
      if (filter && !filter(node.id, port)) continue
      const pw = portPoint(node, port)
      const d = Math.hypot(pw.x - p.x, pw.y - p.y)
      if (d < bestDist) {
        bestDist = d
        best = { node: node.id, port: port.id, kind: port.kind }
      }
    }
  }
  return best
}

import type { ReactNode } from 'react'
import { requireSymbol, withComputed } from '../catalog'
import { edgeParamDefs, withComputedEdge } from '../catalog/edge'
import type { SymbolDef } from '../catalog/types'
import { FONT, formatShort } from '../format'
import type { RltDoc, RltEdge, RltNode } from '../state/types'
import type { Theme } from '../theme'
import { findPort, nodeBounds, polylineMidpoint, polylinePath, portPoint, routeOrthogonal, type Pt } from './geometry'

export interface RenderOptions {
  theme: Theme
  /** Luftarten farbig darstellen */
  farbcode: boolean
  /** Beschriftungen zeichnen */
  labels: boolean
}

const LABEL_SIZE = 9.5
const TAG_SIZE = 10.5
const LINE_HEIGHT = 11.5

/** Textzeilen der Beschriftung einer Komponente. */
export function nodeLabelLines(node: RltNode, def: SymbolDef): string[] {
  const values = withComputed(def, node.params)
  const lines: string[] = []
  for (const key of node.visible) {
    const pd = def.params.find((p) => p.key === key)
    const text = formatShort(pd, values[key] ?? null)
    if (text) lines.push(text)
  }
  return lines
}

export function edgeLabelLines(edge: RltEdge): string[] {
  const defs = edgeParamDefs(edge.kind)
  const values = withComputedEdge(edge.kind, edge.params)
  const lines: string[] = []
  for (const key of edge.visible) {
    const pd = defs.find((p) => p.key === key)
    const text = formatShort(pd, values[key] ?? null)
    if (text) lines.push(text)
  }
  return lines
}

export function edgeColor(edge: RltEdge, o: RenderOptions): string {
  if (!o.farbcode) return o.theme.line
  if (edge.kind === 'air') return o.theme.air[edge.air]
  if (edge.kind === 'fluid') return o.theme.fluid[edge.fluid]
  return o.theme.signal
}

export function edgePoints(doc: RltDoc, edge: RltEdge): Pt[] | null {
  const na = doc.nodes.find((n) => n.id === edge.a.node)
  const nb = doc.nodes.find((n) => n.id === edge.b.node)
  if (!na || !nb) return null
  const pa = findPort(requireSymbol(na.type), edge.a.port)
  const pb = findPort(requireSymbol(nb.type), edge.b.port)
  if (!pa || !pb) return null
  return routeOrthogonal(portPoint(na, pa), portPoint(nb, pb), edge.offset)
}

export function SymbolGlyph({ node, o }: { node: RltNode; o: RenderOptions }): ReactNode {
  const def = requireSymbol(node.type)
  const flip = node.flip ? ` translate(${node.w} 0) scale(-1 1)` : ''
  const transform = `translate(${round(node.x)} ${round(node.y)}) rotate(${node.rot} ${round(node.w / 2)} ${round(node.h / 2)})${flip}`
  return (
    <g transform={transform} strokeLinejoin="round">
      {def.draw({
        w: node.w, h: node.h, tag: node.tag, p: withComputed(def, node.params),
        t: o.theme, mono: !o.farbcode, rot: node.rot, flip: node.flip,
      })}
    </g>
  )
}

export function NodeLabel({ node, o }: { node: RltNode; o: RenderOptions }): ReactNode {
  if (node.hideLabel) return null
  const def = requireSymbol(node.type)
  const lines = nodeLabelLines(node, def)
  const b = nodeBounds(node)
  const background = def.layer === 'background'
  // MSR-Kreise haengen an einer gestrichelten Wirkungslinie nach unten; ihre
  // Beschriftung gehoert darum über das Symbol.
  const oben = def.category === 'msr'
  const anchor = background ? 'end' : 'middle'
  const x = (background ? b.x + b.w - 9 : b.x + b.w / 2) + node.labelDx
  const y =
    (background ? b.y + 16 : oben ? b.y - 6 - lines.length * LINE_HEIGHT : b.y + b.h + 13) + node.labelDy
  return (
    <g fontFamily={FONT} textAnchor={anchor} stroke="none">
      <text x={round(x)} y={round(y)} fontSize={TAG_SIZE} fontWeight={600} fill={o.theme.text}>
        {node.tag}
      </text>
      {lines.map((line, i) => (
        <text key={i} x={round(x)} y={round(y + LINE_HEIGHT * (i + 1))} fontSize={LABEL_SIZE} fill={o.theme.muted}>
          {line}
        </text>
      ))}
    </g>
  )
}

export function EdgeLine({ pts, edge, o }: { pts: Pt[]; edge: RltEdge; o: RenderOptions }): ReactNode {
  const color = edgeColor(edge, o)
  const width = edge.kind === 'air' ? 2.4 : edge.kind === 'fluid' ? 1.7 : 1.2
  return (
    <path
      d={polylinePath(pts)}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={edge.kind === 'signal' ? '5 4' : undefined}
    />
  )
}

/** Länge eines Streckenzugs. */
function polylineLength(pts: Pt[]): number {
  let sum = 0
  for (let i = 1; i < pts.length; i++) sum += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  return sum
}

export function EdgeLabel({ pts, edge, o }: { pts: Pt[]; edge: RltEdge; o: RenderOptions }): ReactNode {
  const lines = edgeLabelLines(edge)
  // Auf kurzen Verbindungsstücken wuerde die Luftart nur Unruhe stiften.
  const laenge = polylineLength(pts)
  // Die Luftart wird immer angeschrieben — in der Schwarzweißausgabe ist sie
  // das einzige Unterscheidungsmerkmal der Stränge.
  const showAir = edge.kind === 'air' && laenge >= 70
  const all = showAir ? [edge.air, ...lines] : lines
  // Auf einem kurzen Stossstück ist kein Platz fuer Text, ohne die Nachbarn zu überdecken.
  if (all.length === 0 || laenge < 48) return null
  const mid = polylineMidpoint(pts)
  const x = mid.x + edge.labelDx
  const y = mid.y - 8 + edge.labelDy - (all.length - 1) * LINE_HEIGHT
  return (
    <g fontFamily={FONT} textAnchor="middle" stroke="none">
      {all.map((line, i) => (
        <text
          key={i}
          x={round(x)}
          y={round(y + LINE_HEIGHT * i)}
          fontSize={LABEL_SIZE}
          fontWeight={i === 0 && showAir ? 600 : 400}
          fill={i === 0 && showAir ? edgeColor(edge, o) : o.theme.muted}
        >
          {line}
        </text>
      ))}
    </g>
  )
}

/**
 * Reine Darstellung des Dokuments. Wird sowohl von der Zeichenfläche als auch
 * vom SVG-Export verwendet, damit Anzeige und Ausgabe nicht auseinanderlaufen.
 */
export function Schematic({ doc, o }: { doc: RltDoc; o: RenderOptions }): ReactNode {
  const background: RltNode[] = []
  const foreground: RltNode[] = []
  for (const nd of doc.nodes) {
    if (requireSymbol(nd.type).layer === 'background') background.push(nd)
    else foreground.push(nd)
  }
  const routed = doc.edges
    .map((e) => ({ edge: e, pts: edgePoints(doc, e) }))
    .filter((r): r is { edge: RltEdge; pts: Pt[] } => r.pts !== null)

  return (
    <g>
      <g>{background.map((nd) => <SymbolGlyph key={nd.id} node={nd} o={o} />)}</g>
      <g>{routed.map((r) => <EdgeLine key={r.edge.id} pts={r.pts} edge={r.edge} o={o} />)}</g>
      <g>{foreground.map((nd) => <SymbolGlyph key={nd.id} node={nd} o={o} />)}</g>
      {o.labels ? (
        <g>
          {doc.nodes.map((nd) => <NodeLabel key={nd.id} node={nd} o={o} />)}
          {routed.map((r) => <EdgeLabel key={r.edge.id} pts={r.pts} edge={r.edge} o={o} />)}
        </g>
      ) : null}
    </g>
  )
}

function round(v: number): number {
  return Math.round(v * 100) / 100
}

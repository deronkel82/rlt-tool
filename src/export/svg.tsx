import { renderToStaticMarkup } from 'react-dom/server'
import { Schematic } from '../canvas/Schematic'
import { nodeBounds } from '../canvas/geometry'
import { FONT, formatDate } from '../format'
import { contentBounds } from '../state/store'
import type { RltDoc } from '../state/types'
import { monochrome, themePrint } from '../theme'
import { buildBom, buildEdgeBom, type BomRow } from './bom'

export interface ExportOptions {
  /** Luftarten farbig ausgeben */
  farbe: boolean
  /** Beschriftungen am Symbol ausgeben */
  beschriftung: boolean
  /** Stückliste unter das Schema setzen */
  stueckliste: boolean
  /** Schriftfeld mit Projektangaben */
  schriftfeld: boolean
  /** Leitungen in der Stückliste aufführen */
  leitungen: boolean
}

export const DEFAULT_EXPORT: ExportOptions = {
  farbe: true,
  beschriftung: true,
  stueckliste: false,
  schriftfeld: true,
  leitungen: false,
}

const PAD = 48
const ROW_H = 16
const HEAD_H = 22
const TITLE_H = 56
const MIN_TABLE = 780
/** Feste Breiten der ersten drei Spalten; die vierte nimmt den Rest auf. */
const FIXED_COLS = [112, 168, 150]
/** Mittlere Zeichenbreite bei 9,5 pt, halbfett etwas breiter. */
const CHAR_W = 4.85
const CHAR_W_BOLD = 5.6

/** Rahmen des Schemas inklusive der Beschriftungen unter den Symbolen. */
function schematicBounds(doc: RltDoc) {
  const b = contentBounds(doc)
  if (!b) return { x: 0, y: 0, w: 400, h: 260 }
  let y1 = b.y + b.h
  let x0 = b.x
  let x1 = b.x + b.w
  for (const n of doc.nodes) {
    const nb = nodeBounds(n)
    const lines = n.hideLabel ? 0 : n.visible.length + 1
    y1 = Math.max(y1, nb.y + nb.h + 16 + lines * 12 + n.labelDy)
    x0 = Math.min(x0, nb.x - 40)
    x1 = Math.max(x1, nb.x + nb.w + 40)
  }
  return { x: x0, y: b.y - 24, w: x1 - x0, h: y1 - (b.y - 24) }
}

/** Text auf die Spaltenbreite kürzen, damit er nicht in die Nachbarspalte laeuft. */
function fit(text: string, width: number, bold: boolean): string {
  const max = Math.floor((width - 10) / (bold ? CHAR_W_BOLD : CHAR_W))
  if (max <= 1) return ''
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function TableRows({ rows, y, cols, color, muted }: {
  rows: BomRow[]
  y: number
  cols: number[]
  color: string
  muted: string
}) {
  const total = cols.reduce((a, b) => a + b, 0)
  return (
    <g>
      {rows.map((r, i) => {
        const ry = y + i * ROW_H
        const cells = [r.tag, r.bauteil, r.bezeichnung, r.kenndaten]
        let x = 0
        return (
          <g key={`${r.tag}-${i}`}>
            <line x1={0} y1={ry + 4} x2={total} y2={ry + 4} stroke={muted} strokeWidth={0.4} strokeOpacity={0.35} />
            {cells.map((cell, ci) => {
              const cx = x
              x += cols[ci]
              const bold = ci === 0
              return (
                <text
                  key={ci} x={cx + 2} y={ry} fontSize={9.5}
                  fill={bold ? color : muted} fontWeight={bold ? 600 : 400}
                >
                  {fit(cell, cols[ci], bold)}
                </text>
              )
            })}
          </g>
        )
      })}
    </g>
  )
}

/** Vollständiges, eigenständiges SVG des Schemas. */
export function buildSvg(doc: RltDoc, opts: ExportOptions): { svg: string; width: number; height: number } {
  const theme = opts.farbe ? themePrint : monochrome(themePrint)
  const b = schematicBounds(doc)

  const groups = opts.stueckliste ? buildBom(doc) : []
  const edgeRows = opts.stueckliste && opts.leitungen ? buildEdgeBom(doc) : []

  const contentWidth = Math.max(b.w, opts.stueckliste ? MIN_TABLE : 0, 360)
  const cols = [...FIXED_COLS, Math.max(180, contentWidth - FIXED_COLS.reduce((a, c) => a + c, 0))]
  const tableWidth = cols.reduce((a, c) => a + c, 0)

  let bomHeight = 0
  if (opts.stueckliste) {
    bomHeight = 34
    for (const g of groups) bomHeight += HEAD_H + g.rows.length * ROW_H + 8
    if (edgeRows.length) bomHeight += HEAD_H + edgeRows.length * ROW_H + 8
  }

  const titleHeight = opts.schriftfeld ? TITLE_H : 0
  const width = Math.round(contentWidth + PAD * 2)
  const height = Math.round(b.h + bomHeight + titleHeight + PAD * 2)

  const bomY = b.h + 30
  const titleY = bomY + bomHeight + 8

  // Senkrechte Lage der Gruppen in der Stückliste vorab bestimmen.
  const bloecke: Array<{ titel: string; rows: BomRow[]; y: number }> = []
  let cursor = 26
  for (const g of groups) {
    bloecke.push({ titel: g.kategorie, rows: g.rows, y: cursor })
    cursor += HEAD_H + g.rows.length * ROW_H + 8
  }
  if (edgeRows.length) bloecke.push({ titel: 'Leitungen', rows: edgeRows, y: cursor })

  const body = (
    <g fontFamily={FONT}>
      <g transform={`translate(${round(-b.x)} ${round(-b.y)})`}>
        <Schematic doc={doc} o={{ theme, farbcode: opts.farbe, labels: opts.beschriftung }} />
      </g>

      {opts.stueckliste ? (
        <g transform={`translate(0 ${round(bomY)})`}>
          <text x={0} y={0} fontSize={12} fontWeight={600} fill={theme.text}>Stückliste</text>
          <line x1={0} y1={7} x2={tableWidth} y2={7} stroke={theme.text} strokeWidth={0.8} />
          {bloecke.map((bl) => (
            <g key={bl.titel} transform={`translate(0 ${round(bl.y)})`}>
              <text x={0} y={0} fontSize={10} fontWeight={600} fill={theme.text}>{bl.titel}</text>
              <TableRows rows={bl.rows} y={16} cols={cols} color={theme.text} muted={theme.muted} />
            </g>
          ))}
        </g>
      ) : null}

      {opts.schriftfeld ? (
        <g transform={`translate(0 ${round(titleY)})`}>
          <line x1={0} y1={0} x2={contentWidth} y2={0} stroke={theme.text} strokeWidth={0.8} />
          <text x={0} y={18} fontSize={13} fontWeight={600} fill={theme.text}>
            {doc.meta.projekt || 'RLT-Schema'}
          </text>
          <text x={0} y={33} fontSize={10} fill={theme.muted}>
            {[doc.meta.anlage, doc.meta.bemerkung].filter(Boolean).join(' · ')}
          </text>
          <text x={contentWidth} y={18} fontSize={10} textAnchor="end" fill={theme.muted}>
            {doc.meta.bearbeiter}
          </text>
          <text x={contentWidth} y={33} fontSize={10} textAnchor="end" fill={theme.muted}>
            {formatDate(doc.meta.datum)}
          </text>
          <text x={contentWidth} y={47} fontSize={9} textAnchor="end" fill={theme.muted}>
            Symbolik nach DIN EN 12792 · DIN EN ISO 10628 · VDI 3814
          </text>
        </g>
      ) : null}
    </g>
  )

  const inner = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect width={width} height={height} fill="#ffffff" />
      <g transform={`translate(${PAD} ${PAD})`}>{body}</g>
    </svg>,
  )
  return { svg: `<?xml version="1.0" encoding="UTF-8"?>\n${inner}`, width, height }
}

function round(v: number): number {
  return Math.round(v * 100) / 100
}

/** Kleines Vorschaubild fuer die Projektliste. */
export function buildThumbnail(doc: RltDoc, maxW = 360, maxH = 220): string {
  const b = contentBounds(doc)
  if (!b || doc.nodes.length === 0) {
    return 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"/>')
  }
  const pad = 16
  const w = b.w + pad * 2
  const h = b.h + pad * 2
  const scale = Math.min(maxW / w, maxH / h, 1)
  const inner = renderToStaticMarkup(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={Math.round(w * scale)}
      height={Math.round(h * scale)}
      viewBox={`0 0 ${round(w)} ${round(h)}`}
    >
      <rect width={round(w)} height={round(h)} fill="#ffffff" />
      <g transform={`translate(${round(pad - b.x)} ${round(pad - b.y)})`}>
        <Schematic doc={doc} o={{ theme: themePrint, farbcode: true, labels: false }} />
      </g>
    </svg>,
  )
  const bytes = new TextEncoder().encode(inner)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return `data:image/svg+xml;base64,${btoa(binary)}`
}

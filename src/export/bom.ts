import { CATEGORIES, requireSymbol, withComputed } from '../catalog'
import { edgeParamDefs, withComputedEdge } from '../catalog/edge'
import type { CategoryId } from '../catalog/types'
import { formatValue } from '../format'
import type { RltDoc } from '../state/types'
import { AIR_TYPES, FLUID_TYPES } from '../theme'

export interface BomRow {
  tag: string
  bauteil: string
  bezeichnung: string
  kenndaten: string
  kategorie: string
}

export interface BomGroup {
  kategorie: string
  rows: BomRow[]
}

/** Alle gepflegten Kenndaten einer Komponente als eine Zeile. */
function nodeKenndaten(doc: RltDoc, nodeId: string): string {
  const node = doc.nodes.find((n) => n.id === nodeId)
  if (!node) return ''
  const def = requireSymbol(node.type)
  const values = withComputed(def, node.params)
  const parts: string[] = []
  for (const p of def.params) {
    if (p.group === 'Kennzeichnung') continue
    const v = values[p.key]
    if (v === null || v === undefined || v === '' || v === false) continue
    parts.push(`${p.label}: ${formatValue(p, v)}`)
  }
  return parts.join(' · ')
}

export function buildBom(doc: RltDoc): BomGroup[] {
  const order = new Map<CategoryId, number>(CATEGORIES.map((c, i) => [c.id, i]))
  const groups = new Map<string, BomRow[]>()

  const sorted = [...doc.nodes].sort((a, b) => {
    const da = requireSymbol(a.type)
    const db = requireSymbol(b.type)
    const oa = order.get(da.category) ?? 99
    const ob = order.get(db.category) ?? 99
    if (oa !== ob) return oa - ob
    return a.tag.localeCompare(b.tag, 'de')
  })

  for (const node of sorted) {
    const def = requireSymbol(node.type)
    const kategorie = CATEGORIES.find((c) => c.id === def.category)?.label ?? def.category
    const row: BomRow = {
      tag: node.tag,
      bauteil: def.label,
      bezeichnung: typeof node.params.bezeichnung === 'string' ? node.params.bezeichnung : '',
      kenndaten: nodeKenndaten(doc, node.id),
      kategorie,
    }
    const list = groups.get(kategorie) ?? []
    list.push(row)
    groups.set(kategorie, list)
  }

  return Array.from(groups.entries()).map(([kategorie, rows]) => ({ kategorie, rows }))
}

/** Leitungen als eigene Gruppe, damit Kanalabmessungen dokumentiert sind. */
export function buildEdgeBom(doc: RltDoc): BomRow[] {
  const rows: BomRow[] = []
  for (const edge of doc.edges) {
    const na = doc.nodes.find((n) => n.id === edge.a.node)
    const nb = doc.nodes.find((n) => n.id === edge.b.node)
    const defs = edgeParamDefs(edge.kind)
    const values = withComputedEdge(edge.kind, edge.params)
    const parts: string[] = []
    for (const p of defs) {
      if (p.group === 'Kennzeichnung') continue
      const v = values[p.key]
      if (v === null || v === undefined || v === '' || v === false) continue
      parts.push(`${p.label}: ${formatValue(p, v)}`)
    }
    const art =
      edge.kind === 'air' ? AIR_TYPES[edge.air].label
        : edge.kind === 'fluid' ? FLUID_TYPES[edge.fluid].label
          : 'Signalleitung'
    rows.push({
      tag: `${na?.tag ?? '?'} → ${nb?.tag ?? '?'}`,
      bauteil: edge.kind === 'air' ? 'Luftkanal' : edge.kind === 'fluid' ? 'Rohrleitung' : 'Signalleitung',
      bezeichnung: art,
      kenndaten: parts.join(' · '),
      kategorie: 'Leitungen',
    })
  }
  return rows
}

function csvCell(v: string): string {
  const needsQuotes = /[";\n]/.test(v)
  const escaped = v.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

/** Stückliste als CSV mit Semikolon, wie es deutsche Tabellenprogramme erwarten. */
export function bomToCsv(doc: RltDoc): string {
  const lines = ['Kategorie;Kennzeichen;Bauteil;Bezeichnung;Kenndaten']
  for (const group of buildBom(doc)) {
    for (const r of group.rows) {
      lines.push([r.kategorie, r.tag, r.bauteil, r.bezeichnung, r.kenndaten].map(csvCell).join(';'))
    }
  }
  for (const r of buildEdgeBom(doc)) {
    lines.push([r.kategorie, r.tag, r.bauteil, r.bezeichnung, r.kenndaten].map(csvCell).join(';'))
  }
  return '﻿' + lines.join('\r\n')
}

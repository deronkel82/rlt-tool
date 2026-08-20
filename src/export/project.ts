import { getSymbol } from '../catalog'
import type { ParamValues } from '../catalog/types'
import type { EdgeKind, RltDoc, RltEdge, RltNode, Rotation } from '../state/types'
import { emptyDoc, newId } from '../state/types'
import { AIR_TYPES, FLUID_TYPES, type AirType, type FluidType } from '../theme'

export interface ProjectFile {
  format: 'rlt-schema'
  version: 1
  erzeugt: string
  doc: RltDoc
}

export function docToJson(doc: RltDoc): string {
  const payload: ProjectFile = {
    format: 'rlt-schema',
    version: 1,
    erzeugt: new Date().toISOString(),
    doc,
  }
  return JSON.stringify(payload, null, 2)
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function numOr(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function params(v: unknown): ParamValues {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const out: ParamValues = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (val === null || typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') out[k] = val
  }
  return out
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

function rotation(v: unknown): Rotation {
  const n = numOr(v, 0)
  return ([0, 90, 180, 270] as const).includes(n as Rotation) ? (n as Rotation) : 0
}

/**
 * Projektdatei einlesen. Beschädigte oder fremde Eintraege werden verworfen,
 * statt die ganze Datei abzulehnen.
 */
export function jsonToDoc(text: string): RltDoc {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Die Datei ist keine gültige JSON-Datei.')
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Die Datei enthält kein Projekt.')

  const root = parsed as Record<string, unknown>
  const raw = (root.format === 'rlt-schema' ? root.doc : root) as Record<string, unknown> | undefined
  if (!raw || typeof raw !== 'object') throw new Error('Die Datei enthält kein RLT-Schema.')
  if (!Array.isArray(raw.nodes)) throw new Error('Die Datei enthält keine Komponenten.')

  const base = emptyDoc()
  const meta = (raw.meta ?? {}) as Record<string, unknown>
  const doc: RltDoc = {
    version: 1,
    meta: {
      projekt: str(meta.projekt, base.meta.projekt),
      anlage: str(meta.anlage),
      bearbeiter: str(meta.bearbeiter),
      datum: str(meta.datum, base.meta.datum),
      bemerkung: str(meta.bemerkung),
    },
    nodes: [],
    edges: [],
    counters: {},
  }

  const idMap = new Map<string, string>()
  for (const item of raw.nodes as unknown[]) {
    if (!item || typeof item !== 'object') continue
    const n = item as Record<string, unknown>
    const type = str(n.type)
    if (!type) continue
    const def = getSymbol(type)
    const oldId = str(n.id)
    const id = oldId || newId('k')
    idMap.set(oldId, id)
    const node: RltNode = {
      id,
      type,
      x: numOr(n.x, 0),
      y: numOr(n.y, 0),
      w: numOr(n.w, def?.w ?? 64),
      h: numOr(n.h, def?.h ?? 44),
      rot: rotation(n.rot),
      flip: n.flip === true,
      tag: str(n.tag, def ? `${def.tagPrefix}-01` : 'X-01'),
      params: params(n.params),
      visible: strList(n.visible),
      labelDx: numOr(n.labelDx, 0),
      labelDy: numOr(n.labelDy, 0),
      hideLabel: n.hideLabel === true,
    }
    doc.nodes.push(node)
  }

  const known = new Set(doc.nodes.map((n) => n.id))
  if (Array.isArray(raw.edges)) {
    for (const item of raw.edges as unknown[]) {
      if (!item || typeof item !== 'object') continue
      const e = item as Record<string, unknown>
      const a = e.a as Record<string, unknown> | undefined
      const b = e.b as Record<string, unknown> | undefined
      if (!a || !b) continue
      const an = idMap.get(str(a.node)) ?? str(a.node)
      const bn = idMap.get(str(b.node)) ?? str(b.node)
      if (!known.has(an) || !known.has(bn)) continue
      const kind = (['air', 'fluid', 'signal'] as const).includes(e.kind as EdgeKind) ? (e.kind as EdgeKind) : 'air'
      const air = str(e.air) in AIR_TYPES ? (e.air as AirType) : 'ZUL'
      const fluid = str(e.fluid) in FLUID_TYPES ? (e.fluid as FluidType) : 'HZ_VL'
      const edge: RltEdge = {
        id: str(e.id) || newId('l'),
        a: { node: an, port: str(a.port) },
        b: { node: bn, port: str(b.port) },
        kind,
        air,
        fluid,
        offset: numOr(e.offset, 0),
        params: params(e.params),
        visible: strList(e.visible),
        labelDx: numOr(e.labelDx, 0),
        labelDy: numOr(e.labelDy, 0),
      }
      doc.edges.push(edge)
    }
  }

  // Zähler aus den vorhandenen Kennzeichen ableiten, damit neue Bauteile weiterzaehlen.
  const counters: Record<string, number> = {}
  for (const n of doc.nodes) {
    const m = /^(.+)-(\d+)$/.exec(n.tag)
    if (!m) continue
    const prefix = m[1]
    const num = Number(m[2])
    counters[prefix] = Math.max(counters[prefix] ?? 0, num)
  }
  const rawCounters = raw.counters
  if (rawCounters && typeof rawCounters === 'object') {
    for (const [k, v] of Object.entries(rawCounters as Record<string, unknown>)) {
      counters[k] = Math.max(counters[k] ?? 0, numOr(v, 0))
    }
  }
  doc.counters = counters

  if (doc.nodes.length === 0) throw new Error('Die Datei enthält keine verwertbaren Komponenten.')
  return doc
}

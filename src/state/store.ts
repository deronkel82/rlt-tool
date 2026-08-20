import { create } from 'zustand'
import type { ParamValue, SymbolDef } from '../catalog/types'
import { defaultParams, defaultVisibleParams, getSymbol, requireSymbol } from '../catalog'
import { defaultEdgeParams, defaultEdgeVisible } from '../catalog/edge'
import type { Umfang } from '../catalog/umfang'
import type { AirType, FluidType } from '../theme'
import type { EdgeEnd, EdgeKind, RltDoc, RltEdge, RltNode, Rotation, Viewport } from './types'
import { emptyDoc, newId } from './types'
import { findPort, nodeBounds, portPoint, type Rect } from '../canvas/geometry'

export type Tool = 'auswahl' | 'lasso' | 'kanal'
export type ThemeMode = 'hell' | 'dunkel'

export interface Settings {
  theme: ThemeMode
  farbcode: boolean
  raster: boolean
  fangen: boolean
  strangModus: boolean
  rasterweite: number
  /** Wie viele Symbole die Palette anbietet — wirkt nur auf die Palette. */
  symbolumfang: Umfang
  /** Kantenlänge einer Symbolkachel in der Palette, in Bildpunkten. */
  symbolgroesse: number
}

export const KACHEL_MIN = 52
export const KACHEL_MAX = 112
export const KACHEL_STANDARD = 64

/** Auf den zulässigen Bereich begrenzen, damit gespeicherter Unsinn nicht die Ansicht zerlegt. */
export function kachelGroesse(wert: unknown): number {
  const n = typeof wert === 'number' && Number.isFinite(wert) ? wert : KACHEL_STANDARD
  return Math.min(KACHEL_MAX, Math.max(KACHEL_MIN, Math.round(n)))
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'hell',
  farbcode: true,
  raster: true,
  fangen: true,
  strangModus: true,
  rasterweite: 8,
  symbolumfang: 'mittel',
  symbolgroesse: KACHEL_STANDARD,
}

export interface Store {
  doc: RltDoc
  projectId: string | null
  dirty: boolean
  selection: string[]
  viewport: Viewport
  tool: Tool
  settings: Settings
  /** Symbol, das per Antippen als nächstes gesetzt wird */
  armed: string | null
  past: RltDoc[]
  future: RltDoc[]

  // Dokument
  loadDoc: (doc: RltDoc, projectId: string | null) => void
  setMeta: (patch: Partial<RltDoc['meta']>) => void
  markSaved: () => void

  // Historie
  pushHistory: () => void
  undo: () => void
  redo: () => void

  // Komponenten
  addNode: (typeId: string, x: number, y: number, opts?: { center?: boolean }) => string | null
  updateNode: (id: string, patch: Partial<RltNode>) => void
  moveNodes: (ids: string[], dx: number, dy: number) => void
  setNodePositions: (positions: Record<string, { x: number; y: number }>) => void
  setParam: (id: string, key: string, value: ParamValue) => void
  toggleVisibleParam: (id: string, key: string) => void
  rotateSelection: (delta: 90 | -90) => void
  flipSelection: () => void
  deleteSelection: () => void
  duplicateSelection: () => void

  // Leitungen
  connect: (a: EdgeEnd, b: EdgeEnd) => string | null
  updateEdge: (id: string, patch: Partial<RltEdge>) => void
  setEdgeParam: (id: string, key: string, value: ParamValue) => void
  toggleEdgeVisibleParam: (id: string, key: string) => void

  // Auswahl und Ansicht
  select: (ids: string[], additive?: boolean) => void
  toggleSelect: (id: string) => void
  clearSelection: () => void
  setViewport: (v: Partial<Viewport>) => void
  setTool: (t: Tool) => void
  setArmed: (id: string | null) => void
  setSettings: (patch: Partial<Settings>) => void
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('rlt.settings')
    if (raw) {
      const gespeichert = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
      return { ...gespeichert, symbolgroesse: kachelGroesse(gespeichert.symbolgroesse) }
    }
  } catch {
    /* Voreinstellungen genügen */
  }
  return DEFAULT_SETTINGS
}

function saveSettings(s: Settings): void {
  try {
    localStorage.setItem('rlt.settings', JSON.stringify(s))
  } catch {
    /* Speichern der Voreinstellungen ist nicht kritisch */
  }
}

function clone(doc: RltDoc): RltDoc {
  return structuredClone(doc)
}

/** Nächstes freies Betriebsmittelkennzeichen fuer einen Praefix. */
export function nextTag(doc: RltDoc, prefix: string): { tag: string; counters: Record<string, number> } {
  const n = (doc.counters[prefix] ?? 0) + 1
  return { tag: `${prefix}-${String(n).padStart(2, '0')}`, counters: { ...doc.counters, [prefix]: n } }
}

function defaultAir(def: SymbolDef): AirType {
  if (def.id === 'aussenluftfassung') return 'AUL'
  if (def.id === 'fortluftausblasung') return 'FOL'
  return 'ZUL'
}

const HISTORY_LIMIT = 60

export const useStore = create<Store>((set, get) => ({
  doc: emptyDoc(),
  projectId: null,
  dirty: false,
  selection: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  tool: 'auswahl',
  settings: loadSettings(),
  armed: null,
  past: [],
  future: [],

  loadDoc: (doc, projectId) => set({ doc, projectId, selection: [], past: [], future: [], dirty: false }),

  setMeta: (patch) => {
    get().pushHistory()
    set((s) => ({ doc: { ...s.doc, meta: { ...s.doc.meta, ...patch } }, dirty: true }))
  },

  markSaved: () => set({ dirty: false }),

  pushHistory: () =>
    set((s) => ({
      past: [...s.past.slice(-(HISTORY_LIMIT - 1)), clone(s.doc)],
      future: [],
    })),

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s
      const prev = s.past[s.past.length - 1]
      return {
        doc: prev,
        past: s.past.slice(0, -1),
        future: [clone(s.doc), ...s.future].slice(0, HISTORY_LIMIT),
        selection: [],
        dirty: true,
      }
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s
      const next = s.future[0]
      return {
        doc: next,
        past: [...s.past, clone(s.doc)].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        selection: [],
        dirty: true,
      }
    }),

  addNode: (typeId, x, y, opts) => {
    const def = getSymbol(typeId)
    if (!def) return null
    get().pushHistory()
    const id = newId('k')
    let px = x
    let py = y
    if (opts?.center) {
      px = x - def.w / 2
      py = y - def.h / 2
    }
    const { rasterweite, fangen } = get().settings
    if (fangen) {
      px = Math.round(px / rasterweite) * rasterweite
      py = Math.round(py / rasterweite) * rasterweite
    }
    set((s) => {
      const { tag, counters } = nextTag(s.doc, def.tagPrefix)
      const node: RltNode = {
        id,
        type: typeId,
        x: px,
        y: py,
        w: def.w,
        h: def.h,
        rot: 0,
        flip: false,
        tag,
        params: defaultParams(def),
        visible: defaultVisibleParams(def),
        labelDx: 0,
        labelDy: 0,
      }
      const nodes = def.layer === 'background' ? [node, ...s.doc.nodes] : [...s.doc.nodes, node]
      return { doc: { ...s.doc, nodes, counters }, selection: [id], dirty: true }
    })
    return id
  },

  updateNode: (id, patch) => {
    set((s) => ({
      doc: { ...s.doc, nodes: s.doc.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) },
      dirty: true,
    }))
  },

  moveNodes: (ids, dx, dy) => {
    const set2 = new Set(ids)
    set((s) => ({
      doc: {
        ...s.doc,
        nodes: s.doc.nodes.map((n) => (set2.has(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
      },
      dirty: true,
    }))
  },

  setNodePositions: (positions) => {
    set((s) => ({
      doc: {
        ...s.doc,
        nodes: s.doc.nodes.map((n) => (positions[n.id] ? { ...n, ...positions[n.id] } : n)),
      },
      dirty: true,
    }))
  },

  setParam: (id, key, value) => {
    get().pushHistory()
    set((s) => ({
      doc: {
        ...s.doc,
        nodes: s.doc.nodes.map((n) => (n.id === id ? { ...n, params: { ...n.params, [key]: value } } : n)),
      },
      dirty: true,
    }))
  },

  toggleVisibleParam: (id, key) => {
    get().pushHistory()
    set((s) => ({
      doc: {
        ...s.doc,
        nodes: s.doc.nodes.map((n) => {
          if (n.id !== id) return n
          const has = n.visible.includes(key)
          return { ...n, visible: has ? n.visible.filter((k) => k !== key) : [...n.visible, key] }
        }),
      },
      dirty: true,
    }))
  },

  rotateSelection: (delta) => {
    const sel = new Set(get().selection)
    if (sel.size === 0) return
    get().pushHistory()
    set((s) => ({
      doc: {
        ...s.doc,
        nodes: s.doc.nodes.map((n) =>
          sel.has(n.id) ? { ...n, rot: (((n.rot + delta) % 360) + 360) % 360 as Rotation } : n,
        ),
      },
      dirty: true,
    }))
  },

  flipSelection: () => {
    const sel = new Set(get().selection)
    if (sel.size === 0) return
    get().pushHistory()
    set((s) => ({
      doc: { ...s.doc, nodes: s.doc.nodes.map((n) => (sel.has(n.id) ? { ...n, flip: !n.flip } : n)) },
      dirty: true,
    }))
  },

  deleteSelection: () => {
    const sel = new Set(get().selection)
    if (sel.size === 0) return
    get().pushHistory()
    set((s) => {
      const nodes = s.doc.nodes.filter((n) => !sel.has(n.id))
      const alive = new Set(nodes.map((n) => n.id))
      const edges = s.doc.edges.filter((e) => !sel.has(e.id) && alive.has(e.a.node) && alive.has(e.b.node))
      return { doc: { ...s.doc, nodes, edges }, selection: [], dirty: true }
    })
  },

  duplicateSelection: () => {
    const sel = new Set(get().selection)
    if (sel.size === 0) return
    get().pushHistory()
    set((s) => {
      let counters = { ...s.doc.counters }
      const mapping: Record<string, string> = {}
      const copies: RltNode[] = []
      for (const n of s.doc.nodes) {
        if (!sel.has(n.id)) continue
        const def = requireSymbol(n.type)
        const t = nextTag({ ...s.doc, counters }, def.tagPrefix)
        counters = t.counters
        const id = newId('k')
        mapping[n.id] = id
        copies.push({ ...n, id, tag: t.tag, x: n.x + 24, y: n.y + 24, params: { ...n.params }, visible: [...n.visible] })
      }
      const edgeCopies: RltEdge[] = s.doc.edges
        .filter((e) => mapping[e.a.node] && mapping[e.b.node])
        .map((e) => ({
          ...e,
          id: newId('l'),
          a: { node: mapping[e.a.node], port: e.a.port },
          b: { node: mapping[e.b.node], port: e.b.port },
          params: { ...e.params },
          visible: [...e.visible],
        }))
      return {
        doc: { ...s.doc, nodes: [...s.doc.nodes, ...copies], edges: [...s.doc.edges, ...edgeCopies], counters },
        selection: copies.map((c) => c.id),
        dirty: true,
      }
    })
  },

  connect: (a, b) => {
    const { doc } = get()
    if (a.node === b.node && a.port === b.port) return null
    const na = doc.nodes.find((n) => n.id === a.node)
    const nb = doc.nodes.find((n) => n.id === b.node)
    if (!na || !nb) return null
    const pa = findPort(requireSymbol(na.type), a.port)
    const pb = findPort(requireSymbol(nb.type), b.port)
    if (!pa || !pb) return null
    if (pa.kind !== pb.kind) return null
    const exists = doc.edges.some(
      (e) =>
        (e.a.node === a.node && e.a.port === a.port && e.b.node === b.node && e.b.port === b.port) ||
        (e.a.node === b.node && e.a.port === b.port && e.b.node === a.node && e.b.port === a.port),
    )
    if (exists) return null

    get().pushHistory()
    const kind: EdgeKind = pa.kind
    const id = newId('l')
    const air: AirType = kind === 'air' ? defaultAir(requireSymbol(na.type)) : 'ZUL'
    const fluid: FluidType = 'HZ_VL'
    const edge: RltEdge = {
      id,
      a,
      b,
      kind,
      air,
      fluid,
      offset: 0,
      params: defaultEdgeParams(kind),
      visible: defaultEdgeVisible(kind),
      labelDx: 0,
      labelDy: 0,
    }
    set((s) => ({ doc: { ...s.doc, edges: [...s.doc.edges, edge] }, selection: [id], dirty: true }))
    return id
  },

  updateEdge: (id, patch) => {
    set((s) => ({
      doc: { ...s.doc, edges: s.doc.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) },
      dirty: true,
    }))
  },

  setEdgeParam: (id, key, value) => {
    get().pushHistory()
    set((s) => ({
      doc: {
        ...s.doc,
        edges: s.doc.edges.map((e) => (e.id === id ? { ...e, params: { ...e.params, [key]: value } } : e)),
      },
      dirty: true,
    }))
  },

  toggleEdgeVisibleParam: (id, key) => {
    get().pushHistory()
    set((s) => ({
      doc: {
        ...s.doc,
        edges: s.doc.edges.map((e) => {
          if (e.id !== id) return e
          const has = e.visible.includes(key)
          return { ...e, visible: has ? e.visible.filter((k) => k !== key) : [...e.visible, key] }
        }),
      },
      dirty: true,
    }))
  },

  select: (ids, additive) =>
    set((s) => ({ selection: additive ? Array.from(new Set([...s.selection, ...ids])) : ids })),

  toggleSelect: (id) =>
    set((s) => ({
      selection: s.selection.includes(id) ? s.selection.filter((x) => x !== id) : [...s.selection, id],
    })),

  clearSelection: () => set({ selection: [] }),

  setViewport: (v) => set((s) => ({ viewport: { ...s.viewport, ...v } })),

  setTool: (t) => set({ tool: t }),

  setArmed: (id) => set({ armed: id }),

  setSettings: (patch) =>
    set((s) => {
      const next = { ...s.settings, ...patch }
      saveSettings(next)
      return { settings: next }
    }),
}))

/** Rahmen aller Komponenten, fuer Zoom-auf-Inhalt und Export. */
export function contentBounds(doc: RltDoc): Rect | null {
  if (doc.nodes.length === 0) return null
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const n of doc.nodes) {
    const b = nodeBounds(n)
    x0 = Math.min(x0, b.x)
    y0 = Math.min(y0, b.y)
    x1 = Math.max(x1, b.x + b.w)
    y1 = Math.max(y1, b.y + b.h)
  }
  for (const e of doc.edges) {
    const na = doc.nodes.find((n) => n.id === e.a.node)
    const nb = doc.nodes.find((n) => n.id === e.b.node)
    if (!na || !nb) continue
    const pa = findPort(requireSymbol(na.type), e.a.port)
    const pb = findPort(requireSymbol(nb.type), e.b.port)
    if (!pa || !pb) continue
    for (const p of [portPoint(na, pa), portPoint(nb, pb)]) {
      x0 = Math.min(x0, p.x)
      y0 = Math.min(y0, p.y)
      x1 = Math.max(x1, p.x)
      y1 = Math.max(y1, p.y)
    }
  }
  if (!Number.isFinite(x0)) return null
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

import type { CategoryId, ParamDef, ParamValues, SymbolDef } from './types'
import { CATEGORIES } from './types'
import { STANDARD_PARAMS } from './params'
import { luftbehandlung } from './symbols/luftbehandlung'
import { wrg } from './symbols/wrg'
import { klappen } from './symbols/klappen'
import { kanal } from './symbols/kanal'
import { durchlaesse } from './symbols/durchlaesse'
import { msr } from './symbols/msr'
import { hydraulik } from './symbols/hydraulik'
import { erzeuger } from './symbols/erzeuger'
import { raum } from './symbols/raum'

export * from './types'
export { CATEGORIES }

/** Jede Komponente bekommt zusaetzlich die Kennzeichnungsfelder. */
function withStandard(def: SymbolDef): SymbolDef {
  const keys = new Set(def.params.map((p) => p.key))
  const extra = STANDARD_PARAMS.filter((p) => !keys.has(p.key))
  return { ...def, params: [...def.params, ...extra] }
}

export const SYMBOLS: SymbolDef[] = [
  ...luftbehandlung,
  ...wrg,
  ...klappen,
  ...kanal,
  ...durchlaesse,
  ...msr,
  ...hydraulik,
  ...erzeuger,
  ...raum,
].map(withStandard)

const byId = new Map(SYMBOLS.map((s) => [s.id, s]))

export function getSymbol(id: string): SymbolDef | undefined {
  return byId.get(id)
}

/** Symbol oder ein sichtbarer Platzhalter, damit fremde Dateien nicht die Ansicht sprengen. */
export function requireSymbol(id: string): SymbolDef {
  const s = byId.get(id)
  if (s) return s
  return {
    ...UNKNOWN,
    id,
    label: `Unbekanntes Symbol (${id})`,
  }
}

const UNKNOWN: SymbolDef = withStandard({
  id: '__unbekannt',
  label: 'Unbekanntes Symbol',
  category: 'raum',
  tagPrefix: 'X',
  w: 64, h: 44,
  ports: [
    { id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air' },
    { id: 'out', rx: 1, ry: 0.5, dir: 'right', kind: 'air' },
  ],
  params: [],
  draw: () => null,
})

export function symbolsByCategory(category: CategoryId): SymbolDef[] {
  return SYMBOLS.filter((s) => s.category === category)
}

/** Standardwerte fuer eine neu eingefuegte Komponente. */
export function defaultParams(def: SymbolDef): ParamValues {
  const out: ParamValues = {}
  for (const p of def.params) {
    if (p.type === 'computed') continue
    out[p.key] = p.default ?? (p.type === 'boolean' ? false : null)
  }
  return out
}

/** Parameter, die von Haus aus als Beschriftung am Symbol erscheinen. */
export function defaultVisibleParams(def: SymbolDef): string[] {
  return def.params.filter((p) => p.showByDefault).map((p) => p.key)
}

/** Berechnete Felder ergaenzen, damit Beschriftung und Stückliste sie sehen. */
export function withComputed(def: SymbolDef, values: ParamValues): ParamValues {
  const out: ParamValues = { ...values }
  for (const p of def.params) {
    if (p.type === 'computed' && p.compute) out[p.key] = p.compute(out)
  }
  return out
}

export function findParam(def: SymbolDef, key: string): ParamDef | undefined {
  return def.params.find((p) => p.key === key)
}

/** Freitextsuche über Bezeichnung, Kategorie und Suchbegriffe. */
export function searchSymbols(query: string): SymbolDef[] {
  const q = query.trim().toLowerCase()
  if (!q) return SYMBOLS
  const terms = q.split(/\s+/)
  return SYMBOLS.filter((s) => {
    const hay = [s.label, s.id, s.tagPrefix, s.norm ?? '', ...(s.keywords ?? [])].join(' ').toLowerCase()
    return terms.every((t) => hay.includes(t))
  })
}

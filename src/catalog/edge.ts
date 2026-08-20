import type { ParamDef, ParamValues } from './types'
import {
  DICHTHEITSKLASSE, KANALFORM, KANALWERKSTOFF,
  bool, calc, num, round, sel, toNum, txt,
} from './params'
import type { EdgeKind } from '../state/types'

/** Luftkanal — Kennwerte nach DIN EN 12792 / DIN EN 16798-3. */
const AIR: ParamDef[] = [
  num('volumenstrom', 'Volumenstrom', 'm³/h', { group: 'Auslegung', step: 10, min: 0, showByDefault: true, short: 'V̇' }),
  sel('form', 'Querschnittsform', KANALFORM, { group: 'Ausführung', default: 'rechteckig' }),
  txt('abmessung', 'Abmessung', { group: 'Ausführung', placeholder: '600 × 400 mm bzw. Ø 250 mm', short: '' }),
  num('querschnitt', 'Freier Querschnitt', 'm²', { group: 'Ausführung', step: 0.001, min: 0 }),
  calc('geschwindigkeit', 'Strömungsgeschwindigkeit', 'm/s', (p) => {
    const v = toNum(p.volumenstrom)
    const a = toNum(p.querschnitt)
    return v !== null && a ? round(v / 3600 / a, 2) : null
  }, { group: 'Auslegung', hint: 'Aus Volumenstrom und freiem Querschnitt' }),
  num('laenge', 'Länge', 'm', { group: 'Ausführung', step: 0.1, min: 0 }),
  sel('werkstoff', 'Werkstoff', KANALWERKSTOFF, { group: 'Ausführung', default: 'verzinkter Stahl' }),
  sel('dichtheit', 'Dichtheitsklasse', DICHTHEITSKLASSE, { group: 'Ausführung', default: 'ATC 5 (C)', hint: 'DIN EN 12237 / DIN EN 1507' }),
  num('daemmdicke', 'Dämmdicke', 'mm', { group: 'Dämmung', step: 10, min: 0 }),
  sel('daemmart', 'Dämmart', ['keine', 'Wärmedämmung', 'Kältedämmung mit Dampfsperre', 'Schalldämmung', 'Brandschutzbekleidung'], { group: 'Dämmung', default: 'keine' }),
  num('dp', 'Druckverlust', 'Pa', { group: 'Auslegung', step: 1 }),
  bool('reinigungsoeffnung', 'Reinigungsöffnungen nach DIN EN 12097', { group: 'Hygiene' }),
  txt('bemerkung', 'Bemerkung', { group: 'Kennzeichnung' }),
]

/** Wasser- und Kälteleitung. */
const FLUID: ParamDef[] = [
  txt('nennweite', 'Nennweite', { group: 'Ausführung', placeholder: 'DN 50', short: '' }),
  num('volumenstrom', 'Volumenstrom', 'm³/h', { group: 'Auslegung', step: 0.1, min: 0, showByDefault: true, short: 'V̇' }),
  num('temperatur', 'Auslegungstemperatur', '°C', { group: 'Auslegung', step: 1 }),
  sel('werkstoff', 'Werkstoff', ['Stahl nahtlos', 'Edelstahl', 'Kupfer', 'Mehrschichtverbundrohr', 'Kunststoff'], { group: 'Ausführung', default: 'Stahl nahtlos' }),
  num('daemmdicke', 'Dämmdicke', 'mm', { group: 'Dämmung', step: 5, min: 0 }),
  sel('daemmart', 'Dämmart', ['keine', 'Wärmedämmung nach GEG', 'Kältedämmung mit Dampfsperre'], { group: 'Dämmung', default: 'Wärmedämmung nach GEG' }),
  num('laenge', 'Länge', 'm', { group: 'Ausführung', step: 0.1, min: 0 }),
  num('dp', 'Druckverlust', 'kPa', { group: 'Auslegung', step: 0.5 }),
  txt('bemerkung', 'Bemerkung', { group: 'Kennzeichnung' }),
]

/** Signal- und Busleitung. */
const SIGNAL: ParamDef[] = [
  sel('signalart', 'Signalart', ['Analog 0–10 V', 'Analog 4–20 mA', 'Digital', 'Bus (BACnet)', 'Bus (Modbus)', 'Bus (KNX)', 'Widerstand (Pt1000)'], { group: 'MSR', default: 'Analog 0–10 V', short: '' }),
  txt('leitung', 'Leitungstyp', { group: 'Ausführung', placeholder: 'J-Y(St)Y 2 × 2 × 0,8' }),
  num('laenge', 'Länge', 'm', { group: 'Ausführung', step: 0.5, min: 0 }),
  bool('geschirmt', 'Geschirmt', { group: 'Ausführung', default: true }),
  txt('bemerkung', 'Bemerkung', { group: 'Kennzeichnung' }),
]

export function edgeParamDefs(kind: EdgeKind): ParamDef[] {
  return kind === 'air' ? AIR : kind === 'fluid' ? FLUID : SIGNAL
}

export function defaultEdgeParams(kind: EdgeKind): ParamValues {
  const out: ParamValues = {}
  for (const p of edgeParamDefs(kind)) {
    if (p.type === 'computed') continue
    out[p.key] = p.default ?? (p.type === 'boolean' ? false : null)
  }
  return out
}

export function defaultEdgeVisible(kind: EdgeKind): string[] {
  return edgeParamDefs(kind).filter((p) => p.showByDefault).map((p) => p.key)
}

export function withComputedEdge(kind: EdgeKind, values: ParamValues): ParamValues {
  const out: ParamValues = { ...values }
  for (const p of edgeParamDefs(kind)) {
    if (p.type === 'computed' && p.compute) out[p.key] = p.compute(out)
  }
  return out
}

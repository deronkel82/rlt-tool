import type { ParamDef, ParamValue, ParamValues } from './types'

export const txt = (key: string, label: string, o: Partial<ParamDef> = {}): ParamDef =>
  ({ key, label, type: 'text', ...o })

export const mlt = (key: string, label: string, o: Partial<ParamDef> = {}): ParamDef =>
  ({ key, label, type: 'multiline', ...o })

export const num = (key: string, label: string, unit?: string, o: Partial<ParamDef> = {}): ParamDef =>
  ({ key, label, type: 'number', unit, ...o })

export const sel = (key: string, label: string, options: readonly string[], o: Partial<ParamDef> = {}): ParamDef =>
  ({ key, label, type: 'select', options, ...o })

export const bool = (key: string, label: string, o: Partial<ParamDef> = {}): ParamDef =>
  ({ key, label, type: 'boolean', ...o })

export const calc = (
  key: string, label: string, unit: string | undefined,
  compute: (p: ParamValues) => ParamValue, o: Partial<ParamDef> = {},
): ParamDef => ({ key, label, type: 'computed', unit, compute, ...o })

/** Zahl aus einem Parameterwert, sonst null. */
export function toNum(v: ParamValue): number | null {
  if (v === null || v === undefined || v === '') return null
  const x = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  return Number.isFinite(x) ? x : null
}

export function round(v: number, digits = 1): number {
  const f = 10 ** digits
  return Math.round(v * f) / f
}

// ---------------------------------------------------------------------------
// Wiederkehrende Auswahllisten
// ---------------------------------------------------------------------------

/** Luftfilterklassen nach DIN EN ISO 16890. */
export const FILTERKLASSEN_16890 = [
  'ISO Coarse 45 %', 'ISO Coarse 60 %', 'ISO Coarse 70 %', 'ISO Coarse 80 %',
  'ISO ePM10 50 %', 'ISO ePM10 60 %', 'ISO ePM10 70 %', 'ISO ePM10 80 %',
  'ISO ePM2,5 50 %', 'ISO ePM2,5 60 %', 'ISO ePM2,5 70 %', 'ISO ePM2,5 80 %',
  'ISO ePM1 50 %', 'ISO ePM1 55 %', 'ISO ePM1 60 %', 'ISO ePM1 70 %', 'ISO ePM1 80 %',
] as const

/** Schwebstofffilterklassen nach DIN EN 1822. */
export const FILTERKLASSEN_1822 = ['E10', 'E11', 'E12', 'H13', 'H14', 'U15', 'U16', 'U17'] as const

/** Raumluftqualitätsklassen nach DIN EN 16798-1. */
export const IDA_KLASSEN = [
  'IDA 1 - hohe Qualität',
  'IDA 2 - mittlere Qualität',
  'IDA 3 - mäßige Qualität',
  'IDA 4 - niedrige Qualität',
] as const

/** Außenluftqualität nach DIN EN 16798-3. */
export const ODA_KLASSEN = ['ODA 1', 'ODA 2', 'ODA 3'] as const

export const KANALFORM = ['rechteckig', 'rund', 'oval'] as const
export const KANALWERKSTOFF = ['verzinkter Stahl', 'Edelstahl', 'Aluminium', 'Kunststoff', 'Wickelfalzrohr', 'Textil'] as const

/** Dichtheitsklassen nach DIN EN 12237 / DIN EN 1507, ATC nach DIN EN 17192. */
export const DICHTHEITSKLASSE = ['ATC 7 (A)', 'ATC 6 (B)', 'ATC 5 (C)', 'ATC 4 (D)'] as const

export const NUTZUNGSARTEN = [
  'Büro (Einzel)', 'Büro (Gross)', 'Besprechungsraum', 'Klassenraum', 'Hörsaal',
  'Versammlungsraum', 'Verkaufsraum', 'Gastraum', 'Küche (gewerblich)',
  'Produktionshalle', 'Lagerhalle', 'Werkstatt', 'Labor', 'Reinraum',
  'Operationsraum', 'Patientenzimmer', 'Serverraum', 'Technikzentrale',
  'Sporthalle', 'Schwimmhalle', 'Tiefgarage', 'Sanitärraum', 'Wohnung', 'Sonstige',
] as const

export const DRUCKHALTUNG = ['Gleichdruck', 'Überdruck', 'Unterdruck'] as const

export const FEUERWIDERSTAND = ['EI 30-S', 'EI 60-S', 'EI 90-S', 'EI 120-S'] as const

export const ANTRIEBSART = ['Direktantrieb', 'Riemenantrieb'] as const
export const REGELUNG = ['ungeregelt', 'Frequenzumrichter', 'EC-Motor', 'Drehzahlsteller'] as const
export const SCHUTZART = ['IP 20', 'IP 21', 'IP 44', 'IP 54', 'IP 55', 'IP 65'] as const
export const ENERGIEEFFIZIENZ = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'] as const

// ---------------------------------------------------------------------------
// Wiederverwendbare Felder
// ---------------------------------------------------------------------------

export const pVolumenstrom = (o: Partial<ParamDef> = {}): ParamDef =>
  num('volumenstrom', 'Volumenstrom', 'm³/h', { group: 'Auslegung', showByDefault: true, short: 'V̇', step: 10, min: 0, ...o })

export const pDruckverlust = (o: Partial<ParamDef> = {}): ParamDef =>
  num('druckverlust', 'Druckverlust', 'Pa', { group: 'Auslegung', step: 5, min: 0, ...o })

export const pLeistung = (label = 'Leistung', o: Partial<ParamDef> = {}): ParamDef =>
  num('leistung', label, 'kW', { group: 'Auslegung', step: 0.1, min: 0, ...o })

export const pAbmessung = (o: Partial<ParamDef> = {}): ParamDef =>
  txt('abmessung', 'Abmessung', { group: 'Ausführung', placeholder: '600 x 400 mm', ...o })

export const pAnzahl = (o: Partial<ParamDef> = {}): ParamDef =>
  num('anzahl', 'Anzahl', 'Stk', { group: 'Ausführung', default: 1, min: 1, step: 1, ...o })

export const pSchallleistung = (o: Partial<ParamDef> = {}): ParamDef =>
  num('lwa', 'Schallleistungspegel', 'dB(A)', { group: 'Schall', step: 1, ...o })

/** Felder, die jede Komponente zusaetzlich bekommt. */
export const STANDARD_PARAMS: ParamDef[] = [
  txt('bezeichnung', 'Klartextbezeichnung', { group: 'Kennzeichnung', placeholder: 'z. B. Zuluftventilator Halle' }),
  txt('fabrikat', 'Fabrikat / Typ', { group: 'Kennzeichnung' }),
  txt('position', 'Positionsnummer', { group: 'Kennzeichnung' }),
  txt('bemerkung', 'Bemerkung', { group: 'Kennzeichnung' }),
]

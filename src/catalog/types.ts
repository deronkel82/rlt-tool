import type { ReactNode } from 'react'
import type { Theme } from '../theme'

/** Richtung, in die ein Anschluss aus dem Symbol herauszeigt. */
export type PortDir = 'left' | 'right' | 'top' | 'bottom'

/** Welches Medium an einem Anschluss anliegt. */
export type MediumKind = 'air' | 'fluid' | 'signal'

export interface PortDef {
  id: string
  /** Lage im lokalen Symbolkoordinatensystem, 0..1 der Bounding-Box */
  rx: number
  ry: number
  dir: PortDir
  kind: MediumKind
  label?: string
}

export type ParamType = 'text' | 'multiline' | 'number' | 'select' | 'boolean' | 'computed'

export type ParamValue = string | number | boolean | null
export type ParamValues = Record<string, ParamValue>

export interface ParamDef {
  key: string
  label: string
  type: ParamType
  unit?: string
  options?: readonly string[]
  min?: number
  max?: number
  step?: number
  placeholder?: string
  default?: ParamValue
  /** Gruppenüberschrift im Eigenschaftenfenster */
  group?: string
  /** Bei type 'computed': Ableitung aus den uebrigen Werten */
  compute?: (p: ParamValues) => ParamValue
  /** Wird der Wert von Haus aus als Beschriftung am Symbol gezeigt? */
  showByDefault?: boolean
  /** Kurzform fuer die Beschriftung am Symbol, z.B. "V" statt "Volumenstrom" */
  short?: string
  /** Erklaerung, z.B. Normbezug */
  hint?: string
}

export interface DrawCtx {
  w: number
  h: number
  /** Betriebsmittelkennzeichen, z. B. TI-01 */
  tag: string
  /** Parameterwerte der konkreten Komponente */
  p: ParamValues
  t: Theme
  /** true, wenn einfarbig (Schwarzweißdruck) gezeichnet wird */
  mono: boolean
  /** Drehung des Symbols in Grad — Beschriftungen gleichen sie aus */
  rot: number
  /** Waagerechte Spiegelung des Symbols */
  flip: boolean
}

export type CategoryId =
  | 'luftbehandlung'
  | 'wrg'
  | 'klappen'
  | 'kanal'
  | 'durchlaesse'
  | 'msr'
  | 'hydraulik'
  | 'erzeuger'
  | 'raum'

export interface SymbolDef {
  id: string
  label: string
  category: CategoryId
  /** Praefix des Betriebsmittelkennzeichens, z.B. VENT -> VENT-01 */
  tagPrefix: string
  /** Standardabmessung in Zeichnungseinheiten (Raster 8) */
  w: number
  h: number
  resizable?: boolean
  minW?: number
  minH?: number
  layer?: 'background' | 'default'
  ports: PortDef[]
  params: ParamDef[]
  draw: (c: DrawCtx) => ReactNode
  /** Normbezug, wird im Eigenschaftenfenster angezeigt */
  norm?: string
  /** Zusaetzliche Suchbegriffe fuer die Palette */
  keywords?: string[]
}

export interface CategoryDef {
  id: CategoryId
  label: string
  short: string
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'luftbehandlung', label: 'Luftbehandlung', short: 'Luft' },
  { id: 'wrg', label: 'Wärmerückgewinnung', short: 'WRG' },
  { id: 'klappen', label: 'Klappen und Brandschutz', short: 'Klappen' },
  { id: 'kanal', label: 'Kanal und Formteile', short: 'Kanal' },
  { id: 'durchlaesse', label: 'Luftdurchlässe', short: 'Durchlass' },
  { id: 'msr', label: 'MSR und Sensorik', short: 'MSR' },
  { id: 'hydraulik', label: 'Wasser- und Kältekreis', short: 'Hydraulik' },
  { id: 'erzeuger', label: 'Erzeuger', short: 'Erzeuger' },
  { id: 'raum', label: 'Räume und Beschriftung', short: 'Raum' },
]

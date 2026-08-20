/** Luftarten nach DIN EN 12792 / DIN EN 16798-3. */
export const AIR_TYPES = {
  AUL: { label: 'Außenluft', abbr: 'AUL', en: 'ODA' },
  ZUL: { label: 'Zuluft', abbr: 'ZUL', en: 'SUP' },
  ABL: { label: 'Abluft', abbr: 'ABL', en: 'ETA' },
  FOL: { label: 'Fortluft', abbr: 'FOL', en: 'EHA' },
  UML: { label: 'Umluft', abbr: 'UML', en: 'RCA' },
  MIL: { label: 'Mischluft', abbr: 'MIL', en: 'MIA' },
  UEB: { label: 'Überströmluft', abbr: 'UEB', en: 'TRA' },
} as const

export type AirType = keyof typeof AIR_TYPES

/** Medien im Wasser- und Kältekreis. */
export const FLUID_TYPES = {
  HZ_VL: { label: 'Heizung Vorlauf', abbr: 'HZ-VL' },
  HZ_RL: { label: 'Heizung Rücklauf', abbr: 'HZ-RL' },
  KA_VL: { label: 'Kälte Vorlauf', abbr: 'KA-VL' },
  KA_RL: { label: 'Kälte Rücklauf', abbr: 'KA-RL' },
  KM: { label: 'Kältemittel', abbr: 'KM' },
  DA: { label: 'Dampf', abbr: 'DA' },
  KO: { label: 'Kondensat', abbr: 'KO' },
  WA: { label: 'Wasser', abbr: 'WA' },
} as const

export type FluidType = keyof typeof FLUID_TYPES

export interface Theme {
  name: 'hell' | 'dunkel' | 'druck'
  bg: string
  grid: string
  gridStrong: string
  line: string
  fill: string
  text: string
  muted: string
  accent: string
  accentSoft: string
  selection: string
  air: Record<AirType, string>
  fluid: Record<FluidType, string>
  signal: string
  danger: string
}

const AIR_COLORS: Record<AirType, string> = {
  AUL: '#2f8f4e',
  ZUL: '#1a6fd4',
  ABL: '#d99206',
  FOL: '#7a5240',
  UML: '#e2661a',
  MIL: '#6b7a8c',
  UEB: '#8e7cc3',
}

const FLUID_COLORS: Record<FluidType, string> = {
  HZ_VL: '#cc3232',
  HZ_RL: '#8f4a4a',
  KA_VL: '#1aa3c4',
  KA_RL: '#4a7f8f',
  KM: '#7a4fb5',
  DA: '#c26bb0',
  KO: '#6b7a8c',
  WA: '#3d7ea6',
}

export const themeLight: Theme = {
  name: 'hell',
  bg: '#f6f7f9',
  grid: '#e3e6ea',
  gridStrong: '#d2d7de',
  line: '#1f2933',
  fill: '#ffffff',
  text: '#1f2933',
  muted: '#6b7480',
  accent: '#1a6fd4',
  accentSoft: '#dbe9fb',
  selection: '#1a6fd4',
  air: AIR_COLORS,
  fluid: FLUID_COLORS,
  signal: '#8a929c',
  danger: '#cc3232',
}

export const themeDark: Theme = {
  ...themeLight,
  name: 'dunkel',
  bg: '#15181d',
  grid: '#22262d',
  gridStrong: '#2c323b',
  line: '#e6e9ed',
  fill: '#1b1f25',
  text: '#e6e9ed',
  muted: '#98a1ad',
  accent: '#5da0ef',
  accentSoft: '#1d3350',
  air: {
    AUL: '#5cc47c',
    ZUL: '#5da0ef',
    ABL: '#efb949',
    FOL: '#b58a72',
    UML: '#f08c47',
    MIL: '#9aa8b8',
    UEB: '#b2a3e0',
  },
  fluid: {
    HZ_VL: '#ef6a6a',
    HZ_RL: '#c08585',
    KA_VL: '#54c8e4',
    KA_RL: '#7fb3c2',
    KM: '#a888e0',
    DA: '#dc93cd',
    KO: '#9aa8b8',
    WA: '#6fa9cc',
  },
}

/** Fuer Export und Druck: weißer Grund, kraeftige Linien. */
export const themePrint: Theme = {
  ...themeLight,
  name: 'druck',
  bg: '#ffffff',
  grid: '#ffffff',
  gridStrong: '#ffffff',
}

/** Alle Farben durch Schwarz ersetzen (Schwarzweißausgabe). */
export function monochrome(t: Theme): Theme {
  const black = '#000000'
  const air = Object.fromEntries(Object.keys(AIR_COLORS).map((k) => [k, black])) as Record<AirType, string>
  const fluid = Object.fromEntries(Object.keys(FLUID_COLORS).map((k) => [k, black])) as Record<FluidType, string>
  return { ...t, line: black, text: black, muted: '#444444', accent: black, air, fluid, signal: black, fill: '#ffffff', bg: '#ffffff' }
}

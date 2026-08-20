import type { PortDef } from './types'

/** Durchströmtes Bauteil: Lufteintritt links, Luftaustritt rechts. */
export const airInOut = (): PortDef[] => [
  { id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air', label: 'Lufteintritt' },
  { id: 'out', rx: 1, ry: 0.5, dir: 'right', kind: 'air', label: 'Luftaustritt' },
]

/** Zusaetzliche Medienanschlüsse unten (Vor- und Rücklauf). */
export const fluidBelow = (vl = 'Vorlauf', rl = 'Rücklauf'): PortDef[] => [
  { id: 'vl', rx: 0.28, ry: 1, dir: 'bottom', kind: 'fluid', label: vl },
  { id: 'rl', rx: 0.72, ry: 1, dir: 'bottom', kind: 'fluid', label: rl },
]

/** Signalanschluss oben (MSR). */
export const signalTop = (): PortDef[] => [
  { id: 'sig', rx: 0.5, ry: 0, dir: 'top', kind: 'signal', label: 'Signal' },
]

/** Zwei Luftwege übereinander (Wärmerückgewinnung, Mischkammer). */
export const airDual = (): PortDef[] => [
  { id: 'in1', rx: 0, ry: 0.28, dir: 'left', kind: 'air', label: 'Eintritt oben' },
  { id: 'out1', rx: 1, ry: 0.28, dir: 'right', kind: 'air', label: 'Austritt oben' },
  { id: 'in2', rx: 1, ry: 0.72, dir: 'right', kind: 'air', label: 'Eintritt unten' },
  { id: 'out2', rx: 0, ry: 0.72, dir: 'left', kind: 'air', label: 'Austritt unten' },
]

/** Nur ein Anschluss links (Senke) bzw. rechts (Quelle). */
export const airIn = (): PortDef[] => [{ id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air', label: 'Anschluss' }]
export const airOut = (): PortDef[] => [{ id: 'out', rx: 1, ry: 0.5, dir: 'right', kind: 'air', label: 'Anschluss' }]

/** Anschlüsse an allen vier Seiten (Räume, Verteiler). */
export const airQuad = (): PortDef[] => [
  { id: 'w', rx: 0, ry: 0.5, dir: 'left', kind: 'air', label: 'links' },
  { id: 'e', rx: 1, ry: 0.5, dir: 'right', kind: 'air', label: 'rechts' },
  { id: 'nn', rx: 0.5, ry: 0, dir: 'top', kind: 'air', label: 'oben' },
  { id: 's', rx: 0.5, ry: 1, dir: 'bottom', kind: 'air', label: 'unten' },
]

export const fluidInOut = (): PortDef[] => [
  { id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'fluid', label: 'Eintritt' },
  { id: 'out', rx: 1, ry: 0.5, dir: 'right', kind: 'fluid', label: 'Austritt' },
]

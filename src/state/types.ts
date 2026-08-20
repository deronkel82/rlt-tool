import type { ParamValues } from '../catalog/types'
import type { AirType, FluidType } from '../theme'

export type Rotation = 0 | 90 | 180 | 270

export interface RltNode {
  id: string
  /** Verweis auf den Symbolkatalog */
  type: string
  x: number
  y: number
  w: number
  h: number
  rot: Rotation
  /** Waagerecht gespiegelt */
  flip: boolean
  /** Betriebsmittelkennzeichen, z. B. VENT-01 */
  tag: string
  params: ParamValues
  /** Parameter, die als Beschriftung am Symbol erscheinen */
  visible: string[]
  /** Versatz der Beschriftung gegenüber der Standardlage */
  labelDx: number
  labelDy: number
  /** Beschriftung ganz ausblenden */
  hideLabel?: boolean
}

export type EdgeKind = 'air' | 'fluid' | 'signal'

export interface EdgeEnd {
  node: string
  port: string
}

export interface RltEdge {
  id: string
  a: EdgeEnd
  b: EdgeEnd
  kind: EdgeKind
  air: AirType
  fluid: FluidType
  /** Verschiebung des mittleren Segments beim Verlegen */
  offset: number
  params: ParamValues
  visible: string[]
  labelDx: number
  labelDy: number
}

export interface DocMeta {
  projekt: string
  anlage: string
  bearbeiter: string
  datum: string
  bemerkung: string
}

export interface RltDoc {
  version: 1
  meta: DocMeta
  nodes: RltNode[]
  edges: RltEdge[]
  /** Fortlaufende Nummern je Kennzeichen-Praefix */
  counters: Record<string, number>
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export function emptyDoc(): RltDoc {
  return {
    version: 1,
    meta: {
      projekt: 'Neues Projekt',
      anlage: '',
      bearbeiter: '',
      datum: new Date().toISOString().slice(0, 10),
      bemerkung: '',
    },
    nodes: [],
    edges: [],
    counters: {},
  }
}

let seq = 0
export function newId(prefix = 'n'): string {
  seq += 1
  const rnd = Math.random().toString(36).slice(2, 8)
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}${rnd}`
}

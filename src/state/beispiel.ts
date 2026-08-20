import { defaultParams, defaultVisibleParams, requireSymbol } from '../catalog'
import { defaultEdgeParams, defaultEdgeVisible } from '../catalog/edge'
import type { ParamValues } from '../catalog/types'
import type { AirType } from '../theme'
import type { RltDoc, RltEdge, RltNode } from './types'
import { emptyDoc } from './types'

interface Spec {
  type: string
  x: number
  y: number
  tag: string
  params?: ParamValues
  w?: number
  h?: number
  flip?: boolean
}

function mk(spec: Spec): RltNode {
  const def = requireSymbol(spec.type)
  return {
    id: spec.tag,
    type: spec.type,
    x: spec.x,
    y: spec.y,
    w: spec.w ?? def.w,
    h: spec.h ?? def.h,
    rot: 0,
    flip: spec.flip ?? false,
    tag: spec.tag,
    params: { ...defaultParams(def), ...(spec.params ?? {}) },
    visible: defaultVisibleParams(def),
    labelDx: 0,
    labelDy: 0,
  }
}

function link(a: string, ap: string, b: string, bp: string, air: AirType, params: ParamValues = {}): RltEdge {
  return {
    id: `e-${a}-${b}`,
    a: { node: a, port: ap },
    b: { node: b, port: bp },
    kind: 'air',
    air,
    fluid: 'HZ_VL',
    offset: 0,
    params: { ...defaultEdgeParams('air'), ...params },
    visible: defaultEdgeVisible('air'),
    labelDx: 0,
    labelDy: 0,
  }
}

/**
 * Beispielanlage: Zentralgerät mit Wärmerückgewinnung, das eine Halle
 * versorgt — Zuluft in die Nutzungseinheit, Abluft daraus zurück über die
 * Wärmerückgewinnung ins Freie.
 */
export function beispielDoc(): RltDoc {
  const doc = emptyDoc()
  doc.meta = {
    projekt: 'Beispiel — Montagehalle Nord',
    anlage: 'RLT 01',
    bearbeiter: '',
    datum: new Date().toISOString().slice(0, 10),
    bemerkung: 'Beispielschema zum Ausprobieren',
  }

  const Z = 140
  const A = 236

  doc.nodes = [
    mk({ type: 'nutzungseinheit', x: 914, y: 55, w: 260, h: 267, tag: 'RAUM-01', params: {
      raumname: 'Montagehalle Nord', nutzung: 'Produktionshalle', flaeche: 1200, hoehe: 6.5,
      personen: 45, v_zul: 5400, v_abl: 5100, t_soll_winter: 19, t_soll_sommer: 26,
      druckhaltung: 'Überdruck', druckdifferenz: 8, lp_zul: 55,
    } }),

    mk({ type: 'aussenluftfassung', x: 40, y: Z - 22, tag: 'AUL-01', params: { volumenstrom: 5400, oda: 'ODA 2', hoehe: 3.5 } }),
    mk({ type: 'klappe-motor', x: 116, y: Z - 36, tag: 'KL-01', params: { abmessung: '800 × 500 mm', leckluftklasse: 'Klasse 3' } }),
    mk({ type: 'filter', x: 188, y: Z - 22, tag: 'FIL-01', params: { filterklasse: 'ISO ePM1 60 %', bauart: 'Taschenfilter', dp_anfang: 85, dp_end: 250 } }),
    mk({ type: 'wrg-platten', x: 276, y: Z - 0.28 * 218, w: 110, h: 218, tag: 'WRG-01', params: {
      rueckwaermzahl: 78, v_zul: 5400, v_abl: 5100, druckverlust: 160, dp_abl: 150, effizienzklasse: 'H2', bypass: true,
    } }),
    mk({ type: 'erhitzer', x: 410, y: Z - 22, tag: 'ERH-01', params: { leistung: 42, t_luft_ein: -1, t_luft_aus: 20, t_vl: 70, t_rl: 50 } }),
    mk({ type: 'kuehler', x: 498, y: Z - 22, tag: 'KUE-01', params: { leistung: 38, t_luft_ein: 30, t_luft_aus: 16, t_vl: 6, t_rl: 12 } }),
    mk({ type: 'befeuchter-dampf', x: 586, y: Z - 22, tag: 'BEF-01', params: { befeuchtungsleistung: 24, rf_soll: 40 } }),
    mk({ type: 'ventilator', x: 674, y: Z - 24, tag: 'VENT-01', params: { volumenstrom: 5400, pressung: 750, regelung: 'EC-Motor', motorleistung: 2.2 } }),
    mk({ type: 'schalldaempfer', x: 746, y: Z - 22, tag: 'SD-01', params: { laenge: 1000, dw: 22 } }),
    mk({ type: 'klappe-brandschutz', x: 834, y: Z - 28, tag: 'BSK-01', params: { feuerwiderstand: 'EI 90-S', abmessung: '800 × 500 mm' } }),

    mk({ type: 'schalldaempfer', x: 800, y: A - 22, tag: 'SD-02', params: { laenge: 1000, dw: 20 } }),
    mk({ type: 'filter', x: 700, y: A - 22, tag: 'FIL-02', params: { filterklasse: 'ISO ePM10 60 %', bauart: 'Taschenfilter' } }),
    mk({ type: 'ventilator', x: 180, y: A - 24, tag: 'VENT-02', params: { volumenstrom: 5100, pressung: 620, regelung: 'EC-Motor', motorleistung: 1.8 } }),
    mk({ type: 'fortluftausblasung', x: 60, y: A - 22, tag: 'FOL-01', flip: true, params: { volumenstrom: 5100, eta: 'ETA 2', hoehe: 1.5 } }),

    mk({ type: 'sensor-differenzdruck', x: 204, y: Z - 68, tag: 'PDS-01', params: { schaltpunkt: 250, funktion: 'Filterüberwachung' } }),
    mk({ type: 'sensor-temperatur-regler', x: 466, y: Z - 68, tag: 'TIC-01', params: { sollwert: 20, regelart: 'PI', stellgroesse: 'Ventil ERH-01' } }),
  ]

  doc.edges = [
    link('AUL-01', 'out', 'KL-01', 'in', 'AUL'),
    link('KL-01', 'out', 'FIL-01', 'in', 'AUL'),
    link('FIL-01', 'out', 'WRG-01', 'in1', 'AUL'),
    link('WRG-01', 'out1', 'ERH-01', 'in', 'ZUL', { volumenstrom: 5400, abmessung: '800 × 500 mm', querschnitt: 0.4 }),
    link('ERH-01', 'out', 'KUE-01', 'in', 'ZUL'),
    link('KUE-01', 'out', 'BEF-01', 'in', 'ZUL'),
    link('BEF-01', 'out', 'VENT-01', 'in', 'ZUL'),
    link('VENT-01', 'out', 'SD-01', 'in', 'ZUL'),
    link('SD-01', 'out', 'BSK-01', 'in', 'ZUL'),
    link('BSK-01', 'out', 'RAUM-01', 'zul_w', 'ZUL'),

    link('RAUM-01', 'abl_w', 'SD-02', 'out', 'ABL'),
    link('SD-02', 'in', 'FIL-02', 'out', 'ABL'),
    link('FIL-02', 'in', 'WRG-01', 'in2', 'ABL', { volumenstrom: 5100, abmessung: '800 × 500 mm', querschnitt: 0.4 }),
    link('WRG-01', 'out2', 'VENT-02', 'out', 'FOL'),
    link('VENT-02', 'in', 'FOL-01', 'in', 'FOL'),
  ]

  doc.counters = { RAUM: 1, AUL: 1, KL: 1, FIL: 2, WRG: 1, ERH: 1, KUE: 1, BEF: 1, VENT: 2, SD: 2, BSK: 1, FOL: 1, PDS: 1, TIC: 1 }
  return doc
}

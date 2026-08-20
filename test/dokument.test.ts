import { beforeEach, describe, expect, it } from 'vitest'
import { getSymbol, withComputed } from '../src/catalog'
import { bomToCsv, buildBom, buildEdgeBom } from '../src/export/bom'
import { docToJson, jsonToDoc } from '../src/export/project'
import { beispielDoc } from '../src/state/beispiel'
import { contentBounds, nextTag, useStore } from '../src/state/store'
import { emptyDoc } from '../src/state/types'
import { findSnap } from '../src/canvas/snapping'
import { edgePoints } from '../src/canvas/Schematic'

function reset() {
  useStore.setState({ doc: emptyDoc(), selection: [], past: [], future: [], dirty: false, armed: null })
}

describe('Kennzeichenvergabe', () => {
  it('zaehlt je Praefix fortlaufend und füllt mit Null auf', () => {
    const doc = emptyDoc()
    const a = nextTag(doc, 'VENT')
    expect(a.tag).toBe('VENT-01')
    const b = nextTag({ ...doc, counters: a.counters }, 'VENT')
    expect(b.tag).toBe('VENT-02')
    expect(nextTag({ ...doc, counters: b.counters }, 'FIL').tag).toBe('FIL-01')
  })

  it('vergibt gelöschte Nummern nicht erneut', () => {
    reset()
    const st = useStore.getState()
    const first = st.addNode('ventilator', 0, 0)
    st.addNode('ventilator', 200, 0)
    useStore.getState().select([first!])
    useStore.getState().deleteSelection()
    const third = useStore.getState().addNode('ventilator', 400, 0)
    const node = useStore.getState().doc.nodes.find((n) => n.id === third)
    expect(node?.tag).toBe('VENT-03')
  })
})

describe('Zustandsverwaltung', () => {
  beforeEach(reset)

  it('legt Komponenten mit Standardwerten an', () => {
    const id = useStore.getState().addNode('filter', 100, 100)
    const node = useStore.getState().doc.nodes.find((n) => n.id === id)
    expect(node).toBeDefined()
    expect(node?.params.filterklasse).toBe('ISO ePM1 60 %')
    expect(node?.visible).toContain('filterklasse')
  })

  it('lehnt unbekannte Symbolkennungen ab', () => {
    expect(useStore.getState().addNode('gibt-es-nicht', 0, 0)).toBeNull()
  })

  it('verbindet nur Anschlüsse gleicher Art und nicht doppelt', () => {
    const st = useStore.getState()
    const a = st.addNode('filter', 0, 0)!
    const b = st.addNode('ventilator', 200, 0)!
    const e1 = useStore.getState().connect({ node: a, port: 'out' }, { node: b, port: 'in' })
    expect(e1).not.toBeNull()
    const e2 = useStore.getState().connect({ node: a, port: 'out' }, { node: b, port: 'in' })
    expect(e2).toBeNull()

    const erhitzer = useStore.getState().addNode('erhitzer', 400, 0)!
    const gemischt = useStore.getState().connect({ node: erhitzer, port: 'vl' }, { node: b, port: 'in' })
    expect(gemischt).toBeNull()
  })

  it('löscht Leitungen mit, wenn eine Komponente entfernt wird', () => {
    const st = useStore.getState()
    const a = st.addNode('filter', 0, 0)!
    const b = useStore.getState().addNode('ventilator', 200, 0)!
    useStore.getState().connect({ node: a, port: 'out' }, { node: b, port: 'in' })
    expect(useStore.getState().doc.edges).toHaveLength(1)
    useStore.getState().select([a])
    useStore.getState().deleteSelection()
    expect(useStore.getState().doc.edges).toHaveLength(0)
  })

  it('nimmt Änderungen zurück und stellt sie wieder her', () => {
    useStore.getState().addNode('filter', 0, 0)
    expect(useStore.getState().doc.nodes).toHaveLength(1)
    useStore.getState().undo()
    expect(useStore.getState().doc.nodes).toHaveLength(0)
    useStore.getState().redo()
    expect(useStore.getState().doc.nodes).toHaveLength(1)
  })

  it('dupliziert Auswahl samt Leitungen und neuen Kennzeichen', () => {
    const st = useStore.getState()
    const a = st.addNode('filter', 0, 0)!
    const b = useStore.getState().addNode('ventilator', 200, 0)!
    useStore.getState().connect({ node: a, port: 'out' }, { node: b, port: 'in' })
    useStore.getState().select([a, b])
    useStore.getState().duplicateSelection()
    const doc = useStore.getState().doc
    expect(doc.nodes).toHaveLength(4)
    expect(doc.edges).toHaveLength(2)
    expect(new Set(doc.nodes.map((n) => n.tag)).size).toBe(4)
  })

  it('dreht die Auswahl in 90-Grad-Schritten', () => {
    const id = useStore.getState().addNode('filter', 0, 0)!
    useStore.getState().select([id])
    useStore.getState().rotateSelection(90)
    expect(useStore.getState().doc.nodes[0].rot).toBe(90)
    useStore.getState().rotateSelection(-90)
    expect(useStore.getState().doc.nodes[0].rot).toBe(0)
    useStore.getState().rotateSelection(-90)
    expect(useStore.getState().doc.nodes[0].rot).toBe(270)
  })
})

describe('Strang-Modus', () => {
  beforeEach(reset)

  it('rastet eine Komponente am freien Ausgang der Nachbarkomponente ein', () => {
    const st = useStore.getState()
    const a = st.addNode('filter', 0, 0)!
    const b = useStore.getState().addNode('ventilator', 100, 6)!
    const doc = useStore.getState().doc
    const moved = doc.nodes.find((n) => n.id === b)!
    const hit = findSnap(doc, moved)
    expect(hit).not.toBeNull()
    expect(hit?.to.node).toBe(a)
    expect(hit?.to.port).toBe('out')
    expect(hit?.from.port).toBe('in')
  })

  it('rastet nicht ein, wenn die Bauteile weit auseinanderliegen', () => {
    const st = useStore.getState()
    st.addNode('filter', 0, 0)
    const b = useStore.getState().addNode('ventilator', 600, 400)!
    const doc = useStore.getState().doc
    expect(findSnap(doc, doc.nodes.find((n) => n.id === b)!)).toBeNull()
  })
})

describe('Berechnete Parameter der Nutzungseinheit', () => {
  it('leitet Volumen, Luftwechsel und Bilanz aus den Eingaben ab', () => {
    const def = getSymbol('nutzungseinheit')!
    const values = withComputed(def, { flaeche: 200, hoehe: 3, v_zul: 1800, v_abl: 1500, personen: 20 })
    expect(values.volumen).toBe(600)
    expect(values.luftwechsel).toBe(3)
    expect(values.bilanz).toBe(300)
    expect(values.aul_pro_person).toBe(90)
    expect(values.flaechenbezogen).toBe(9)
  })

  it('laesst berechnete Felder leer, wenn Eingaben fehlen', () => {
    const def = getSymbol('nutzungseinheit')!
    const values = withComputed(def, { flaeche: null, hoehe: 3, v_zul: 1800 })
    expect(values.volumen).toBeNull()
    expect(values.luftwechsel).toBeNull()
  })
})

describe('Stückliste', () => {
  it('gruppiert nach Kategorie und führt gepflegte Kenndaten auf', () => {
    const doc = beispielDoc()
    const groups = buildBom(doc)
    expect(groups.length).toBeGreaterThan(2)
    const alle = groups.flatMap((g) => g.rows)
    expect(alle.length).toBe(doc.nodes.length)
    const vent = alle.find((r) => r.tag === 'VENT-01')
    expect(vent?.bauteil).toBe('Ventilator')
    expect(vent?.kenndaten).toContain('5.400 m³/h')
  })

  it('führt Leitungen mit Luftart auf', () => {
    const rows = buildEdgeBom(beispielDoc())
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.some((r) => r.bezeichnung === 'Zuluft')).toBe(true)
  })

  it('erzeugt CSV mit Semikolon und Kopfzeile', () => {
    const csv = bomToCsv(beispielDoc())
    const lines = csv.split('\r\n')
    expect(lines[0]).toContain('Kategorie;Kennzeichen')
    expect(lines.length).toBeGreaterThan(5)
  })

  it('maskiert Semikolon und Anführungszeichen', () => {
    const doc = emptyDoc()
    const def = getSymbol('filter')!
    doc.nodes.push({
      id: 'x', type: 'filter', x: 0, y: 0, w: def.w, h: def.h, rot: 0, flip: false,
      tag: 'FIL-01', params: { bezeichnung: 'Filter; "grob"' }, visible: [], labelDx: 0, labelDy: 0,
    })
    expect(bomToCsv(doc)).toContain('"Filter; ""grob"""')
  })
})

describe('Projektdatei', () => {
  it('überlebt Speichern und Laden unverändert', () => {
    const doc = beispielDoc()
    const wieder = jsonToDoc(docToJson(doc))
    expect(wieder.nodes).toHaveLength(doc.nodes.length)
    expect(wieder.edges).toHaveLength(doc.edges.length)
    expect(wieder.meta.projekt).toBe(doc.meta.projekt)
    expect(wieder.nodes[0].params).toEqual(doc.nodes[0].params)
  })

  it('setzt die Zähler so, dass neue Bauteile weiterzaehlen', () => {
    const wieder = jsonToDoc(docToJson(beispielDoc()))
    expect(nextTag(wieder, 'VENT').tag).toBe('VENT-03')
  })

  it('verwirft Leitungen ins Leere statt die Datei abzulehnen', () => {
    const doc = beispielDoc()
    const kaputt = JSON.parse(docToJson(doc)) as { doc: { edges: unknown[] } }
    kaputt.doc.edges.push({ id: 'x', a: { node: 'gibtsnicht', port: 'out' }, b: { node: 'auchnicht', port: 'in' }, kind: 'air' })
    const wieder = jsonToDoc(JSON.stringify(kaputt))
    expect(wieder.edges).toHaveLength(doc.edges.length)
  })

  it('meldet fehlerhafte Dateien verständlich', () => {
    expect(() => jsonToDoc('kein json')).toThrow(/JSON/)
    expect(() => jsonToDoc('{"a":1}')).toThrow(/RLT-Schema|Komponenten/)
    expect(() => jsonToDoc('{"nodes":[]}')).toThrow(/Komponenten/)
  })

  it('behaelt unbekannte Symboltypen als Platzhalter', () => {
    const doc = emptyDoc()
    doc.nodes.push({
      id: 'x', type: 'fremdes-symbol', x: 0, y: 0, w: 40, h: 40, rot: 0, flip: false,
      tag: 'X-01', params: {}, visible: [], labelDx: 0, labelDy: 0,
    })
    const wieder = jsonToDoc(docToJson(doc))
    expect(wieder.nodes[0].type).toBe('fremdes-symbol')
  })
})

describe('Beispielanlage', () => {
  const doc = beispielDoc()

  it('führt die Zuluft über die Nutzungseinheit zurück in die Abluft', () => {
    const raum = doc.nodes.find((n) => n.type === 'nutzungseinheit')
    expect(raum).toBeDefined()
    const zul = doc.edges.find((e) => e.b.node === raum!.id && e.b.port === 'zul_w')
    const abl = doc.edges.find((e) => e.a.node === raum!.id && e.a.port === 'abl_w')
    expect(zul?.air).toBe('ZUL')
    expect(abl?.air).toBe('ABL')
  })

  it('verbindet beide Straenge über die Wärmerückgewinnung', () => {
    const wrg = doc.nodes.find((n) => n.type === 'wrg-platten')!
    const anschluesse = doc.edges
      .filter((e) => e.a.node === wrg.id || e.b.node === wrg.id)
      .map((e) => (e.a.node === wrg.id ? e.a.port : e.b.port))
    expect(new Set(anschluesse)).toEqual(new Set(['in1', 'out1', 'in2', 'out2']))
  })

  it('verweist mit jeder Leitung auf vorhandene Anschlüsse', () => {
    for (const e of doc.edges) {
      expect(edgePoints(doc, e), `${e.a.node}:${e.a.port} → ${e.b.node}:${e.b.port}`).not.toBeNull()
    }
  })

  it('führt eng benachbarte Bauteile mit einer geraden Leitung zusammen', () => {
    const erh = doc.nodes.find((n) => n.tag === 'ERH-01')!
    const kante = doc.edges.find((e) => e.a.node === erh.id && e.a.port === 'out')!
    const pts = edgePoints(doc, kante)!
    expect(pts).toHaveLength(2)
    expect(pts[0].y).toBeCloseTo(pts[1].y, 5)
  })

  it('verlegt jede Leitung ohne Rücklauf entgegen der Strömungsrichtung', () => {
    for (const e of doc.edges) {
      const pts = edgePoints(doc, e)!
      const laenge = pts.slice(1).reduce((a, p, i) => a + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0)
      const luftlinie = Math.hypot(pts[pts.length - 1].x - pts[0].x, pts[pts.length - 1].y - pts[0].y)
      expect(laenge, `${e.a.node} → ${e.b.node}`).toBeLessThan(luftlinie * 2.6 + 60)
    }
  })

  it('verwendet nur Werte, die im Symbolkatalog vorgesehen sind', () => {
    for (const node of doc.nodes) {
      const def = getSymbol(node.type)
      expect(def, node.type).toBeDefined()
      for (const p of def!.params) {
        const v = node.params[p.key]
        if (p.type === 'select' && v !== null && v !== undefined && v !== '') {
          expect(p.options, `${node.tag}/${p.key}`).toContain(v)
        }
      }
    }
  })

  it('liefert einen sinnvollen Rahmen fuer die Ansicht', () => {
    const b = contentBounds(doc)
    expect(b).not.toBeNull()
    expect(b!.w).toBeGreaterThan(400)
    expect(b!.h).toBeGreaterThan(100)
  })
})

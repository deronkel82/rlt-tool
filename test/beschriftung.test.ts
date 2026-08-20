import { describe, expect, it } from 'vitest'
import { requireSymbol } from '../src/catalog'
import { nodeBounds } from '../src/canvas/geometry'
import { nodeLabelLage } from '../src/canvas/Schematic'
import { beispielDoc } from '../src/state/beispiel'
import type { RltNode } from '../src/state/types'

function knoten(type: string, over: Partial<RltNode> = {}): RltNode {
  const def = requireSymbol(type)
  return {
    id: 'n', type, x: 100, y: 100, w: def.w, h: def.h, rot: 0, flip: false,
    tag: `${def.tagPrefix}-01`, params: {}, visible: [], labelDx: 0, labelDy: 0, ...over,
  }
}

describe('Lage der Beschriftung', () => {
  it('setzt die Beschriftung gewöhnlicher Bauteile unter das Symbol', () => {
    const n = knoten('filter')
    const b = nodeBounds(n)
    const { box, anchor } = nodeLabelLage(n, requireSymbol(n.type))
    expect(anchor).toBe('middle')
    expect(box.y).toBeGreaterThanOrEqual(b.y + b.h)
  })

  it('setzt die Beschriftung von MSR-Kreisen über das Symbol', () => {
    const n = knoten('sensor-temperatur-regler')
    const b = nodeBounds(n)
    const { box } = nodeLabelLage(n, requireSymbol(n.type))
    expect(box.y + box.h, 'Beschriftung darf das Symbol nicht überlappen').toBeLessThanOrEqual(b.y + 1)
  })

  it('legt die Beschriftung von Räumen in das Symbol hinein', () => {
    const n = knoten('nutzungseinheit')
    const b = nodeBounds(n)
    const { box, anchor } = nodeLabelLage(n, requireSymbol(n.type))
    expect(anchor).toBe('end')
    expect(box.x).toBeGreaterThanOrEqual(b.x)
    expect(box.x + box.w).toBeLessThanOrEqual(b.x + b.w + 1)
  })

  it('verschiebt die Trefferfläche mit dem Versatz der Beschriftung', () => {
    const ohne = nodeLabelLage(knoten('filter'), requireSymbol('filter'))
    const mit = nodeLabelLage(knoten('filter', { labelDx: 20, labelDy: -12 }), requireSymbol('filter'))
    expect(mit.box.x).toBeCloseTo(ohne.box.x + 20, 5)
    expect(mit.box.y).toBeCloseTo(ohne.box.y - 12, 5)
  })

  it('wächst mit der Anzahl der angezeigten Werte', () => {
    const def = requireSymbol('ventilator')
    const eine = nodeLabelLage(knoten('ventilator', { params: { volumenstrom: 5400 }, visible: ['volumenstrom'] }), def)
    const zwei = nodeLabelLage(
      knoten('ventilator', { params: { volumenstrom: 5400, pressung: 750 }, visible: ['volumenstrom', 'pressung'] }),
      def,
    )
    expect(zwei.lines).toHaveLength(2)
    expect(zwei.box.h).toBeGreaterThan(eine.box.h)
  })

  it('deckt im Beispielschema keine Leitung mit einer Beschriftung ab', () => {
    const doc = beispielDoc()
    const msr = doc.nodes.filter((n) => requireSymbol(n.type).category === 'msr')
    expect(msr.length).toBeGreaterThan(0)
    for (const n of msr) {
      const b = nodeBounds(n)
      const { box } = nodeLabelLage(n, requireSymbol(n.type))
      // Die Wirkungslinie zeigt nach unten; dort darf keine Trefferfläche liegen.
      expect(box.y + box.h, n.tag).toBeLessThanOrEqual(b.y + 1)
    }
  })
})

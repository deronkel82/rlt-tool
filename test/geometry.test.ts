import { describe, expect, it } from 'vitest'
import {
  distanceToPolyline, nodeBounds, polylineMidpoint, polylinePath, portPoint,
  rotateDir, routeOrthogonal, simplify, snap,
} from '../src/canvas/geometry'
import type { PortDef } from '../src/catalog/types'
import type { RltNode } from '../src/state/types'

function node(over: Partial<RltNode> = {}): RltNode {
  return {
    id: 'n1', type: 'filter', x: 100, y: 100, w: 64, h: 44, rot: 0, flip: false,
    tag: 'FIL-01', params: {}, visible: [], labelDx: 0, labelDy: 0, ...over,
  }
}

const links: PortDef = { id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air' }
const rechts: PortDef = { id: 'out', rx: 1, ry: 0.5, dir: 'right', kind: 'air' }

describe('Anschlusslage', () => {
  it('liegt ohne Drehung auf der Bauteilkante', () => {
    expect(portPoint(node(), links)).toEqual({ x: 100, y: 122, dir: 'left' })
    expect(portPoint(node(), rechts)).toEqual({ x: 164, y: 122, dir: 'right' })
  })

  it('dreht Lage und Richtung um den Bauteilmittelpunkt', () => {
    const p = portPoint(node({ rot: 90 }), rechts)
    expect(p.dir).toBe('bottom')
    expect(p.x).toBeCloseTo(132, 5)
    expect(p.y).toBeCloseTo(154, 5)
  })

  it('spiegelt waagerechte Anschlüsse', () => {
    const p = portPoint(node({ flip: true }), links)
    expect(p.dir).toBe('right')
    expect(p.x).toBeCloseTo(164, 5)
  })

  it('dreht Richtungen im Kreis', () => {
    expect(rotateDir('right', 90, false)).toBe('bottom')
    expect(rotateDir('right', 180, false)).toBe('left')
    expect(rotateDir('right', 270, false)).toBe('top')
    expect(rotateDir('top', 90, false)).toBe('right')
    expect(rotateDir('left', 0, true)).toBe('right')
    expect(rotateDir('top', 0, true)).toBe('top')
  })
})

describe('Umhüllende', () => {
  it('tauscht Breite und Höhe bei 90 Grad', () => {
    expect(nodeBounds(node())).toEqual({ x: 100, y: 100, w: 64, h: 44 })
    expect(nodeBounds(node({ rot: 90 }))).toEqual({ x: 110, y: 90, w: 44, h: 64 })
  })
})

describe('Kanalführung', () => {
  it('verbindet gegenüberliegende Anschlüsse orthogonal', () => {
    const pts = routeOrthogonal({ x: 0, y: 0, dir: 'right' }, { x: 200, y: 80, dir: 'left' })
    expect(pts[0]).toEqual({ x: 0, y: 0 })
    expect(pts[pts.length - 1]).toEqual({ x: 200, y: 80 })
    for (let i = 1; i < pts.length; i++) {
      const dx = Math.abs(pts[i].x - pts[i - 1].x)
      const dy = Math.abs(pts[i].y - pts[i - 1].y)
      expect(dx < 0.01 || dy < 0.01, `Segment ${i} ist nicht orthogonal`).toBe(true)
    }
  })

  it('verlaesst jeden Anschluss zunächst in dessen Richtung', () => {
    const pts = routeOrthogonal({ x: 0, y: 0, dir: 'right' }, { x: 200, y: 80, dir: 'left' })
    expect(pts[1].x).toBeGreaterThan(pts[0].x)
    expect(pts[1].y).toBe(0)
    const last = pts[pts.length - 1]
    const beforeLast = pts[pts.length - 2]
    expect(beforeLast.y).toBe(last.y)
    expect(beforeLast.x).toBeLessThan(last.x)
  })

  it('legt einen Bogen, wenn das Ziel hinter dem Anschluss liegt', () => {
    const pts = routeOrthogonal({ x: 200, y: 0, dir: 'right' }, { x: 0, y: 0, dir: 'left' })
    expect(pts.length).toBeGreaterThan(3)
    for (let i = 1; i < pts.length; i++) {
      const dx = Math.abs(pts[i].x - pts[i - 1].x)
      const dy = Math.abs(pts[i].y - pts[i - 1].y)
      expect(dx < 0.01 || dy < 0.01).toBe(true)
    }
  })

  it('verbindet senkrechte und waagerechte Anschlüsse mit einem Knick', () => {
    const pts = routeOrthogonal({ x: 0, y: 0, dir: 'right' }, { x: 120, y: 200, dir: 'top' })
    expect(pts[pts.length - 1]).toEqual({ x: 120, y: 200 })
    for (let i = 1; i < pts.length; i++) {
      const dx = Math.abs(pts[i].x - pts[i - 1].x)
      const dy = Math.abs(pts[i].y - pts[i - 1].y)
      expect(dx < 0.01 || dy < 0.01).toBe(true)
    }
  })

  it('verschiebt das Mittelsegment über den Versatz', () => {
    const ohne = routeOrthogonal({ x: 0, y: 0, dir: 'right' }, { x: 200, y: 80, dir: 'left' })
    const mit = routeOrthogonal({ x: 0, y: 0, dir: 'right' }, { x: 200, y: 80, dir: 'left' }, 30)
    expect(mit[2].x).toBeCloseTo(ohne[2].x + 30, 5)
  })

  it('entfernt doppelte und gerade durchlaufende Punkte', () => {
    const pts = simplify([
      { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 10 },
    ])
    expect(pts).toEqual([{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 10 }])
  })
})

describe('Pfadhilfen', () => {
  it('erzeugt einen Pfad mit abgerundeten Ecken', () => {
    const d = polylinePath([{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }])
    expect(d.startsWith('M0 0')).toBe(true)
    expect(d).toContain('Q')
  })

  it('findet die Mitte eines Streckenzugs', () => {
    expect(polylineMidpoint([{ x: 0, y: 0 }, { x: 100, y: 0 }])).toEqual({ x: 50, y: 0 })
  })

  it('misst den Abstand zu einem Streckenzug', () => {
    expect(distanceToPolyline([{ x: 0, y: 0 }, { x: 100, y: 0 }], { x: 50, y: 12 })).toBeCloseTo(12, 5)
  })

  it('rastet auf das Raster', () => {
    expect(snap(13, 8)).toBe(16)
    expect(snap(11, 8)).toBe(8)
    expect(snap(-3, 8)).toBe(-0)
  })
})

import { describe, expect, it } from 'vitest'
import { CATEGORIES, SYMBOLS, defaultParams, defaultVisibleParams, getSymbol, requireSymbol, searchSymbols, withComputed } from '../src/catalog'
import { edgeParamDefs } from '../src/catalog/edge'
import { themeLight } from '../src/theme'

describe('Symbolkatalog', () => {
  it('enthaelt mehr als 80 Symbole', () => {
    expect(SYMBOLS.length).toBeGreaterThan(80)
  })

  it('vergibt eindeutige Kennungen', () => {
    const ids = SYMBOLS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ordnet jedes Symbol einer bekannten Kategorie zu', () => {
    const known = new Set(CATEGORIES.map((c) => c.id))
    for (const s of SYMBOLS) expect(known.has(s.category), `${s.id}: ${s.category}`).toBe(true)
  })

  it('belegt jede Kategorie mit mindestens einem Symbol', () => {
    for (const c of CATEGORIES) {
      expect(SYMBOLS.some((s) => s.category === c.id), c.id).toBe(true)
    }
  })

  it('gibt jedem Symbol Abmessungen, ein Kennzeichen-Praefix und Parameter', () => {
    for (const s of SYMBOLS) {
      expect(s.w, s.id).toBeGreaterThan(0)
      expect(s.h, s.id).toBeGreaterThan(0)
      expect(s.tagPrefix, s.id).toMatch(/^[A-Z]/)
      expect(s.params.length, s.id).toBeGreaterThan(0)
      expect(s.label.length, s.id).toBeGreaterThan(1)
    }
  })

  it('haelt Anschlusspunkte innerhalb der Umhüllenden und mit eindeutiger Kennung', () => {
    for (const s of SYMBOLS) {
      const ids = s.ports.map((p) => p.id)
      expect(new Set(ids).size, s.id).toBe(ids.length)
      for (const p of s.ports) {
        expect(p.rx, `${s.id}/${p.id}`).toBeGreaterThanOrEqual(0)
        expect(p.rx, `${s.id}/${p.id}`).toBeLessThanOrEqual(1)
        expect(p.ry, `${s.id}/${p.id}`).toBeGreaterThanOrEqual(0)
        expect(p.ry, `${s.id}/${p.id}`).toBeLessThanOrEqual(1)
      }
    }
  })

  it('vergibt eindeutige Parameterschluessel je Symbol', () => {
    for (const s of SYMBOLS) {
      const keys = s.params.map((p) => p.key)
      expect(new Set(keys).size, s.id).toBe(keys.length)
    }
  })

  it('gibt Auswahlfeldern Optionen und berechneten Feldern eine Rechenvorschrift', () => {
    for (const s of SYMBOLS) {
      for (const p of s.params) {
        if (p.type === 'select') expect(p.options?.length, `${s.id}/${p.key}`).toBeGreaterThan(0)
        if (p.type === 'computed') expect(typeof p.compute, `${s.id}/${p.key}`).toBe('function')
      }
    }
  })

  it('haelt Standardwerte von Auswahlfeldern in deren Optionsliste', () => {
    for (const s of SYMBOLS) {
      for (const p of s.params) {
        if (p.type === 'select' && p.default !== undefined && p.default !== null) {
          expect(p.options).toContain(p.default)
        }
      }
    }
  })

  it('zeichnet jedes Symbol in jeder Lage ohne Fehler', () => {
    const lagen = [
      { rot: 0, flip: false },
      { rot: 90, flip: false },
      { rot: 180, flip: true },
      { rot: 270, flip: true },
    ]
    for (const s of SYMBOLS) {
      const params = withComputed(s, defaultParams(s))
      for (const lage of lagen) {
        expect(
          () => s.draw({ w: s.w, h: s.h, tag: `${s.tagPrefix}-01`, p: params, t: themeLight, mono: false, ...lage }),
          `${s.id} bei ${lage.rot} Grad`,
        ).not.toThrow()
      }
    }
  })

  it('macht nur vorhandene Parameter von Haus aus sichtbar', () => {
    for (const s of SYMBOLS) {
      const keys = new Set(s.params.map((p) => p.key))
      for (const v of defaultVisibleParams(s)) expect(keys.has(v), `${s.id}/${v}`).toBe(true)
    }
  })

  it('ergaenzt jedes Symbol um die Kennzeichnungsfelder', () => {
    for (const s of SYMBOLS) {
      expect(s.params.some((p) => p.key === 'bezeichnung'), s.id).toBe(true)
      expect(s.params.some((p) => p.key === 'bemerkung'), s.id).toBe(true)
    }
  })

  it('liefert fuer unbekannte Kennungen einen Platzhalter statt eines Fehlers', () => {
    expect(getSymbol('gibt-es-nicht')).toBeUndefined()
    const fallback = requireSymbol('gibt-es-nicht')
    expect(fallback.id).toBe('gibt-es-nicht')
    expect(fallback.ports.length).toBeGreaterThan(0)
  })

  it('findet Symbole über Bezeichnung und Suchbegriffe', () => {
    expect(searchSymbols('ventilator').some((s) => s.id === 'ventilator')).toBe(true)
    expect(searchSymbols('brandschutz').some((s) => s.id === 'klappe-brandschutz')).toBe(true)
    expect(searchSymbols('hepa').some((s) => s.id === 'filter-schwebstoff')).toBe(true)
    expect(searchSymbols('halle').some((s) => s.id === 'nutzungseinheit')).toBe(true)
    expect(searchSymbols('zzzzz')).toHaveLength(0)
  })

  it('haelt die wichtigsten Normbauteile bereit', () => {
    const pflicht = [
      'ventilator', 'filter', 'erhitzer', 'kuehler', 'befeuchter-dampf', 'tropfenabscheider',
      'schalldaempfer', 'wrg-platten', 'wrg-rotation', 'klappe-brandschutz', 'vrg-variabel',
      'wetterschutzgitter', 'drallauslass', 'sensor-temperatur', 'pumpe', 'ventil-3wege',
      'kaeltemaschine', 'nutzungseinheit',
    ]
    for (const id of pflicht) expect(getSymbol(id), id).toBeDefined()
  })
})

describe('Leitungsparameter', () => {
  it('kennt Felder fuer alle drei Leitungsarten', () => {
    for (const kind of ['air', 'fluid', 'signal'] as const) {
      expect(edgeParamDefs(kind).length).toBeGreaterThan(2)
    }
  })
})

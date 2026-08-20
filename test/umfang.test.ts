import { describe, expect, it } from 'vitest'
import { CATEGORIES, SYMBOLS, getSymbol } from '../src/catalog'
import {
  UMFAENGE, UMFANG_LISTEN, anzahlImUmfang, symbolImUmfang, symboleImUmfang,
  type Umfang,
} from '../src/catalog/umfang'

const { REDUZIERT, MITTEL_ZUSATZ } = UMFANG_LISTEN

describe('Umfang der Symbolbibliothek', () => {
  it('verweist nur auf Symbole, die es wirklich gibt', () => {
    for (const id of [...REDUZIERT, ...MITTEL_ZUSATZ]) {
      expect(getSymbol(id), id).toBeDefined()
    }
  })

  it('führt kein Symbol doppelt', () => {
    const alle = [...REDUZIERT, ...MITTEL_ZUSATZ]
    expect(new Set(alle).size).toBe(alle.length)
  })

  it('baut die Stufen aufeinander auf', () => {
    for (const s of SYMBOLS) {
      if (symbolImUmfang(s.id, 'reduziert')) expect(symbolImUmfang(s.id, 'mittel'), s.id).toBe(true)
      if (symbolImUmfang(s.id, 'mittel')) expect(symbolImUmfang(s.id, 'gross'), s.id).toBe(true)
    }
  })

  it('wächst von Stufe zu Stufe spürbar', () => {
    const r = anzahlImUmfang('reduziert')
    const m = anzahlImUmfang('mittel')
    const g = anzahlImUmfang('gross')
    expect(r).toBeGreaterThan(15)
    expect(m).toBeGreaterThan(r)
    expect(g).toBeGreaterThan(m)
    expect(g).toBe(SYMBOLS.length)
  })

  it('meldet für jede Stufe so viele Symbole, wie sie auch liefert', () => {
    for (const u of UMFAENGE) {
      expect(symboleImUmfang(u.id).length, u.id).toBe(anzahlImUmfang(u.id))
    }
  })

  it('reicht im reduzierten Satz für ein vollständiges Anlagenschema', () => {
    const pflicht = [
      'ventilator', 'filter', 'erhitzer', 'kuehler', 'befeuchter-dampf', 'schalldaempfer',
      'wrg-platten', 'klappe-brandschutz', 'durchlass-zuluft', 'durchlass-abluft',
      'sensor-temperatur', 'nutzungseinheit', 'aussenluftfassung', 'fortluftausblasung',
    ]
    for (const id of pflicht) expect(symbolImUmfang(id, 'reduziert'), id).toBe(true)
  })

  it('lässt im reduzierten Satz die Sonderbauteile weg', () => {
    const zuviel = ['kuehlturm', 'bhkw', 'laminarfeld', 'textilluftverteiler', 'hydraulische-weiche', 'wrg-regenerator']
    for (const id of zuviel) expect(symbolImUmfang(id, 'reduziert'), id).toBe(false)
  })

  it('deckt im reduzierten Satz die Kernkategorien ab', () => {
    const kern = ['luftbehandlung', 'wrg', 'klappen', 'durchlaesse', 'msr', 'raum']
    const vorhanden = new Set(symboleImUmfang('reduziert').map((s) => s.category))
    for (const k of kern) expect(vorhanden.has(k as never), k).toBe(true)
  })

  it('deckt im mittleren Satz jede Kategorie ab', () => {
    const vorhanden = new Set(symboleImUmfang('mittel').map((s) => s.category))
    for (const c of CATEGORIES) expect(vorhanden.has(c.id), c.id).toBe(true)
  })

  it('beschreibt jede Stufe für die Bedienung', () => {
    expect(UMFAENGE.map((u) => u.id)).toEqual(['reduziert', 'mittel', 'gross'] satisfies Umfang[])
    for (const u of UMFAENGE) {
      expect(u.label.length).toBeGreaterThan(2)
      expect(u.hinweis.length).toBeGreaterThan(20)
    }
  })
})

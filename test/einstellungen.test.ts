import { describe, expect, it } from 'vitest'
import { KACHEL_MAX, KACHEL_MIN, KACHEL_STANDARD, kachelGroesse } from '../src/state/store'

describe('Kachelgröße der Palette', () => {
  it('lässt Werte im zulässigen Bereich unverändert', () => {
    expect(kachelGroesse(KACHEL_MIN)).toBe(KACHEL_MIN)
    expect(kachelGroesse(KACHEL_STANDARD)).toBe(KACHEL_STANDARD)
    expect(kachelGroesse(KACHEL_MAX)).toBe(KACHEL_MAX)
    expect(kachelGroesse(80)).toBe(80)
  })

  it('begrenzt Werte außerhalb des Bereichs', () => {
    expect(kachelGroesse(10)).toBe(KACHEL_MIN)
    expect(kachelGroesse(9999)).toBe(KACHEL_MAX)
    expect(kachelGroesse(-40)).toBe(KACHEL_MIN)
  })

  it('rundet auf ganze Bildpunkte', () => {
    expect(kachelGroesse(63.6)).toBe(64)
    expect(kachelGroesse(63.2)).toBe(63)
  })

  it('fängt fehlende und unsinnige Werte ab', () => {
    // So etwas kann aus einer alten oder beschädigten Einstellung kommen.
    expect(kachelGroesse(undefined)).toBe(KACHEL_STANDARD)
    expect(kachelGroesse(null)).toBe(KACHEL_STANDARD)
    expect(kachelGroesse('gross')).toBe(KACHEL_STANDARD)
    expect(kachelGroesse(Number.NaN)).toBe(KACHEL_STANDARD)
    expect(kachelGroesse(Number.POSITIVE_INFINITY)).toBe(KACHEL_STANDARD)
  })

  it('hält einen sinnvollen Bereich bereit', () => {
    expect(KACHEL_MIN).toBeLessThan(KACHEL_STANDARD)
    expect(KACHEL_STANDARD).toBeLessThan(KACHEL_MAX)
    expect(KACHEL_MAX / KACHEL_MIN).toBeGreaterThan(1.8)
  })
})

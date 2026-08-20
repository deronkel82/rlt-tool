import { SYMBOLS } from './index'
import type { SymbolDef } from './types'

/**
 * Umfang der angezeigten Symbolbibliothek. Die Stufen bauen aufeinander auf:
 * was im reduzierten Satz steckt, ist auch im mittleren und im vollen enthalten.
 * Der Umfang wirkt ausschliesslich auf die Palette — bereits gezeichnete
 * Bauteile bleiben unabhaengig davon erhalten und bearbeitbar.
 */
export type Umfang = 'reduziert' | 'mittel' | 'gross'

export const UMFAENGE: { id: Umfang; label: string; hinweis: string }[] = [
  { id: 'reduziert', label: 'Reduziert', hinweis: 'Die Bauteile eines RLT-Zentralgeräts, Durchlässe, Grundfühler und Räume' },
  { id: 'mittel', label: 'Mittel', hinweis: 'Zusätzlich Bauartvarianten, Kanalformteile, Brandschutz, MSR und Erzeuger' },
  { id: 'gross', label: 'Groß', hinweis: 'Der vollständige Katalog mit allen Sonderbauteilen' },
]

/** Kernbestand: damit lässt sich ein vollständiges Anlagenschema zeichnen. */
const REDUZIERT: readonly string[] = [
  // Luftbehandlung
  'ventilator',
  'filter',
  'erhitzer',
  'kuehler',
  'befeuchter-dampf',
  'tropfenabscheider',
  'schalldaempfer',
  'rlt-geraet',
  // Wärmerückgewinnung
  'wrg-platten',
  'wrg-rotation',
  // Klappen und Brandschutz
  'klappe-absperr',
  'klappe-motor',
  'klappe-brandschutz',
  'vrg-variabel',
  // Kanal
  'wetterschutzgitter',
  // Luftdurchlässe
  'durchlass-zuluft',
  'durchlass-abluft',
  'drallauslass',
  // MSR und Sensorik
  'sensor-temperatur',
  'sensor-feuchte',
  'sensor-differenzdruck',
  'sensor-volumenstrom',
  'frostschutz',
  // Räume und Beschriftung
  'nutzungseinheit',
  'aussenluftfassung',
  'fortluftausblasung',
  'textfeld',
]

/** Was der mittlere Satz zusätzlich zum reduzierten anbietet. */
const MITTEL_ZUSATZ: readonly string[] = [
  // Luftbehandlung
  'ventilator-radial',
  'ventilator-axial',
  'ventilator-dach',
  'filter-tasche',
  'filter-schwebstoff',
  'erhitzer-elektro',
  'kuehler-direkt',
  'befeuchter-spruehe',
  'mischkammer',
  // Wärmerückgewinnung
  'wrg-gegenstrom',
  'wrg-kvs',
  'wrg-bypass',
  // Klappen und Brandschutz
  'klappe-jalousie',
  'klappe-rueckschlag',
  'klappe-entrauchung',
  'klappe-ueberstroem',
  'vrg-konstant',
  // Kanal und Formteile
  'kanal-bogen',
  'kanal-t',
  'kanal-reduzierung',
  'kanal-strecke',
  'kanal-revision',
  'ansaughaube',
  'dachhaube-fortluft',
  'brandschott',
  // Luftdurchlässe
  'gitter-wand',
  'deckenauslass',
  'weitwurfduese',
  'quellauslass',
  'ueberstroemelement',
  'dunstabzugshaube',
  // MSR und Sensorik
  'sensor-temperatur-regler',
  'sensor-druck',
  'sensor-co2',
  'melder-rauch',
  'stellantrieb',
  'regler-ddc',
  'messstelle',
  // Wasser- und Kältekreis
  'pumpe',
  'absperrarmatur',
  'ventil-3wege',
  // Erzeuger
  'kessel',
  'waermepumpe',
  'kaeltemaschine',
  // Räume und Beschriftung
  'lueftungszone',
  'anlagenrahmen',
]

const REDUZIERT_SET = new Set(REDUZIERT)
const MITTEL_SET = new Set([...REDUZIERT, ...MITTEL_ZUSATZ])

export function symbolImUmfang(id: string, umfang: Umfang): boolean {
  if (umfang === 'gross') return true
  if (umfang === 'mittel') return MITTEL_SET.has(id)
  return REDUZIERT_SET.has(id)
}

export function symboleImUmfang(umfang: Umfang): SymbolDef[] {
  return umfang === 'gross' ? SYMBOLS : SYMBOLS.filter((s) => symbolImUmfang(s.id, umfang))
}

export function anzahlImUmfang(umfang: Umfang): number {
  return umfang === 'gross' ? SYMBOLS.length : umfang === 'mittel' ? MITTEL_SET.size : REDUZIERT_SET.size
}

/** Nur für Tests und Wartung: die gepflegten Listen im Rohzustand. */
export const UMFANG_LISTEN = { REDUZIERT, MITTEL_ZUSATZ }

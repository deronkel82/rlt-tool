import type { DrawCtx, ParamDef, PortDef, SymbolDef } from '../types'
import { Glyph, SW, n } from '../draw'
import { bool, num, sel, txt } from '../params'

const R = 15
const SIZE = R * 2 + 6

const sigDown = (label = 'Messstelle'): PortDef[] => [
  { id: 'mp', rx: 0.5, ry: 1, dir: 'bottom', kind: 'signal', label },
]

/**
 * MSR-Kreis nach VDI 3814 / DIN EN ISO 16484-3: Kreis mit waagerechter
 * Trennlinie, oben Funktionskennzeichen, unten Kreisnummer.
 */
function Loop({ c, code }: { c: DrawCtx; code: string }) {
  const cx = c.w / 2
  const cy = R + 3
  const nummer = c.tag.includes('-') ? c.tag.slice(c.tag.indexOf('-') + 1) : c.tag
  return (
    <g>
      <path d={`M${n(cx)} ${n(cy + R)}L${n(cx)} ${n(c.h)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} strokeDasharray="4 3" />
      <circle cx={n(cx)} cy={n(cy)} r={R} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
      <path d={`M${n(cx - R)} ${n(cy)}L${n(cx + R)} ${n(cy)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
      <Glyph c={c} x={cx} y={cy - R * 0.46} size={10}>{code}</Glyph>
      <Glyph c={c} x={cx} y={cy + R * 0.5} size={10} weight={400}>{nummer}</Glyph>
    </g>
  )
}

/** Gemeinsame Felder aller Messstellen. */
const msrParams = (extra: ParamDef[] = []): ParamDef[] => [
  txt('kennzeichen', 'Funktionskennzeichen', { group: 'MSR', hint: 'Erstbuchstabe Messgröße, Folgebuchstaben Funktion (DIN EN 62424)' }),
  sel('signal', 'Signalart', ['0–10 V', '4–20 mA', 'Pt1000', 'Pt100', 'NTC', 'Modbus RTU', 'BACnet MS/TP', 'KNX', 'potentialfrei'], { group: 'MSR' }),
  txt('messbereich', 'Messbereich', { group: 'MSR' }),
  txt('genauigkeit', 'Messgenauigkeit', { group: 'MSR' }),
  sel('einbau', 'Einbauort', ['Kanal', 'Raum', 'Außen', 'Tauchhülse', 'Anlegefühler'], { group: 'Ausführung' }),
  bool('glt', 'Aufschaltung auf die Gebäudeleittechnik', { group: 'MSR', default: true }),
  ...extra,
]

export const msr: SymbolDef[] = [
  {
    id: 'sensor-temperatur',
    label: 'Temperaturfühler',
    category: 'msr',
    tagPrefix: 'TI',
    w: SIZE, h: SIZE + 14,
    norm: 'VDI 3814 / DIN EN 62424 — Messstelle T',
    keywords: ['temperatur', 'fühler', 'ti', 'pt1000'],
    ports: sigDown(),
    params: msrParams([
      num('sollwert', 'Sollwert', '°C', { group: 'Auslegung', step: 0.5, showByDefault: true, short: 'w' }),
      txt('messbereich_t', 'Messbereich', { group: 'MSR', default: '-30 … +70 °C' }),
    ]),
    draw: (c) => <Loop c={c} code="TI" />,
  },
  {
    id: 'sensor-temperatur-regler',
    label: 'Temperaturregelung',
    category: 'msr',
    tagPrefix: 'TIC',
    w: SIZE, h: SIZE + 14,
    norm: 'VDI 3814 — Messen, Anzeigen, Regeln',
    keywords: ['tic', 'regelung', 'temperatur'],
    ports: sigDown('Regelkreis'),
    params: msrParams([
      num('sollwert', 'Sollwert', '°C', { group: 'Auslegung', step: 0.5, showByDefault: true, short: 'w' }),
      sel('regelart', 'Regelart', ['P', 'PI', 'PID'], { group: 'MSR', default: 'PI' }),
      txt('stellgroesse', 'Stellgröße', { group: 'MSR', placeholder: 'Ventil Erhitzer ERH-01' }),
    ]),
    draw: (c) => <Loop c={c} code="TIC" />,
  },
  {
    id: 'sensor-feuchte',
    label: 'Feuchtefühler',
    category: 'msr',
    tagPrefix: 'MI',
    w: SIZE, h: SIZE + 14,
    norm: 'VDI 3814 / DIN EN 62424 — Messstelle M (Feuchte)',
    keywords: ['feuchte', 'rf', 'hygrostat', 'mi'],
    ports: sigDown(),
    params: msrParams([
      num('sollwert', 'Sollwert', '% r. F.', { group: 'Auslegung', step: 1, max: 100, showByDefault: true, short: 'w' }),
      bool('kombi', 'Kombifühler Temperatur und Feuchte', { group: 'Ausführung' }),
    ]),
    draw: (c) => <Loop c={c} code="MI" />,
  },
  {
    id: 'sensor-druck',
    label: 'Druckfühler',
    category: 'msr',
    tagPrefix: 'PI',
    w: SIZE, h: SIZE + 14,
    norm: 'VDI 3814 / DIN EN 62424 — Messstelle P',
    keywords: ['druck', 'kanaldruck', 'pi'],
    ports: sigDown(),
    params: msrParams([num('sollwert', 'Sollwert', 'Pa', { group: 'Auslegung', step: 10, showByDefault: true, short: 'w' })]),
    draw: (c) => <Loop c={c} code="PI" />,
  },
  {
    id: 'sensor-differenzdruck',
    label: 'Differenzdruckwächter',
    category: 'msr',
    tagPrefix: 'PDS',
    w: SIZE, h: SIZE + 14,
    norm: 'VDI 3814 — Messstelle PD mit Schaltfunktion',
    keywords: ['differenzdruck', 'filterüberwachung', 'pds', 'riemenwächter'],
    ports: sigDown('Messstelle Δp'),
    params: msrParams([
      num('schaltpunkt', 'Schaltpunkt', 'Pa', { group: 'Auslegung', step: 10, showByDefault: true, short: 'Δp' }),
      sel('funktion', 'Funktion', ['Filterüberwachung', 'Riemenüberwachung', 'Strömungsüberwachung', 'Raumdrucküberwachung'], { group: 'Auslegung' }),
    ]),
    draw: (c) => <Loop c={c} code="PDS" />,
  },
  {
    id: 'sensor-volumenstrom',
    label: 'Volumenstrommessung',
    category: 'msr',
    tagPrefix: 'FIC',
    w: SIZE, h: SIZE + 14,
    norm: 'VDI 3814 / DIN EN 62424 — Messstelle F',
    keywords: ['volumenstrom', 'durchfluss', 'fic', 'messkreuz'],
    ports: sigDown(),
    params: msrParams([
      num('sollwert', 'Sollwert', 'm³/h', { group: 'Auslegung', step: 10, showByDefault: true, short: 'w' }),
      sel('messprinzip', 'Messprinzip', ['Staudruckmesskreuz', 'Wirkdruck', 'Thermisch', 'Ultraschall'], { group: 'MSR' }),
    ]),
    draw: (c) => <Loop c={c} code="FIC" />,
  },
  {
    id: 'sensor-co2',
    label: 'CO₂-Fühler',
    category: 'msr',
    tagPrefix: 'QI',
    w: SIZE, h: SIZE + 14,
    norm: 'VDI 3814 / DIN EN 62424 — Messstelle Q (Qualität)',
    keywords: ['co2', 'luftqualität', 'bedarfsgeführt', 'qi'],
    ports: sigDown(),
    params: msrParams([
      num('sollwert', 'Sollwert', 'ppm', { group: 'Auslegung', step: 50, default: 800, showByDefault: true, short: 'w' }),
      sel('ida', 'Zielklasse Raumluftqualität', ['IDA 1', 'IDA 2', 'IDA 3', 'IDA 4'], { group: 'Auslegung', hint: 'DIN EN 16798-1' }),
    ]),
    draw: (c) => <Loop c={c} code="QI" />,
  },
  {
    id: 'sensor-voc',
    label: 'Luftqualitätsfühler (VOC)',
    category: 'msr',
    tagPrefix: 'QI',
    w: SIZE, h: SIZE + 14,
    norm: 'VDI 3814 — Messstelle Q',
    keywords: ['voc', 'mischgas', 'luftqualität', 'geruch'],
    ports: sigDown(),
    params: msrParams([num('sollwert', 'Sollwert', '%', { group: 'Auslegung', step: 5, max: 100 })]),
    draw: (c) => <Loop c={c} code="QI" />,
  },
  {
    id: 'frostschutz',
    label: 'Frostschutzwächter',
    category: 'msr',
    tagPrefix: 'TS',
    w: SIZE, h: SIZE + 14,
    norm: 'VDI 3814 — Messstelle T mit Schaltfunktion',
    keywords: ['frostschutz', 'kapillar', 'ts', 'erhitzer'],
    ports: sigDown('Überwachung Erhitzer'),
    params: msrParams([
      num('schaltpunkt', 'Schaltpunkt', '°C', { group: 'Auslegung', step: 0.5, default: 5, showByDefault: true, short: 'ϑ' }),
      sel('bauart', 'Bauart', ['Kapillarrohrfühler', 'Punktfühler'], { group: 'Ausführung', default: 'Kapillarrohrfühler' }),
      num('kapillarlaenge', 'Kapillarlänge', 'm', { group: 'Ausführung', step: 0.5 }),
      bool('stoerung', 'Löst Anlagenstörung aus', { group: 'MSR', default: true }),
    ]),
    draw: (c) => <Loop c={c} code="TS" />,
  },
  {
    id: 'melder-rauch',
    label: 'Rauchmelder Kanal',
    category: 'msr',
    tagPrefix: 'RM',
    w: SIZE, h: SIZE + 14,
    norm: 'DIN 14675 / VDI 3814 — Brandmeldung',
    keywords: ['rauch', 'brandmelder', 'kanal', 'abschaltung'],
    ports: sigDown('Überwachung Kanal'),
    params: msrParams([
      sel('prinzip', 'Messprinzip', ['Streulicht', 'Ansaugrauchmelder', 'Ionisation'], { group: 'MSR', default: 'Streulicht' }),
      bool('abschaltung', 'Löst Anlagenabschaltung aus', { group: 'Brandschutz', default: true }),
      bool('bma', 'Aufschaltung Brandmeldeanlage', { group: 'Brandschutz', default: true }),
    ]),
    draw: (c) => <Loop c={c} code="RM" />,
  },
  {
    id: 'regler-ddc',
    label: 'Automationsstation (DDC)',
    category: 'msr',
    tagPrefix: 'AS',
    w: 64, h: 48,
    norm: 'VDI 3814 / DIN EN ISO 16484 — Automationsebene',
    keywords: ['ddc', 'regler', 'automationsstation', 'glt', 'gebäudeautomation'],
    ports: [
      { id: 'a', rx: 0, ry: 0.5, dir: 'left', kind: 'signal', label: 'Feldebene' },
      { id: 'b', rx: 1, ry: 0.5, dir: 'right', kind: 'signal', label: 'Managementebene' },
    ],
    params: [
      txt('hersteller', 'Systemhersteller', { group: 'Ausführung' }),
      sel('protokoll', 'Kommunikationsprotokoll', ['BACnet/IP', 'BACnet MS/TP', 'Modbus TCP', 'Modbus RTU', 'KNX', 'LON'], { group: 'MSR', default: 'BACnet/IP' }),
      num('ai', 'Analoge Eingänge', 'Stk', { group: 'Datenpunkte', step: 1 }),
      num('ao', 'Analoge Ausgänge', 'Stk', { group: 'Datenpunkte', step: 1 }),
      num('di', 'Digitale Eingänge', 'Stk', { group: 'Datenpunkte', step: 1 }),
      num('do', 'Digitale Ausgänge', 'Stk', { group: 'Datenpunkte', step: 1 }),
      bool('webbedienung', 'Webbedienung', { group: 'Ausführung', default: true }),
    ],
    draw: (c) => (
      <g>
        <rect x={0} y={0} width={c.w} height={c.h} rx={3} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M0 ${n(c.h * 0.32)}L${n(c.w)} ${n(c.h * 0.32)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <Glyph c={c} x={c.w / 2} y={c.h * 0.17} size={10}>DDC</Glyph>
        <Glyph c={c} x={c.w / 2} y={c.h * 0.66} size={10} weight={400}>{c.tag}</Glyph>
      </g>
    ),
  },
  {
    id: 'frequenzumrichter',
    label: 'Frequenzumrichter',
    category: 'msr',
    tagPrefix: 'FU',
    w: 44, h: 40,
    norm: 'VDI 3814 — Leistungsstellglied',
    keywords: ['fu', 'frequenzumrichter', 'drehzahl', 'vfd'],
    ports: [
      { id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'signal', label: 'Steuersignal' },
      { id: 'out', rx: 1, ry: 0.5, dir: 'right', kind: 'signal', label: 'Motor' },
    ],
    params: [
      num('leistung', 'Bemessungsleistung', 'kW', { group: 'Elektro', step: 0.1, showByDefault: true, short: 'P' }),
      num('spannung', 'Spannung', 'V', { group: 'Elektro', default: 400 }),
      num('strom', 'Bemessungsstrom', 'A', { group: 'Elektro', step: 0.1 }),
      sel('signal', 'Sollwertsignal', ['0–10 V', '4–20 mA', 'Modbus RTU', 'BACnet MS/TP'], { group: 'MSR', default: '0–10 V' }),
      bool('filter', 'Netzfilter / Motordrossel', { group: 'Elektro' }),
      bool('bypass', 'Handbetrieb / Bypass', { group: 'Elektro' }),
    ],
    draw: (c) => (
      <g>
        <rect x={0} y={0} width={c.w} height={c.h} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M6 ${n(c.h * 0.66)}L${n(c.w * 0.42)} ${n(c.h * 0.66)}L${n(c.w * 0.42)} ${n(c.h * 0.34)}L${n(c.w - 6)} ${n(c.h * 0.34)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M${n(c.w * 0.16)} ${n(c.h * 0.28)}q4 -7 8 0t8 0`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
      </g>
    ),
  },
  {
    id: 'stellantrieb',
    label: 'Stellantrieb',
    category: 'msr',
    tagPrefix: 'ST',
    w: 32, h: 32,
    norm: 'VDI 3814 / DIN EN ISO 10628 — Antrieb',
    keywords: ['antrieb', 'motor', 'stellglied', 'servo'],
    ports: [{ id: 'sig', rx: 0.5, ry: 1, dir: 'bottom', kind: 'signal', label: 'Stellglied' }],
    params: [
      sel('art', 'Antriebsart', ['elektrisch', 'elektrothermisch', 'pneumatisch'], { group: 'Ausführung', default: 'elektrisch' }),
      sel('signal', 'Ansteuerung', ['Auf/Zu', '3-Punkt', 'stetig 0–10 V', 'stetig 4–20 mA', 'Bus'], { group: 'MSR', default: 'stetig 0–10 V' }),
      num('drehmoment', 'Drehmoment', 'Nm', { group: 'Ausführung', step: 1 }),
      num('laufzeit', 'Stellzeit', 's', { group: 'MSR', step: 5 }),
      bool('federruecklauf', 'Federrücklauf', { group: 'MSR' }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h / 2 - 3
      return (
        <g>
          <path d={`M${n(cx)} ${n(cy + 10)}L${n(cx)} ${n(c.h)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} strokeDasharray="3 2" />
          <circle cx={n(cx)} cy={n(cy)} r={10} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <Glyph c={c} x={cx} y={cy} size={11}>M</Glyph>
        </g>
      )
    },
  },
  {
    id: 'schaltschrank',
    label: 'Schaltschrank',
    category: 'msr',
    tagPrefix: 'SSK',
    w: 56, h: 64,
    norm: 'DIN EN 61439 — Schaltgerätekombination',
    keywords: ['schaltschrank', 'msr', 'verteilung', 'elektro'],
    ports: [{ id: 'sig', rx: 1, ry: 0.5, dir: 'right', kind: 'signal', label: 'Feldebene' }],
    params: [
      txt('standort', 'Aufstellungsort', { group: 'Ausführung' }),
      sel('schutzart', 'Schutzart', ['IP 20', 'IP 44', 'IP 54', 'IP 55', 'IP 65'], { group: 'Elektro', default: 'IP 54' }),
      num('anschlussleistung', 'Anschlussleistung', 'kW', { group: 'Elektro', step: 0.5 }),
      num('vorsicherung', 'Vorsicherung', 'A', { group: 'Elektro', step: 1 }),
      bool('nothalt', 'Not-Halt vorhanden', { group: 'Elektro', default: true }),
      bool('bedienteil', 'Bedien- und Anzeigeeinheit', { group: 'Ausführung', default: true }),
    ],
    draw: (c) => (
      <g>
        <rect x={0} y={0} width={c.w} height={c.h} rx={2} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M0 ${n(c.h * 0.22)}L${n(c.w)} ${n(c.h * 0.22)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M${n(c.w * 0.5)} ${n(c.h * 0.22)}L${n(c.w * 0.5)} ${n(c.h)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} strokeDasharray="4 3" />
        <Glyph c={c} x={c.w / 2} y={c.h * 0.11} size={10}>SSK</Glyph>
      </g>
    ),
  },
  {
    id: 'glt-aufschaltung',
    label: 'Gebäudeleittechnik',
    category: 'msr',
    tagPrefix: 'GLT',
    w: 64, h: 40,
    norm: 'VDI 3814 — Managementebene',
    keywords: ['glt', 'leittechnik', 'management', 'visualisierung'],
    ports: [{ id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'signal', label: 'Automationsebene' }],
    params: [
      sel('protokoll', 'Protokoll', ['BACnet/IP', 'Modbus TCP', 'OPC UA', 'MQTT'], { group: 'MSR', default: 'BACnet/IP' }),
      num('datenpunkte', 'Datenpunkte', 'Stk', { group: 'Datenpunkte', step: 10 }),
      bool('fernzugriff', 'Fernzugriff', { group: 'Ausführung' }),
      bool('trend', 'Trendaufzeichnung', { group: 'Ausführung', default: true }),
      bool('alarm', 'Störmeldeweiterleitung', { group: 'Ausführung', default: true }),
    ],
    draw: (c) => (
      <g>
        <rect x={0} y={0} width={c.w} height={n(c.h - 8)} rx={3} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M${n(c.w * 0.3)} ${n(c.h - 8)}L${n(c.w * 0.7)} ${n(c.h - 8)}L${n(c.w * 0.76)} ${n(c.h)}L${n(c.w * 0.24)} ${n(c.h)}Z`} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.inner} />
        <Glyph c={c} x={c.w / 2} y={(c.h - 8) / 2} size={11}>GLT</Glyph>
      </g>
    ),
  },
  {
    id: 'messstelle',
    label: 'Messstutzen',
    category: 'msr',
    tagPrefix: 'MST',
    w: 28, h: 34,
    norm: 'DIN EN 12599 — Messöffnung zur Abnahmemessung',
    keywords: ['messstutzen', 'abnahme', 'einregulierung', 'messöffnung'],
    ports: [{ id: 'mp', rx: 0.5, ry: 1, dir: 'bottom', kind: 'signal', label: 'Messstelle' }],
    params: [
      sel('messgroesse', 'Messgröße', ['Volumenstrom', 'Temperatur', 'Druck', 'Feuchte'], { group: 'MSR', default: 'Volumenstrom' }),
      txt('verfahren', 'Messverfahren', { group: 'MSR', placeholder: 'Netzmessung nach DIN EN 12599' }),
      bool('dauerhaft', 'Dauerhaft zugänglich', { group: 'Wartung', default: true }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      return (
        <g>
          <path d={`M${n(cx)} ${n(c.h)}L${n(cx)} 12`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} strokeDasharray="3 2" />
          <path d={`M${n(cx - 7)} 12L${n(cx + 7)} 12L${n(cx + 7)} 3L${n(cx - 7)} 3Z`} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.inner} />
          <path d={`M${n(cx - 4)} 7.5L${n(cx + 4)} 7.5`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        </g>
      )
    },
  },
]

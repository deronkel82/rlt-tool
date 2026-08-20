import type { DrawCtx, SymbolDef } from '../types'
import { Actuator, Glyph, SW, hatch, n } from '../draw'
import { airInOut } from '../ports'
import { FEUERWIDERSTAND, bool, num, pAbmessung, pDruckverlust, pVolumenstrom, sel, txt } from '../params'

const BAND = 44

/** Kanalband: bei hohen Symbolen (mit Stellantrieb) bleibt der Kanal mittig. */
function band(c: DrawCtx) {
  const y0 = c.h / 2 - BAND / 2
  return { y0, y1: y0 + BAND, cy: c.h / 2 }
}

function Duct({ c, bold = false }: { c: DrawCtx; bold?: boolean }) {
  const b = band(c)
  return <rect x={0} y={n(b.y0)} width={c.w} height={BAND} fill={c.t.fill} stroke={c.t.line} strokeWidth={bold ? SW.bold : SW.outline} />
}

/** Klappenblatt als Schraeglinie mit Drehpunkt. */
function Blade({ c, x, deg = 40, len = BAND * 0.86 }: { c: DrawCtx; x: number; deg?: number; len?: number }) {
  const b = band(c)
  const rad = (deg * Math.PI) / 180
  const dx = (Math.cos(rad) * len) / 2
  const dy = (Math.sin(rad) * len) / 2
  return (
    <g>
      <path d={`M${n(x - dx)} ${n(b.cy - dy)}L${n(x + dx)} ${n(b.cy + dy)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} strokeLinecap="round" />
      <circle cx={n(x)} cy={n(b.cy)} r={2} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.hair} />
    </g>
  )
}

const klappenParams = () => [
  pVolumenstrom({ showByDefault: false }),
  pAbmessung({ placeholder: '600 × 400 mm' }),
  sel('leckluftklasse', 'Leckluftklasse Klappenblatt', ['Klasse 0', 'Klasse 1', 'Klasse 2', 'Klasse 3', 'Klasse 4'], { group: 'Ausführung', hint: 'DIN EN 1751' }),
  sel('gehaeuseklasse', 'Leckluftklasse Gehäuse', ['Klasse A', 'Klasse B', 'Klasse C'], { group: 'Ausführung', hint: 'DIN EN 1751' }),
  sel('material', 'Werkstoff', ['verzinkter Stahl', 'Aluminium', 'Edelstahl', 'Kunststoff'], { group: 'Ausführung' }),
  pDruckverlust(),
]

const antriebParams = () => [
  sel('antrieb', 'Stellantrieb', ['Auf/Zu 230 V', 'Auf/Zu 24 V', 'stetig 0–10 V', 'stetig 4–20 mA', 'Modbus', 'Handverstellung'], { group: 'MSR', default: 'stetig 0–10 V' }),
  bool('federruecklauf', 'Federrücklauf (Sicherheitsstellung)', { group: 'MSR' }),
  num('laufzeit', 'Stellzeit', 's', { group: 'MSR', step: 5 }),
  bool('rueckmeldung', 'Endlagenrückmeldung', { group: 'MSR', default: true }),
]

export const klappen: SymbolDef[] = [
  {
    id: 'klappe-absperr',
    label: 'Absperrklappe',
    category: 'klappen',
    tagPrefix: 'KL',
    w: 40, h: BAND,
    norm: 'DIN EN 12792 — Kanalabschnitt mit Klappenblatt',
    keywords: ['drossel', 'absperr', 'handklappe'],
    ports: airInOut(),
    params: [...klappenParams(), sel('betaetigung', 'Betätigung', ['Handhebel', 'Handrad', 'Stellantrieb'], { group: 'MSR', default: 'Handhebel' })],
    draw: (c) => (
      <g>
        <Duct c={c} />
        <Blade c={c} x={c.w / 2} />
      </g>
    ),
  },
  {
    id: 'klappe-jalousie',
    label: 'Jalousieklappe',
    category: 'klappen',
    tagPrefix: 'KL',
    w: 48, h: BAND,
    norm: 'DIN EN 12792 — mehrblättrige Klappe',
    keywords: ['jalousie', 'lamellen', 'mehrblättrig'],
    ports: airInOut(),
    params: [
      ...klappenParams(),
      sel('lamellen', 'Lamellenlauf', ['gegenläufig', 'gleichläufig'], { group: 'Ausführung', default: 'gegenläufig' }),
      num('lamellenzahl', 'Anzahl Lamellen', 'Stk', { group: 'Ausführung', step: 1 }),
      sel('betaetigung', 'Betätigung', ['Handhebel', 'Stellantrieb'], { group: 'MSR' }),
    ],
    draw: (c) => {
      const b = band(c)
      const rows = 3
      const gap = BAND / rows
      const items = []
      for (let i = 0; i < rows; i++) {
        const cy = b.y0 + gap * (i + 0.5)
        items.push(
          <path key={i} d={`M${n(c.w * 0.28)} ${n(cy + gap * 0.34)}L${n(c.w * 0.72)} ${n(cy - gap * 0.34)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} strokeLinecap="round" />,
        )
      }
      return <g><Duct c={c} />{items}</g>
    },
  },
  {
    id: 'klappe-motor',
    label: 'Klappe mit Stellantrieb',
    category: 'klappen',
    tagPrefix: 'KL',
    w: 48, h: 72,
    norm: 'DIN EN 12792 / VDI 3814 — Klappe mit Antrieb',
    keywords: ['motorklappe', 'stellantrieb', 'regelklappe'],
    ports: airInOut(),
    params: [...klappenParams(), ...antriebParams()],
    draw: (c) => {
      const b = band(c)
      return (
        <g>
          <Duct c={c} />
          <Blade c={c} x={c.w / 2} />
          <path d={`M${n(c.w / 2)} ${n(b.y0)}L${n(c.w / 2)} 14`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <Actuator c={c} x={c.w / 2} y={8} letter="M" />
        </g>
      )
    },
  },
  {
    id: 'klappe-verschluss',
    label: 'Dichtschließende Verschlussklappe',
    category: 'klappen',
    tagPrefix: 'KL',
    w: 48, h: 72,
    norm: 'DIN EN 1751 — Leckluftklasse 3/4',
    keywords: ['verschluss', 'dicht', 'absperr'],
    ports: airInOut(),
    params: [
      ...klappenParams(),
      ...antriebParams(),
      bool('dichtung', 'Umlaufende Lippendichtung', { group: 'Ausführung', default: true }),
    ],
    draw: (c) => {
      const b = band(c)
      return (
        <g>
          <Duct c={c} bold />
          <Blade c={c} x={c.w / 2} deg={88} />
          <path d={`M${n(c.w / 2)} ${n(b.y0)}L${n(c.w / 2)} 14`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <Actuator c={c} x={c.w / 2} y={8} letter="M" />
        </g>
      )
    },
  },
  {
    id: 'klappe-rueckschlag',
    label: 'Rückschlagklappe',
    category: 'klappen',
    tagPrefix: 'RSK',
    w: 44, h: BAND,
    norm: 'DIN EN 12792 — Klappe mit Anschlag',
    keywords: ['rückschlag', 'rückstau', 'einseitig'],
    ports: airInOut(),
    params: [
      ...klappenParams(),
      num('oeffnungsdruck', 'Öffnungsdruck', 'Pa', { group: 'Auslegung', step: 5 }),
      sel('bauart', 'Bauart', ['Klappe mit Gegengewicht', 'Federbelastet', 'Lamellenrückschlagklappe'], { group: 'Ausführung' }),
    ],
    draw: (c) => {
      const b = band(c)
      return (
        <g>
          <Duct c={c} />
          <path d={`M${n(c.w * 0.34)} ${n(b.y0 + 3)}L${n(c.w * 0.7)} ${n(b.y1 - 6)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} strokeLinecap="round" />
          <circle cx={n(c.w * 0.34)} cy={n(b.y0 + 3)} r={2} fill={c.t.line} stroke="none" />
          <path d={`M${n(c.w * 0.34)} ${n(b.y1 - 3)}L${n(c.w * 0.62)} ${n(b.y1 - 3)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} strokeLinecap="round" />
        </g>
      )
    },
  },
  {
    id: 'klappe-brandschutz',
    label: 'Brandschutzklappe',
    category: 'klappen',
    tagPrefix: 'BSK',
    w: 56, h: 56,
    norm: 'DIN EN 15650 — Brandschutzklappe im Kanal',
    keywords: ['bsk', 'brand', 'ei90', 'schott'],
    ports: airInOut(),
    params: [
      sel('feuerwiderstand', 'Feuerwiderstandsklasse', FEUERWIDERSTAND, { group: 'Brandschutz', default: 'EI 90-S', showByDefault: true, short: 'FW', hint: 'Vollständige Klassifizierung nach DIN EN 13501-3, z. B. EI 90 (ve, ho, i<->o) S' }),
      pAbmessung({ placeholder: '400 × 300 mm' }),
      pVolumenstrom({ showByDefault: false }),
      sel('ausloesung', 'Auslösung', ['Schmelzlot 72 °C', 'Schmelzlot 95 °C', 'Rauchauslösung', 'Schmelzlot und Rauchauslösung'], { group: 'Brandschutz', default: 'Schmelzlot 72 °C' }),
      sel('antrieb', 'Antrieb', ['Federrücklauf 24 V', 'Federrücklauf 230 V', 'ohne Antrieb (Federkraft)'], { group: 'MSR', default: 'Federrücklauf 24 V' }),
      bool('rueckmeldung', 'Endlagenschalter AUF/ZU', { group: 'MSR', default: true }),
      bool('bma', 'Aufschaltung Brandmeldeanlage', { group: 'Brandschutz' }),
      txt('einbau', 'Einbausituation', { group: 'Brandschutz', placeholder: 'Wand massiv, Trockenbau, Decke' }),
      txt('revision', 'Revisionsöffnung', { group: 'Wartung', placeholder: 'bauseits, 300 × 300 mm' }),
    ],
    draw: (c) => {
      const b = band(c)
      const wallW = 7
      return (
        <g>
          <Duct c={c} bold />
          <rect x={0} y={n(b.y0)} width={wallW} height={BAND} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <rect x={n(c.w - wallW)} y={n(b.y0)} width={wallW} height={BAND} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <path d={hatch(0, b.y0, wallW, BAND, 5, 60) + hatch(c.w - wallW, b.y0, wallW, BAND, 5, 60)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <Blade c={c} x={c.w / 2} deg={40} len={BAND * 0.8} />
          <path d={`M${n(c.w / 2)} ${n(b.y0)}L${n(c.w / 2)} 9`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <rect x={n(c.w / 2 - 5)} y={2} width={10} height={8} fill={c.t.line} stroke="none" />
        </g>
      )
    },
  },
  {
    id: 'klappe-entrauchung',
    label: 'Entrauchungsklappe',
    category: 'klappen',
    tagPrefix: 'ERK',
    w: 56, h: 56,
    norm: 'DIN EN 12101-8 — Entrauchungsklappe',
    keywords: ['erk', 'entrauchung', 'rwa', 'rauchschutz'],
    ports: airInOut(),
    params: [
      sel('klassifizierung', 'Klassifizierung', ['E 30-S', 'E 60-S', 'E 90-S', 'E 120-S'], { group: 'Brandschutz', default: 'E 90-S', showByDefault: true, short: 'Kl.', hint: 'Klassifizierung nach DIN EN 13501-4' }),
      sel('typ', 'Typ', ['Einzelentrauchung (Typ E)', 'Mehrbrandabschnitt (Typ M)'], { group: 'Brandschutz', default: 'Mehrbrandabschnitt (Typ M)' }),
      pAbmessung(),
      pVolumenstrom({ showByDefault: false }),
      sel('antrieb', 'Antrieb', ['Federrücklauf 24 V', 'Federrücklauf 230 V', 'ohne Federrücklauf'], { group: 'MSR' }),
      bool('rueckmeldung', 'Endlagenschalter AUF/ZU', { group: 'MSR', default: true }),
      bool('bma', 'Ansteuerung über RWA/BMA', { group: 'Brandschutz', default: true }),
    ],
    draw: (c) => {
      const b = band(c)
      const wallW = 7
      return (
        <g>
          <Duct c={c} bold />
          <rect x={0} y={n(b.y0)} width={wallW} height={BAND} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <rect x={n(c.w - wallW)} y={n(b.y0)} width={wallW} height={BAND} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <path d={hatch(0, b.y0, wallW, BAND, 5, 60) + hatch(c.w - wallW, b.y0, wallW, BAND, 5, 60)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <Blade c={c} x={c.w / 2} deg={8} len={BAND * 0.8} />
          <path d={`M${n(c.w / 2)} ${n(b.y0)}L${n(c.w / 2)} 12`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <rect x={n(c.w / 2 - 7)} y={1} width={14} height={11} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.hair} />
          <Glyph c={c} x={c.w / 2} y={6.5} size={9}>E</Glyph>
        </g>
      )
    },
  },
  {
    id: 'klappe-ueberstroem',
    label: 'Überströmklappe',
    category: 'klappen',
    tagPrefix: 'UEK',
    w: 48, h: BAND,
    norm: 'DIN EN 12792 — druckabhängige Überströmung',
    keywords: ['überström', 'druckentlastung', 'gewicht'],
    ports: airInOut(),
    params: [
      ...klappenParams(),
      num('ansprechdruck', 'Ansprechdruck', 'Pa', { group: 'Auslegung', step: 5, showByDefault: true, short: 'Δp' }),
      sel('bauart', 'Bauart', ['Gewichtsbelastet', 'Federbelastet', 'Überströmgitter'], { group: 'Ausführung' }),
    ],
    draw: (c) => {
      const b = band(c)
      return (
        <g>
          <Duct c={c} />
          <path d={`M${n(c.w * 0.3)} ${n(b.y0 + 4)}L${n(c.w * 0.68)} ${n(b.y1 - 8)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} strokeLinecap="round" />
          <circle cx={n(c.w * 0.3)} cy={n(b.y0 + 4)} r={2} fill={c.t.line} stroke="none" />
          <circle cx={n(c.w * 0.71)} cy={n(b.y1 - 7)} r={3} fill={c.t.line} stroke="none" />
        </g>
      )
    },
  },
  {
    id: 'vrg-konstant',
    label: 'Konstant-Volumenstromregler',
    category: 'klappen',
    tagPrefix: 'CAV',
    w: 64, h: BAND,
    norm: 'DIN EN 12792 — mechanischer Volumenstromregler',
    keywords: ['cav', 'konstant', 'volumenstromregler', 'mechanisch'],
    ports: airInOut(),
    params: [
      pVolumenstrom({ label: 'Eingestellter Volumenstrom', showByDefault: true }),
      pAbmessung({ placeholder: 'Ø 160 mm' }),
      num('dp_min', 'Mindestdifferenzdruck', 'Pa', { group: 'Auslegung', step: 5, default: 50 }),
      num('dp_max', 'Maximaldifferenzdruck', 'Pa', { group: 'Auslegung', step: 10 }),
      num('genauigkeit', 'Regelgenauigkeit', '%', { group: 'Auslegung', step: 1, default: 10 }),
      bool('schalldaempfer', 'Schalldämpfer integriert', { group: 'Schall' }),
    ],
    draw: (c) => {
      const b = band(c)
      return (
        <g>
          <Duct c={c} />
          <Blade c={c} x={c.w * 0.42} deg={55} len={BAND * 0.74} />
          <path d={`M${n(c.w * 0.42)} ${n(b.cy)}L${n(c.w * 0.74)} ${n(b.cy)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <path d={`M${n(c.w * 0.74)} ${n(b.cy - 7)}L${n(c.w * 0.74)} ${n(b.cy + 7)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <Glyph c={c} x={c.w * 0.84} y={b.cy} size={10}>K</Glyph>
        </g>
      )
    },
  },
  {
    id: 'vrg-variabel',
    label: 'Variabel-Volumenstromregler',
    category: 'klappen',
    tagPrefix: 'VAV',
    w: 64, h: 72,
    norm: 'DIN EN 12792 / VDI 3814 — geregelter Volumenstromregler',
    keywords: ['vav', 'variabel', 'volumenstromregler', 'geregelt'],
    ports: airInOut(),
    params: [
      num('v_min', 'Volumenstrom minimal', 'm³/h', { group: 'Auslegung', step: 10, showByDefault: true, short: 'V̇min' }),
      num('v_max', 'Volumenstrom maximal', 'm³/h', { group: 'Auslegung', step: 10, showByDefault: true, short: 'V̇max' }),
      pAbmessung({ placeholder: 'Ø 200 mm' }),
      sel('fuehrung', 'Führungsgröße', ['Raumtemperatur', 'CO₂-Konzentration', 'Präsenz', 'Differenzdruck', 'Zentrale Vorgabe'], { group: 'MSR', default: 'Raumtemperatur' }),
      sel('signal', 'Stellsignal', ['0–10 V', '4–20 mA', 'Modbus RTU', 'BACnet MS/TP', 'KNX'], { group: 'MSR', default: '0–10 V' }),
      num('dp_min', 'Mindestdifferenzdruck', 'Pa', { group: 'Auslegung', step: 5, default: 50 }),
      bool('schalldaempfer', 'Schalldämpfer integriert', { group: 'Schall', default: true }),
      bool('istwert', 'Istwertrückmeldung', { group: 'MSR', default: true }),
    ],
    draw: (c) => {
      const b = band(c)
      return (
        <g>
          <Duct c={c} />
          <Blade c={c} x={c.w * 0.42} deg={55} len={BAND * 0.74} />
          <path d={`M${n(c.w * 0.42)} ${n(b.y0)}L${n(c.w * 0.42)} 14`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <Actuator c={c} x={c.w * 0.42} y={8} letter="M" />
          <path d={`M${n(c.w * 0.72)} ${n(b.y0)}L${n(c.w * 0.72)} ${n(b.y1)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} strokeDasharray="3 2" />
          <Glyph c={c} x={c.w * 0.85} y={b.cy} size={10}>V̇</Glyph>
        </g>
      )
    },
  },
  {
    id: 'drossel',
    label: 'Drosselelement',
    category: 'klappen',
    tagPrefix: 'DR',
    w: 40, h: BAND,
    norm: 'DIN EN ISO 10628 — Drosselstelle',
    keywords: ['drossel', 'blende', 'widerstand'],
    ports: airInOut(),
    params: [
      pDruckverlust({ showByDefault: true, short: 'Δp' }),
      pVolumenstrom({ showByDefault: false }),
      sel('bauart', 'Bauart', ['Lochblende', 'Drosselklappe fest', 'Perforiertes Blech'], { group: 'Ausführung' }),
    ],
    draw: (c) => {
      const b = band(c)
      const x = c.w / 2
      return (
        <g>
          <Duct c={c} />
          <path d={`M${n(x)} ${n(b.y0)}L${n(x)} ${n(b.cy - 5)}M${n(x)} ${n(b.cy + 5)}L${n(x)} ${n(b.y1)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} />
        </g>
      )
    },
  },
  {
    id: 'irisblende',
    label: 'Irisblende',
    category: 'klappen',
    tagPrefix: 'IB',
    w: 44, h: BAND,
    norm: 'DIN EN 12792 — einstellbare Drosselstelle mit Messstutzen',
    keywords: ['iris', 'einregulierung', 'messung', 'abgleich'],
    ports: airInOut(),
    params: [
      pVolumenstrom({ label: 'Eingestellter Volumenstrom', showByDefault: true }),
      pAbmessung({ placeholder: 'Ø 160 mm' }),
      num('stellung', 'Blendenstellung', '—', { group: 'Ausführung', step: 1 }),
      pDruckverlust(),
      bool('messstutzen', 'Messstutzen vorhanden', { group: 'MSR', default: true }),
    ],
    draw: (c) => {
      const b = band(c)
      const x = c.w / 2
      return (
        <g>
          <Duct c={c} />
          <circle cx={n(x)} cy={n(b.cy)} r={12} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <circle cx={n(x)} cy={n(b.cy)} r={5} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <path d={`M${n(x - 12)} ${n(b.cy)}L${n(x - 5)} ${n(b.cy)}M${n(x + 5)} ${n(b.cy)}L${n(x + 12)} ${n(b.cy)}M${n(x)} ${n(b.cy - 12)}L${n(x)} ${n(b.cy - 5)}M${n(x)} ${n(b.cy + 5)}L${n(x)} ${n(b.cy + 12)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        </g>
      )
    },
  },
]

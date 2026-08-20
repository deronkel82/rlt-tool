import type { DrawCtx, PortDef, SymbolDef } from '../types'
import { Actuator, Glyph, SW, coil, hatch, n } from '../draw'
import { fluidInOut } from '../ports'
import { bool, num, sel, txt } from '../params'

const VW = 40
const VH = 34

const fluidPort = (): PortDef[] => fluidInOut()

/** Doppeldreieck als Armaturensymbol nach DIN EN ISO 10628. */
function Bowtie({ c, cy, half = 11, filled = false }: { c: DrawCtx; cy: number; half?: number; filled?: boolean }) {
  const cx = c.w / 2
  const x0 = cx - 13
  const x1 = cx + 13
  const d = `M${n(x0)} ${n(cy - half)}L${n(x0)} ${n(cy + half)}L${n(cx)} ${n(cy)}ZM${n(x1)} ${n(cy - half)}L${n(x1)} ${n(cy + half)}L${n(cx)} ${n(cy)}Z`
  return (
    <g>
      <path d={`M0 ${n(cy)}L${n(x0)} ${n(cy)}M${n(x1)} ${n(cy)}L${n(c.w)} ${n(cy)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
      <path d={d} fill={filled ? c.t.line : c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} strokeLinejoin="round" />
    </g>
  )
}

const medienParams = () => [
  sel('medium', 'Medium', ['Heizwasser', 'Kaltwasser', 'Sole', 'Kältemittel', 'Dampf', 'Kondensat', 'Trinkwasser'], { group: 'Medium', default: 'Heizwasser' }),
  txt('nennweite', 'Nennweite', { group: 'Ausführung', placeholder: 'DN 50' }),
  sel('druckstufe', 'Druckstufe', ['PN 6', 'PN 10', 'PN 16', 'PN 25', 'PN 40'], { group: 'Ausführung', default: 'PN 16' }),
  num('v_medium', 'Volumenstrom', 'm³/h', { group: 'Auslegung', step: 0.1 }),
  num('dp', 'Druckverlust', 'kPa', { group: 'Auslegung', step: 1 }),
]

export const hydraulik: SymbolDef[] = [
  {
    id: 'pumpe',
    label: 'Umwälzpumpe',
    category: 'hydraulik',
    tagPrefix: 'PU',
    w: 40, h: 40,
    norm: 'DIN EN ISO 10628 — Kreis mit ausgefülltem Förderrichtungsdreieck',
    keywords: ['pumpe', 'umwälz', 'heizung', 'hocheffizienz'],
    ports: fluidPort(),
    params: [
      ...medienParams(),
      num('foerderhoehe', 'Förderhöhe', 'm', { group: 'Auslegung', step: 0.1, showByDefault: true, short: 'H' }),
      num('leistung', 'Leistungsaufnahme', 'W', { group: 'Elektro', step: 5 }),
      sel('regelung', 'Regelung', ['ungeregelt', 'Konstantdruck', 'Proportionaldruck', 'Konstantdrehzahl', 'Temperaturgeführt'], { group: 'MSR', default: 'Proportionaldruck' }),
      num('eei', 'Energieeffizienzindex', '—', { group: 'Energie', step: 0.01, hint: 'VO (EG) 641/2009, Grenzwert 0,23' }),
      bool('doppelpumpe', 'Doppelpumpe / Redundanz', { group: 'Ausführung' }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h / 2
      const r = 13
      return (
        <g>
          <path d={`M0 ${n(cy)}L${n(cx - r)} ${n(cy)}M${n(cx + r)} ${n(cy)}L${n(c.w)} ${n(cy)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <circle cx={n(cx)} cy={n(cy)} r={r} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={`M${n(cx - r * 0.5)} ${n(cy - r * 0.72)}L${n(cx - r * 0.5)} ${n(cy + r * 0.72)}L${n(cx + r * 0.86)} ${n(cy)}Z`} fill={c.t.line} stroke="none" />
        </g>
      )
    },
  },
  {
    id: 'absperrarmatur',
    label: 'Absperrarmatur',
    category: 'hydraulik',
    tagPrefix: 'AB',
    w: VW, h: VH,
    norm: 'DIN EN ISO 10628 — Absperrventil',
    keywords: ['absperr', 'kugelhahn', 'ventil', 'schieber'],
    ports: fluidPort(),
    params: [
      ...medienParams(),
      sel('bauart', 'Bauart', ['Kugelhahn', 'Absperrklappe', 'Schieber', 'Absperrventil'], { group: 'Ausführung', default: 'Kugelhahn' }),
      bool('entleerung', 'Mit Entleerung', { group: 'Ausführung' }),
    ],
    draw: (c) => {
      const cy = c.h / 2 + 3
      return (
        <g>
          <Bowtie c={c} cy={cy} />
          <path d={`M${n(c.w / 2)} ${n(cy)}L${n(c.w / 2)} 4M${n(c.w / 2 - 7)} 4L${n(c.w / 2 + 7)} 4`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        </g>
      )
    },
  },
  {
    id: 'ventil-2wege',
    label: 'Zweiwege-Regelventil',
    category: 'hydraulik',
    tagPrefix: 'RV',
    w: VW, h: 52,
    norm: 'DIN EN ISO 10628 / VDI 3814 — Regelventil mit Antrieb',
    keywords: ['regelventil', '2-wege', 'drossel', 'kvs'],
    ports: fluidPort(),
    params: [
      ...medienParams(),
      num('kvs', 'kvs-Wert', 'm³/h', { group: 'Auslegung', step: 0.1, showByDefault: true, short: 'kvs' }),
      sel('kennlinie', 'Kennlinie', ['gleichprozentig', 'linear', 'quadratisch'], { group: 'Auslegung', default: 'gleichprozentig' }),
      num('ventilautoritaet', 'Ventilautorität', '—', { group: 'Auslegung', step: 0.05 }),
      sel('signal', 'Ansteuerung', ['stetig 0–10 V', 'stetig 4–20 mA', '3-Punkt', 'Auf/Zu', 'Bus'], { group: 'MSR', default: 'stetig 0–10 V' }),
      bool('federruecklauf', 'Federrücklauf', { group: 'MSR' }),
    ],
    draw: (c) => {
      const cy = c.h - 15
      return (
        <g>
          <Bowtie c={c} cy={cy} />
          <path d={`M${n(c.w / 2)} ${n(cy)}L${n(c.w / 2)} 16`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <Actuator c={c} x={c.w / 2} y={9} letter="M" />
        </g>
      )
    },
  },
  {
    id: 'ventil-3wege',
    label: 'Dreiwegeventil',
    category: 'hydraulik',
    tagPrefix: 'MV',
    w: 48, h: 56,
    norm: 'DIN EN ISO 10628 — Dreiwegemisch-/Verteilventil',
    keywords: ['3-wege', 'mischer', 'beimischung', 'verteiler'],
    ports: [
      { id: 'a', rx: 0, ry: 0.68, dir: 'left', kind: 'fluid', label: 'Anschluss A' },
      { id: 'ab', rx: 1, ry: 0.68, dir: 'right', kind: 'fluid', label: 'Anschluss AB' },
      { id: 'b', rx: 0.5, ry: 1, dir: 'bottom', kind: 'fluid', label: 'Anschluss B' },
    ],
    params: [
      ...medienParams(),
      sel('funktion', 'Funktion', ['Mischen', 'Verteilen'], { group: 'Auslegung', default: 'Mischen' }),
      num('kvs', 'kvs-Wert', 'm³/h', { group: 'Auslegung', step: 0.1, showByDefault: true, short: 'kvs' }),
      sel('schaltung', 'Hydraulische Schaltung', ['Beimischschaltung', 'Einspritzschaltung', 'Drosselschaltung', 'Umlenkschaltung'], { group: 'Auslegung' }),
      sel('signal', 'Ansteuerung', ['stetig 0–10 V', '3-Punkt', 'Bus'], { group: 'MSR', default: 'stetig 0–10 V' }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h * 0.68
      const half = 10
      const dx = 13
      return (
        <g>
          <path d={`M0 ${n(cy)}L${n(cx - dx)} ${n(cy)}M${n(cx + dx)} ${n(cy)}L${n(c.w)} ${n(cy)}M${n(cx)} ${n(cy + dx)}L${n(cx)} ${n(c.h)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <path
            d={`M${n(cx - dx)} ${n(cy - half)}L${n(cx - dx)} ${n(cy + half)}L${n(cx)} ${n(cy)}Z` +
              `M${n(cx + dx)} ${n(cy - half)}L${n(cx + dx)} ${n(cy + half)}L${n(cx)} ${n(cy)}Z` +
              `M${n(cx - half)} ${n(cy + dx)}L${n(cx + half)} ${n(cy + dx)}L${n(cx)} ${n(cy)}Z`}
            fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} strokeLinejoin="round"
          />
          <path d={`M${n(cx)} ${n(cy - half)}L${n(cx)} 16`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <Actuator c={c} x={cx} y={9} letter="M" />
        </g>
      )
    },
  },
  {
    id: 'rueckschlagventil',
    label: 'Rückschlagventil',
    category: 'hydraulik',
    tagPrefix: 'RSV',
    w: VW, h: VH,
    norm: 'DIN EN ISO 10628 — Rückflussverhinderer',
    keywords: ['rückschlag', 'rückfluss', 'sperre'],
    ports: fluidPort(),
    params: [...medienParams(), num('oeffnungsdruck', 'Öffnungsdruck', 'kPa', { group: 'Auslegung', step: 0.5 })],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h / 2
      return (
        <g>
          <path d={`M0 ${n(cy)}L${n(c.w)} ${n(cy)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={`M${n(cx - 9)} ${n(cy - 10)}L${n(cx - 9)} ${n(cy + 10)}L${n(cx + 7)} ${n(cy)}Z`} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} strokeLinejoin="round" />
          <path d={`M${n(cx + 8)} ${n(cy - 11)}L${n(cx + 8)} ${n(cy + 11)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} />
        </g>
      )
    },
  },
  {
    id: 'schmutzfaenger',
    label: 'Schmutzfänger',
    category: 'hydraulik',
    tagPrefix: 'SF',
    w: VW, h: VH,
    norm: 'DIN EN ISO 10628 — Filter in Rohrleitung',
    keywords: ['schmutzfänger', 'sieb', 'filter', 'y-filter'],
    ports: fluidPort(),
    params: [...medienParams(), num('maschenweite', 'Maschenweite', 'mm', { group: 'Ausführung', step: 0.1 }), bool('abschlaemmung', 'Abschlämmhahn', { group: 'Wartung', default: true })],
    draw: (c) => {
      const cy = c.h / 2
      const cx = c.w / 2
      return (
        <g>
          <path d={`M0 ${n(cy)}L${n(c.w)} ${n(cy)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <rect x={n(cx - 11)} y={n(cy - 9)} width={22} height={18} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={hatch(cx - 11, cy - 9, 22, 18, 4, 60)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        </g>
      )
    },
  },
  {
    id: 'sicherheitsventil',
    label: 'Sicherheitsventil',
    category: 'hydraulik',
    tagPrefix: 'SV',
    w: 40, h: 48,
    norm: 'DIN EN ISO 4126 / DIN EN ISO 10628',
    keywords: ['sicherheit', 'überdruck', 'abblasen', 'feder'],
    ports: [
      { id: 'in', rx: 0, ry: 0.75, dir: 'left', kind: 'fluid', label: 'Eintritt' },
      { id: 'out', rx: 1, ry: 0.24, dir: 'right', kind: 'fluid', label: 'Abblaseleitung' },
    ],
    params: [
      ...medienParams(),
      num('ansprechdruck', 'Ansprechdruck', 'bar', { group: 'Auslegung', step: 0.1, showByDefault: true, short: 'p' }),
      num('abblaseleistung', 'Abblaseleistung', 'kW', { group: 'Auslegung', step: 1 }),
      txt('abblaseleitung', 'Abblaseleitung nach', { group: 'Ausführung' }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h * 0.75
      return (
        <g>
          <path d={`M0 ${n(cy)}L${n(cx)} ${n(cy)}M${n(cx)} ${n(c.h * 0.24)}L${n(c.w)} ${n(c.h * 0.24)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={`M${n(cx - 11)} ${n(cy - 9)}L${n(cx - 11)} ${n(cy + 9)}L${n(cx)} ${n(cy)}Z`} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} strokeLinejoin="round" />
          <path d={`M${n(cx + 9)} ${n(c.h * 0.24 - 9)}L${n(cx + 9)} ${n(c.h * 0.24 + 9)}L${n(cx)} ${n(c.h * 0.24)}Z`} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} strokeLinejoin="round" />
          <path d={`M${n(cx)} ${n(cy)}L${n(cx)} ${n(c.h * 0.24)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <path d={coil(cx - 6, cx + 6, c.h * 0.5, 4, 3)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        </g>
      )
    },
  },
  {
    id: 'ausdehnungsgefaess',
    label: 'Ausdehnungsgefäß',
    category: 'hydraulik',
    tagPrefix: 'MAG',
    w: 40, h: 52,
    norm: 'DIN EN 12828 — Druckhaltung',
    keywords: ['mag', 'ausdehnung', 'druckhaltung', 'membran'],
    ports: [{ id: 'in', rx: 0.5, ry: 1, dir: 'bottom', kind: 'fluid', label: 'Anschluss' }],
    params: [
      ...medienParams(),
      num('nenninhalt', 'Nenninhalt', 'l', { group: 'Auslegung', step: 1, showByDefault: true, short: 'V' }),
      num('vordruck', 'Vordruck', 'bar', { group: 'Auslegung', step: 0.1 }),
      sel('bauart', 'Bauart', ['Membranausdehnungsgefäß', 'Druckhaltestation', 'offenes Gefäß'], { group: 'Ausführung', default: 'Membranausdehnungsgefäß' }),
      bool('kappenventil', 'Wartungsarmatur (Kappenventil)', { group: 'Wartung', default: true }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      return (
        <g>
          <path d={`M${n(cx)} ${n(c.h)}L${n(cx)} ${n(c.h - 8)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <rect x={n(cx - 14)} y={4} width={28} height={n(c.h - 12)} rx={13} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={`M${n(cx - 13)} ${n(c.h * 0.46)}q13 -9 26 0`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        </g>
      )
    },
  },
  {
    id: 'waermezaehler',
    label: 'Wärmemengenzähler',
    category: 'hydraulik',
    tagPrefix: 'WMZ',
    w: 40, h: 40,
    norm: 'DIN EN 1434 — Wärmezähler',
    keywords: ['wmz', 'wärmezähler', 'kältezähler', 'abrechnung'],
    ports: fluidPort(),
    params: [
      ...medienParams(),
      sel('art', 'Zählerart', ['Wärmezähler', 'Kältezähler', 'Kombizähler'], { group: 'Ausführung', default: 'Wärmezähler' }),
      txt('nenndurchfluss', 'Nenndurchfluss qp', { group: 'Auslegung', placeholder: '6 m³/h' }),
      sel('genauigkeit', 'Genauigkeitsklasse', ['Klasse 1', 'Klasse 2', 'Klasse 3'], { group: 'MSR', default: 'Klasse 2' }),
      bool('mbus', 'Fernauslesung (M-Bus)', { group: 'MSR', default: true }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h / 2
      return (
        <g>
          <path d={`M0 ${n(cy)}L${n(c.w)} ${n(cy)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <circle cx={n(cx)} cy={n(cy)} r={13} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <Glyph c={c} x={cx} y={cy} size={9}>kWh</Glyph>
        </g>
      )
    },
  },
  {
    id: 'hydraulische-weiche',
    label: 'Hydraulische Weiche',
    category: 'hydraulik',
    tagPrefix: 'HW',
    w: 44, h: 68,
    norm: 'DIN EN 12828 — hydraulische Entkopplung',
    keywords: ['weiche', 'entkopplung', 'verteiler'],
    ports: [
      { id: 'e_vl', rx: 0, ry: 0.2, dir: 'left', kind: 'fluid', label: 'Erzeuger Vorlauf' },
      { id: 'e_rl', rx: 0, ry: 0.8, dir: 'left', kind: 'fluid', label: 'Erzeuger Rücklauf' },
      { id: 'v_vl', rx: 1, ry: 0.2, dir: 'right', kind: 'fluid', label: 'Verbraucher Vorlauf' },
      { id: 'v_rl', rx: 1, ry: 0.8, dir: 'right', kind: 'fluid', label: 'Verbraucher Rücklauf' },
    ],
    params: [
      ...medienParams(),
      txt('nennweite_weiche', 'Nennweite Weiche', { group: 'Ausführung', placeholder: 'DN 100' }),
      bool('entlueftung', 'Entlüftung und Entleerung', { group: 'Wartung', default: true }),
      bool('schlammabscheider', 'Schlammabscheidefunktion', { group: 'Wartung' }),
    ],
    draw: (c) => (
      <g>
        <rect x={n(c.w / 2 - 11)} y={4} width={22} height={n(c.h - 8)} rx={4} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M0 ${n(c.h * 0.2)}L${n(c.w / 2 - 11)} ${n(c.h * 0.2)}M0 ${n(c.h * 0.8)}L${n(c.w / 2 - 11)} ${n(c.h * 0.8)}M${n(c.w / 2 + 11)} ${n(c.h * 0.2)}L${n(c.w)} ${n(c.h * 0.2)}M${n(c.w / 2 + 11)} ${n(c.h * 0.8)}L${n(c.w)} ${n(c.h * 0.8)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
      </g>
    ),
  },
  {
    id: 'verteiler-hydraulik',
    label: 'Verteiler / Sammler',
    category: 'hydraulik',
    tagPrefix: 'VS',
    w: 92, h: 36,
    norm: 'DIN EN 12828',
    keywords: ['verteiler', 'sammler', 'balken', 'heizkreise'],
    ports: [
      { id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'fluid', label: 'Einspeisung' },
      { id: 'a1', rx: 0.28, ry: 0, dir: 'top', kind: 'fluid', label: 'Abgang 1' },
      { id: 'a2', rx: 0.52, ry: 0, dir: 'top', kind: 'fluid', label: 'Abgang 2' },
      { id: 'a3', rx: 0.76, ry: 0, dir: 'top', kind: 'fluid', label: 'Abgang 3' },
    ],
    params: [
      ...medienParams(),
      num('abgaenge', 'Anzahl Heizkreise', 'Stk', { group: 'Ausführung', step: 1, default: 3 }),
      bool('daemmung', 'Wärmedämmung', { group: 'Ausführung', default: true }),
    ],
    draw: (c) => (
      <g>
        <rect x={6} y={n(c.h / 2 - 9)} width={n(c.w - 12)} height={18} rx={9} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M0 ${n(c.h / 2)}L6 ${n(c.h / 2)}M${n(c.w * 0.28)} 0L${n(c.w * 0.28)} ${n(c.h / 2 - 9)}M${n(c.w * 0.52)} 0L${n(c.w * 0.52)} ${n(c.h / 2 - 9)}M${n(c.w * 0.76)} 0L${n(c.w * 0.76)} ${n(c.h / 2 - 9)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
      </g>
    ),
  },
  {
    id: 'manometer',
    label: 'Manometer / Thermometer',
    category: 'hydraulik',
    tagPrefix: 'PI',
    w: 30, h: 36,
    norm: 'DIN EN ISO 10628 — örtliche Anzeige',
    keywords: ['manometer', 'thermometer', 'anzeige', 'lokal'],
    ports: [{ id: 'in', rx: 0.5, ry: 1, dir: 'bottom', kind: 'fluid', label: 'Messstelle' }],
    params: [
      sel('groesse', 'Messgröße', ['Druck', 'Temperatur'], { group: 'MSR', default: 'Druck' }),
      txt('messbereich', 'Messbereich', { group: 'MSR', placeholder: '0 … 10 bar' }),
      bool('absperrbar', 'Absperrbar', { group: 'Wartung', default: true }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = 12
      return (
        <g>
          <path d={`M${n(cx)} ${n(c.h)}L${n(cx)} ${n(cy + 11)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <circle cx={n(cx)} cy={n(cy)} r={11} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={`M${n(cx)} ${n(cy)}L${n(cx + 6)} ${n(cy - 6)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} strokeLinecap="round" />
        </g>
      )
    },
  },
]

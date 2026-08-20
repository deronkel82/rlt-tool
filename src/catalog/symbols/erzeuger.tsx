import type { SymbolDef } from '../types'
import { Glyph, SW, arc, arrowHead, n } from '../draw'
import { bool, num, sel, txt } from '../params'

const EW = 72
const EH = 60

const erzeugerPorts = (vl = 'Vorlauf', rl = 'Rücklauf') => [
  { id: 'vl', rx: 1, ry: 0.28, dir: 'right' as const, kind: 'fluid' as const, label: vl },
  { id: 'rl', rx: 1, ry: 0.72, dir: 'right' as const, kind: 'fluid' as const, label: rl },
]

export const erzeuger: SymbolDef[] = [
  {
    id: 'kessel',
    label: 'Wärmeerzeuger',
    category: 'erzeuger',
    tagPrefix: 'WE',
    w: EW, h: EH,
    norm: 'DIN EN ISO 10628 — Wärmeerzeuger mit Brenner',
    keywords: ['kessel', 'brennwert', 'heizung', 'gas', 'öl'],
    ports: erzeugerPorts(),
    params: [
      sel('energietraeger', 'Energieträger', ['Erdgas', 'Heizöl EL', 'Pellets', 'Hackschnitzel', 'Wasserstoff', 'Fernwärme'], { group: 'Auslegung', default: 'Erdgas' }),
      num('leistung', 'Nennwärmeleistung', 'kW', { group: 'Auslegung', step: 1, showByDefault: true, short: 'Q' }),
      sel('bauart', 'Bauart', ['Brennwertkessel', 'Niedertemperaturkessel', 'Biomassekessel'], { group: 'Ausführung', default: 'Brennwertkessel' }),
      num('t_vl', 'Vorlauftemperatur', '°C', { group: 'Medium', step: 1, default: 70 }),
      num('t_rl', 'Rücklauftemperatur', '°C', { group: 'Medium', step: 1, default: 50 }),
      num('wirkungsgrad', 'Normnutzungsgrad', '%', { group: 'Energie', step: 0.1 }),
      txt('abgas', 'Abgasführung', { group: 'Ausführung', placeholder: 'raumluftunabhängig, DN 110' }),
      bool('kaskade', 'Kaskadenschaltung', { group: 'Ausführung' }),
    ],
    draw: (c) => (
      <g>
        <rect x={0} y={0} width={c.w} height={c.h} rx={3} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path
          d={`M${n(c.w * 0.5)} ${n(c.h * 0.78)}q-9 -7 -3 -16q2 5 5 3q-4 -8 3 -15q-1 8 6 12q5 3 3 11q-2 5 -8 5Z`}
          fill="none" stroke={c.t.line} strokeWidth={SW.inner} strokeLinejoin="round"
        />
        <path d={`M${n(c.w * 0.18)} ${n(c.h * 0.88)}L${n(c.w * 0.82)} ${n(c.h * 0.88)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
      </g>
    ),
  },
  {
    id: 'waermepumpe',
    label: 'Wärmepumpe',
    category: 'erzeuger',
    tagPrefix: 'WP',
    w: EW, h: EH,
    norm: 'DIN EN 14511 / DIN EN ISO 10628',
    keywords: ['wärmepumpe', 'luft-wasser', 'sole', 'cop', 'scop'],
    ports: [
      { id: 'q_ein', rx: 0, ry: 0.5, dir: 'left', kind: 'fluid', label: 'Wärmequelle' },
      ...erzeugerPorts(),
    ],
    params: [
      sel('quelle', 'Wärmequelle', ['Außenluft', 'Erdreich (Sole)', 'Grundwasser', 'Abwärme', 'Fortluft'], { group: 'Auslegung', default: 'Außenluft' }),
      num('leistung', 'Heizleistung', 'kW', { group: 'Auslegung', step: 0.5, showByDefault: true, short: 'Q' }),
      num('kuehlleistung', 'Kühlleistung', 'kW', { group: 'Auslegung', step: 0.5 }),
      num('cop', 'COP', '—', { group: 'Energie', step: 0.1, showByDefault: true, short: 'COP' }),
      num('scop', 'SCOP', '—', { group: 'Energie', step: 0.1 }),
      txt('kaeltemittel', 'Kältemittel', { group: 'Medium', default: 'R290' }),
      num('t_vl', 'Vorlauftemperatur', '°C', { group: 'Medium', step: 1, default: 45 }),
      sel('betrieb', 'Betriebsart', ['nur Heizen', 'Heizen und Kühlen', 'reversibel mit Warmwasser'], { group: 'Auslegung' }),
      num('lwa', 'Schallleistungspegel', 'dB(A)', { group: 'Schall', step: 1 }),
      bool('inverter', 'Leistungsgeregelt (Inverter)', { group: 'Energie', default: true }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h / 2
      return (
        <g>
          <rect x={0} y={0} width={c.w} height={c.h} rx={3} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={`M0 ${n(c.h)}L${n(c.w)} 0`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <circle cx={n(cx)} cy={n(cy)} r={11} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.inner} />
          <path d={`M${n(cx - 5)} ${n(cy - 6)}L${n(cx - 5)} ${n(cy + 6)}L${n(cx + 7)} ${n(cy)}Z`} fill={c.t.line} stroke="none" />
          <path d={arrowHead(c.w * 0.22, c.h * 0.78, 180, 5) + arrowHead(c.w * 0.78, c.h * 0.22, 0, 5)} fill={c.t.line} stroke="none" />
        </g>
      )
    },
  },
  {
    id: 'kaeltemaschine',
    label: 'Kaltwassersatz',
    category: 'erzeuger',
    tagPrefix: 'KM',
    w: EW, h: EH,
    norm: 'DIN EN 14511 — Flüssigkeitskühlsatz',
    keywords: ['kältemaschine', 'chiller', 'kaltwasser', 'eer'],
    ports: [
      { id: 'kw_vl', rx: 1, ry: 0.28, dir: 'right', kind: 'fluid', label: 'Kaltwasser Vorlauf' },
      { id: 'kw_rl', rx: 1, ry: 0.72, dir: 'right', kind: 'fluid', label: 'Kaltwasser Rücklauf' },
      { id: 'rk', rx: 0, ry: 0.5, dir: 'left', kind: 'fluid', label: 'Rückkühlung' },
    ],
    params: [
      num('leistung', 'Kälteleistung', 'kW', { group: 'Auslegung', step: 1, showByDefault: true, short: 'Q' }),
      num('eer', 'EER', '—', { group: 'Energie', step: 0.1, showByDefault: true, short: 'EER' }),
      num('seer', 'SEER', '—', { group: 'Energie', step: 0.1 }),
      sel('verfluessigung', 'Verflüssigung', ['luftgekühlt', 'wassergekühlt', 'freie Kühlung integriert'], { group: 'Ausführung', default: 'luftgekühlt' }),
      sel('verdichter', 'Verdichterbauart', ['Scroll', 'Schraube', 'Turbo (magnetgelagert)', 'Kolben'], { group: 'Ausführung' }),
      txt('kaeltemittel', 'Kältemittel', { group: 'Medium', default: 'R1234ze' }),
      num('fuellmenge', 'Füllmenge', 'kg', { group: 'Medium', step: 0.1 }),
      num('t_vl', 'Kaltwasser Vorlauf', '°C', { group: 'Medium', step: 0.5, default: 6 }),
      num('lwa', 'Schallleistungspegel', 'dB(A)', { group: 'Schall', step: 1 }),
      bool('freie_kuehlung', 'Freie Kühlung', { group: 'Energie' }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h / 2
      const rays = []
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3
        rays.push(`M${n(cx)} ${n(cy)}L${n(cx + Math.cos(a) * 14)} ${n(cy + Math.sin(a) * 14)}`)
      }
      return (
        <g>
          <rect x={0} y={0} width={c.w} height={c.h} rx={3} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={rays.join('')} fill="none" stroke={c.t.line} strokeWidth={SW.inner} strokeLinecap="round" />
        </g>
      )
    },
  },
  {
    id: 'rueckkuehler',
    label: 'Trockenrückkühler',
    category: 'erzeuger',
    tagPrefix: 'RK',
    w: EW, h: EH,
    norm: 'DIN EN 1048 — Rückkühlwerk',
    keywords: ['rückkühler', 'trockenkühler', 'freie kühlung', 'dach'],
    ports: [
      { id: 'vl', rx: 0, ry: 0.32, dir: 'left', kind: 'fluid', label: 'Eintritt' },
      { id: 'rl', rx: 0, ry: 0.76, dir: 'left', kind: 'fluid', label: 'Austritt' },
    ],
    params: [
      num('leistung', 'Rückkühlleistung', 'kW', { group: 'Auslegung', step: 1, showByDefault: true, short: 'Q' }),
      num('t_ein', 'Medieneintritt', '°C', { group: 'Medium', step: 0.5, default: 40 }),
      num('t_aus', 'Medienaustritt', '°C', { group: 'Medium', step: 0.5, default: 35 }),
      num('t_aussen', 'Auslegungsaußentemperatur', '°C', { group: 'Auslegung', step: 0.5, default: 32 }),
      num('ventilatoren', 'Anzahl Ventilatoren', 'Stk', { group: 'Ausführung', step: 1 }),
      sel('regelung', 'Ventilatorregelung', ['EC-Motor stufenlos', 'Stufenschaltung', 'ungeregelt'], { group: 'MSR', default: 'EC-Motor stufenlos' }),
      bool('adiabat', 'Adiabate Vorkühlung', { group: 'Energie' }),
      num('lwa', 'Schallleistungspegel', 'dB(A)', { group: 'Schall', step: 1 }),
    ],
    draw: (c) => (
      <g>
        <rect x={0} y={n(c.h * 0.32)} width={c.w} height={n(c.h * 0.68)} rx={3} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M6 ${n(c.h - 6)}L${n(c.w - 6)} ${n(c.h * 0.32 + 6)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <circle cx={n(c.w * 0.3)} cy={n(c.h * 0.32)} r={11} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.inner} />
        <circle cx={n(c.w * 0.7)} cy={n(c.h * 0.32)} r={11} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M${n(c.w * 0.3 - 6)} ${n(c.h * 0.32 - 4)}L${n(c.w * 0.3 + 6)} ${n(c.h * 0.32 + 4)}M${n(c.w * 0.7 - 6)} ${n(c.h * 0.32 - 4)}L${n(c.w * 0.7 + 6)} ${n(c.h * 0.32 + 4)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
      </g>
    ),
  },
  {
    id: 'kuehlturm',
    label: 'Verdunstungskühlturm',
    category: 'erzeuger',
    tagPrefix: 'KT',
    w: EW, h: EH,
    norm: 'VDI 2047 — Verdunstungskühlanlage',
    keywords: ['kühlturm', 'verdunstung', 'nasskühler', 'legionellen'],
    ports: [
      { id: 'vl', rx: 0, ry: 0.4, dir: 'left', kind: 'fluid', label: 'Eintritt' },
      { id: 'rl', rx: 0, ry: 0.8, dir: 'left', kind: 'fluid', label: 'Austritt' },
    ],
    params: [
      num('leistung', 'Rückkühlleistung', 'kW', { group: 'Auslegung', step: 1, showByDefault: true, short: 'Q' }),
      num('t_feucht', 'Feuchtkugeltemperatur', '°C', { group: 'Auslegung', step: 0.5, default: 21 }),
      num('wasserverbrauch', 'Zusatzwasserbedarf', 'm³/h', { group: 'Medium', step: 0.1 }),
      bool('vdi2047', 'Betrieb nach VDI 2047-2', { group: 'Hygiene', default: true }),
      bool('anzeigepflicht', 'Anzeigepflicht 42. BImSchV', { group: 'Hygiene', default: true }),
      bool('tropfenabscheider', 'Tropfenabscheider', { group: 'Ausführung', default: true }),
      bool('biozid', 'Automatische Biozid-Dosierung', { group: 'Hygiene' }),
    ],
    draw: (c) => (
      <g>
        <path d={`M4 ${n(c.h)}L${n(c.w * 0.2)} 10L${n(c.w * 0.8)} 10L${n(c.w - 4)} ${n(c.h)}Z`} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} strokeLinejoin="round" />
        <circle cx={n(c.w / 2)} cy={10} r={9} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M${n(c.w / 2 - 5)} 7L${n(c.w / 2 + 5)} 13`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        <path d={`M${n(c.w * 0.3)} ${n(c.h * 0.55)}q4 6 0 10M${n(c.w * 0.5)} ${n(c.h * 0.62)}q4 6 0 10M${n(c.w * 0.7)} ${n(c.h * 0.55)}q4 6 0 10`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
      </g>
    ),
  },
  {
    id: 'fernwaerme',
    label: 'Fernwärmeübergabestation',
    category: 'erzeuger',
    tagPrefix: 'FWS',
    w: EW, h: EH,
    norm: 'AGFW FW 510 / DIN EN ISO 10628',
    keywords: ['fernwärme', 'übergabe', 'hausanschluss', 'primär'],
    ports: [
      { id: 'p_vl', rx: 0, ry: 0.28, dir: 'left', kind: 'fluid', label: 'Primär Vorlauf' },
      { id: 'p_rl', rx: 0, ry: 0.72, dir: 'left', kind: 'fluid', label: 'Primär Rücklauf' },
      ...erzeugerPorts('Sekundär Vorlauf', 'Sekundär Rücklauf'),
    ],
    params: [
      num('leistung', 'Anschlussleistung', 'kW', { group: 'Auslegung', step: 1, showByDefault: true, short: 'Q' }),
      num('t_primaer_vl', 'Primär Vorlauf', '°C', { group: 'Medium', step: 1, default: 110 }),
      num('t_primaer_rl', 'Primär Rücklauf max.', '°C', { group: 'Medium', step: 1, default: 60 }),
      num('t_sekundaer_vl', 'Sekundär Vorlauf', '°C', { group: 'Medium', step: 1, default: 70 }),
      sel('schaltung', 'Schaltung', ['indirekt (Wärmeübertrager)', 'direkt'], { group: 'Ausführung', default: 'indirekt (Wärmeübertrager)' }),
      txt('versorger', 'Versorgungsunternehmen', { group: 'Kennzeichnung' }),
    ],
    draw: (c) => (
      <g>
        <rect x={0} y={0} width={c.w} height={c.h} rx={3} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <rect x={n(c.w * 0.3)} y={n(c.h * 0.18)} width={n(c.w * 0.4)} height={n(c.h * 0.64)} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M${n(c.w * 0.3)} ${n(c.h * 0.82)}L${n(c.w * 0.7)} ${n(c.h * 0.18)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M6 ${n(c.h * 0.28)}L${n(c.w * 0.3)} ${n(c.h * 0.28)}M6 ${n(c.h * 0.72)}L${n(c.w * 0.3)} ${n(c.h * 0.72)}M${n(c.w * 0.7)} ${n(c.h * 0.28)}L${n(c.w - 6)} ${n(c.h * 0.28)}M${n(c.w * 0.7)} ${n(c.h * 0.72)}L${n(c.w - 6)} ${n(c.h * 0.72)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
      </g>
    ),
  },
  {
    id: 'pufferspeicher',
    label: 'Pufferspeicher',
    category: 'erzeuger',
    tagPrefix: 'PSP',
    w: 48, h: 72,
    norm: 'DIN EN 12828 — Wärmespeicher',
    keywords: ['puffer', 'speicher', 'schichtung', 'warmwasser'],
    ports: [
      { id: 'o', rx: 1, ry: 0.16, dir: 'right', kind: 'fluid', label: 'oberer Anschluss' },
      { id: 'm', rx: 1, ry: 0.5, dir: 'right', kind: 'fluid', label: 'mittlerer Anschluss' },
      { id: 'u', rx: 1, ry: 0.84, dir: 'right', kind: 'fluid', label: 'unterer Anschluss' },
    ],
    params: [
      num('volumen', 'Speichervolumen', 'l', { group: 'Auslegung', step: 50, showByDefault: true, short: 'V' }),
      sel('art', 'Speicherart', ['Pufferspeicher', 'Kaltwasserspeicher', 'Trinkwarmwasserspeicher', 'Kombispeicher'], { group: 'Ausführung', default: 'Pufferspeicher' }),
      num('t_max', 'Maximale Temperatur', '°C', { group: 'Medium', step: 1, default: 90 }),
      num('daemmung', 'Dämmdicke', 'mm', { group: 'Ausführung', step: 10 }),
      sel('effizienz', 'Effizienzklasse', ['A+', 'A', 'B', 'C'], { group: 'Energie' }),
      bool('schichtladung', 'Schichtladeeinrichtung', { group: 'Ausführung' }),
    ],
    draw: (c) => (
      <g>
        <rect x={6} y={4} width={n(c.w - 12)} height={n(c.h - 8)} rx={12} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M10 ${n(c.h * 0.3)}L${n(c.w - 10)} ${n(c.h * 0.3)}M10 ${n(c.h * 0.5)}L${n(c.w - 10)} ${n(c.h * 0.5)}M10 ${n(c.h * 0.7)}L${n(c.w - 10)} ${n(c.h * 0.7)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} strokeDasharray="4 3" />
      </g>
    ),
  },
  {
    id: 'bhkw',
    label: 'Blockheizkraftwerk',
    category: 'erzeuger',
    tagPrefix: 'BHKW',
    w: EW, h: EH,
    norm: 'DIN EN ISO 10628 — Kraft-Wärme-Kopplung',
    keywords: ['bhkw', 'kwk', 'motor', 'strom'],
    ports: erzeugerPorts(),
    params: [
      num('leistung', 'Thermische Leistung', 'kW', { group: 'Auslegung', step: 1, showByDefault: true, short: 'Qth' }),
      num('leistung_el', 'Elektrische Leistung', 'kW', { group: 'Auslegung', step: 1, showByDefault: true, short: 'Pel' }),
      sel('energietraeger', 'Energieträger', ['Erdgas', 'Biogas', 'Heizöl EL', 'Wasserstoff'], { group: 'Auslegung', default: 'Erdgas' }),
      num('gesamtwirkungsgrad', 'Gesamtwirkungsgrad', '%', { group: 'Energie', step: 1 }),
      num('betriebsstunden', 'Jahresbetriebsstunden', 'h/a', { group: 'Energie', step: 100 }),
      bool('notstrom', 'Notstromfähig', { group: 'Elektro' }),
    ],
    draw: (c) => (
      <g>
        <rect x={0} y={0} width={c.w} height={c.h} rx={3} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <rect x={n(c.w * 0.1)} y={n(c.h * 0.28)} width={n(c.w * 0.36)} height={n(c.h * 0.44)} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <circle cx={n(c.w * 0.72)} cy={n(c.h * 0.5)} r={13} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M${n(c.w * 0.46)} ${n(c.h * 0.5)}L${n(c.w * 0.72 - 13)} ${n(c.h * 0.5)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        <Glyph c={c} x={c.w * 0.72} y={c.h * 0.5} size={11}>G</Glyph>
        <path d={arc(c.w * 0.28, c.h * 0.5, 8, 200, 340)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
      </g>
    ),
  },
]

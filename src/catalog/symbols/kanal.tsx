import type { SymbolDef } from '../types'
import { Glyph, SW, arrowHead, hatch, n } from '../draw'
import { airIn, airInOut, airOut } from '../ports'
import {
  DICHTHEITSKLASSE, KANALFORM, KANALWERKSTOFF,
  bool, num, pAbmessung, pDruckverlust, pVolumenstrom, sel, txt,
} from '../params'

/** Kennwerte, die an jedem Kanalformteil sinnvoll sind. */
const kanalParams = () => [
  pVolumenstrom({ showByDefault: false }),
  sel('form', 'Querschnittsform', KANALFORM, { group: 'Ausführung', default: 'rechteckig' }),
  pAbmessung({ placeholder: '600 × 400 mm bzw. Ø 250 mm' }),
  sel('werkstoff', 'Werkstoff', KANALWERKSTOFF, { group: 'Ausführung', default: 'verzinkter Stahl' }),
  sel('dichtheit', 'Dichtheitsklasse', DICHTHEITSKLASSE, { group: 'Ausführung', default: 'ATC 5 (C)', hint: 'DIN EN 12237 / DIN EN 1507' }),
  num('daemmung', 'Dämmdicke', 'mm', { group: 'Ausführung', step: 10 }),
  pDruckverlust(),
]

export const kanal: SymbolDef[] = [
  {
    id: 'kanal-bogen',
    label: 'Bogen 90°',
    category: 'kanal',
    tagPrefix: 'BO',
    w: 48, h: 48,
    norm: 'DIN EN 12792 — Kanalformteil',
    keywords: ['bogen', 'krümmer', 'umlenkung', '90'],
    ports: [
      { id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air', label: 'Eintritt' },
      { id: 'out', rx: 0.5, ry: 1, dir: 'bottom', kind: 'air', label: 'Austritt' },
    ],
    params: [
      ...kanalParams(),
      num('radius', 'Krümmungsradius', 'mm', { group: 'Ausführung', step: 10 }),
      bool('umlenkbleche', 'Umlenkbleche', { group: 'Ausführung' }),
    ],
    draw: (c) => (
      <g>
        <path d="M0 14L10 14A24 24 0 0 1 34 38L34 48" fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d="M0 34L10 34A4 4 0 0 1 14 38L14 48" fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
      </g>
    ),
  },
  {
    id: 'kanal-t',
    label: 'T-Stück / Abzweig',
    category: 'kanal',
    tagPrefix: 'KT',
    w: 64, h: 48,
    norm: 'DIN EN 12792 — Kanalformteil',
    keywords: ['abzweig', 't-stück', 'verzweigung'],
    ports: [
      { id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air', label: 'Eintritt' },
      { id: 'out', rx: 1, ry: 0.5, dir: 'right', kind: 'air', label: 'Durchgang' },
      { id: 'ab', rx: 0.5, ry: 1, dir: 'bottom', kind: 'air', label: 'Abzweig' },
    ],
    params: [
      ...kanalParams(),
      num('v_abzweig', 'Volumenstrom Abzweig', 'm³/h', { group: 'Auslegung', step: 10 }),
      txt('abmessung_abzweig', 'Abmessung Abzweig', { group: 'Ausführung' }),
      bool('drossel', 'Absperr-/Drosselklappe im Abzweig', { group: 'Ausführung' }),
    ],
    draw: (c) => (
      <g>
        <path d={`M0 14L${n(c.w)} 14`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M0 34L22 34M42 34L${n(c.w)} 34`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M22 34L22 ${n(c.h)}M42 34L42 ${n(c.h)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
      </g>
    ),
  },
  {
    id: 'kanal-hose',
    label: 'Hosenstück',
    category: 'kanal',
    tagPrefix: 'KH',
    w: 60, h: 64,
    norm: 'DIN EN 12792 — Kanalformteil',
    keywords: ['hose', 'y-stück', 'gabelung'],
    ports: [
      { id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air', label: 'Eintritt' },
      { id: 'out1', rx: 1, ry: 0.22, dir: 'right', kind: 'air', label: 'Austritt oben' },
      { id: 'out2', rx: 1, ry: 0.78, dir: 'right', kind: 'air', label: 'Austritt unten' },
    ],
    params: [
      ...kanalParams(),
      num('v_ast1', 'Volumenstrom Ast 1', 'm³/h', { group: 'Auslegung', step: 10 }),
      num('v_ast2', 'Volumenstrom Ast 2', 'm³/h', { group: 'Auslegung', step: 10 }),
    ],
    draw: (c) => (
      <g>
        <path d={`M0 22L18 22L${n(c.w)} 4M0 42L18 42L${n(c.w)} 60`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M18 22L${n(c.w)} 24M18 42L${n(c.w)} 40`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
      </g>
    ),
  },
  {
    id: 'kanal-reduzierung',
    label: 'Reduzierung',
    category: 'kanal',
    tagPrefix: 'KR',
    w: 48, h: 44,
    norm: 'DIN EN 12792 — Kanalformteil',
    keywords: ['reduzierung', 'querschnitt', 'verengung', 'erweiterung'],
    ports: airInOut(),
    params: [
      ...kanalParams(),
      txt('abmessung_ein', 'Abmessung Eintritt', { group: 'Ausführung' }),
      txt('abmessung_aus', 'Abmessung Austritt', { group: 'Ausführung' }),
      num('winkel', 'Übergangswinkel', '°', { group: 'Ausführung', step: 1, default: 15 }),
    ],
    draw: (c) => (
      <g>
        <path d={`M0 8L${n(c.w)} 15M0 36L${n(c.w)} 29`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
      </g>
    ),
  },
  {
    id: 'kanal-uebergang',
    label: 'Übergang eckig/rund',
    category: 'kanal',
    tagPrefix: 'KU',
    w: 48, h: 44,
    norm: 'DIN EN 12792 — Kanalformteil',
    keywords: ['übergang', 'eckig', 'rund', 'formstück'],
    ports: airInOut(),
    params: [...kanalParams(), txt('abmessung_ein', 'Abmessung Eintritt', { group: 'Ausführung', placeholder: '400 × 200 mm' }), txt('abmessung_aus', 'Abmessung Austritt', { group: 'Ausführung', placeholder: 'Ø 250 mm' })],
    draw: (c) => (
      <g>
        <path d={`M0 8L${n(c.w)} 13M0 36L${n(c.w)} 31`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d="M0 8L0 36" fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <ellipse cx={n(c.w)} cy={22} rx={3.5} ry={9} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
      </g>
    ),
  },
  {
    id: 'kanal-revision',
    label: 'Revisionsöffnung',
    category: 'kanal',
    tagPrefix: 'REV',
    w: 48, h: 44,
    norm: 'DIN EN 12097 — Zugang zur Reinigung',
    keywords: ['revision', 'reinigung', 'öffnung', 'wartung'],
    ports: airInOut(),
    params: [
      pAbmessung({ label: 'Öffnungsmaß', placeholder: '300 × 200 mm' }),
      sel('lage', 'Lage', ['Seitlich', 'Unterseite', 'Oberseite'], { group: 'Ausführung' }),
      bool('vdi6022', 'Zugänglichkeit nach VDI 6022', { group: 'Hygiene', default: true }),
      txt('bemerkung_zugang', 'Zugangssituation', { group: 'Wartung' }),
    ],
    draw: (c) => (
      <g>
        <path d={`M0 10L${n(c.w)} 10M0 34L${n(c.w)} 34`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <rect x={12} y={4} width={24} height={8} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.inner} strokeDasharray="3 2" />
        <path d="M18 4L18 12M30 4L30 12" fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
      </g>
    ),
  },
  {
    id: 'kanal-flex',
    label: 'Flexibler Anschluss',
    category: 'kanal',
    tagPrefix: 'FLX',
    w: 48, h: 44,
    norm: 'DIN EN 12792 — Kompensator / flexible Verbindung',
    keywords: ['flex', 'kompensator', 'schwingung', 'stutzen'],
    ports: airInOut(),
    params: [
      ...kanalParams(),
      num('laenge', 'Baulänge', 'mm', { group: 'Ausführung', step: 10, default: 200 }),
      sel('material', 'Material', ['Glasgewebe', 'Silikon', 'PVC-beschichtet', 'Edelstahlwellrohr'], { group: 'Ausführung' }),
      bool('brandverhalten', 'Nichtbrennbar (A2-s1,d0)', { group: 'Brandschutz' }),
    ],
    draw: (c) => {
      const teeth = 5
      const x0 = 8
      const x1 = c.w - 8
      const step = (x1 - x0) / teeth
      let top = `M0 10L${n(x0)} 10`
      let bot = `M0 34L${n(x0)} 34`
      for (let i = 0; i < teeth; i++) {
        top += `L${n(x0 + step * (i + 0.5))} 5L${n(x0 + step * (i + 1))} 10`
        bot += `L${n(x0 + step * (i + 0.5))} 39L${n(x0 + step * (i + 1))} 34`
      }
      top += `L${n(c.w)} 10`
      bot += `L${n(c.w)} 34`
      return <g><path d={top + bot} fill="none" stroke={c.t.line} strokeWidth={SW.outline} /></g>
    },
  },
  {
    id: 'kanal-strecke',
    label: 'Kanalstrecke',
    category: 'kanal',
    tagPrefix: 'KA',
    w: 64, h: 44,
    norm: 'DIN EN 12792 — gerades Kanalstück',
    keywords: ['kanal', 'strecke', 'gerade', 'rohr'],
    ports: airInOut(),
    params: [
      ...kanalParams(),
      num('laenge', 'Länge', 'm', { group: 'Ausführung', step: 0.1, showByDefault: true, short: 'L' }),
      num('geschwindigkeit', 'Strömungsgeschwindigkeit', 'm/s', { group: 'Auslegung', step: 0.1 }),
      bool('brandschutzbeschichtung', 'Brandschutzbekleidung', { group: 'Brandschutz' }),
    ],
    draw: (c) => (
      <g>
        <path d={`M0 10L${n(c.w)} 10M0 34L${n(c.w)} 34`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
      </g>
    ),
  },
  {
    id: 'kanal-verteiler',
    label: 'Verteilerkasten',
    category: 'kanal',
    tagPrefix: 'VK',
    w: 68, h: 56,
    norm: 'DIN EN 12792 — Sammel- und Verteilkasten',
    keywords: ['verteiler', 'plenum', 'sammelkasten', 'box'],
    ports: [
      { id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air', label: 'Eintritt' },
      { id: 'a1', rx: 1, ry: 0.24, dir: 'right', kind: 'air', label: 'Abgang 1' },
      { id: 'a2', rx: 1, ry: 0.5, dir: 'right', kind: 'air', label: 'Abgang 2' },
      { id: 'a3', rx: 1, ry: 0.76, dir: 'right', kind: 'air', label: 'Abgang 3' },
    ],
    params: [
      ...kanalParams(),
      num('abgaenge', 'Anzahl Abgänge', 'Stk', { group: 'Ausführung', step: 1, default: 3 }),
      bool('schalldaemmend', 'Schallgedämmte Ausführung', { group: 'Schall' }),
    ],
    draw: (c) => (
      <g>
        <rect x={4} y={4} width={n(c.w - 8)} height={n(c.h - 8)} rx={3} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M${n(c.w - 4)} ${n(c.h * 0.24)}L${n(c.w)} ${n(c.h * 0.24)}M${n(c.w - 4)} ${n(c.h * 0.5)}L${n(c.w)} ${n(c.h * 0.5)}M${n(c.w - 4)} ${n(c.h * 0.76)}L${n(c.w)} ${n(c.h * 0.76)}M0 ${n(c.h * 0.5)}L4 ${n(c.h * 0.5)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
      </g>
    ),
  },
  {
    id: 'wetterschutzgitter',
    label: 'Wetterschutzgitter',
    category: 'kanal',
    tagPrefix: 'WSG',
    w: 40, h: 52,
    norm: 'DIN EN 13030 — Wetterschutzgitter',
    keywords: ['wetterschutz', 'gitter', 'außenluft', 'fortluft', 'lamellen'],
    ports: airOut(),
    params: [
      pVolumenstrom(),
      pAbmessung({ placeholder: '1000 × 600 mm' }),
      num('freier_querschnitt', 'Freier Querschnitt', '%', { group: 'Auslegung', step: 1 }),
      num('v_anstroem', 'Anströmgeschwindigkeit', 'm/s', { group: 'Auslegung', step: 0.1, default: 2 }),
      sel('klasse_regen', 'Regenschutzklasse', ['A', 'B', 'C', 'D'], { group: 'Ausführung', hint: 'DIN EN 13030' }),
      sel('material', 'Werkstoff', ['Aluminium', 'Edelstahl', 'verzinkter Stahl'], { group: 'Ausführung', default: 'Aluminium' }),
      bool('vogelschutz', 'Vogel-/Insektenschutzgitter', { group: 'Ausführung', default: true }),
      pDruckverlust(),
    ],
    draw: (c) => {
      const rows = 5
      const items = []
      for (let i = 0; i < rows; i++) {
        const y = 6 + ((c.h - 12) / rows) * (i + 0.5)
        items.push(<path key={i} d={`M8 ${n(y + 4)}L${n(c.w - 6)} ${n(y - 4)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} strokeLinecap="round" />)
      }
      return (
        <g>
          <rect x={4} y={2} width={n(c.w - 8)} height={n(c.h - 4)} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          {items}
        </g>
      )
    },
  },
  {
    id: 'ansaughaube',
    label: 'Ansaug-/Wetterhaube',
    category: 'kanal',
    tagPrefix: 'AH',
    w: 56, h: 48,
    norm: 'DIN EN 12792 — Außenluftansaugung',
    keywords: ['haube', 'ansaugung', 'wetterhaube', 'dach'],
    ports: [{ id: 'out', rx: 0.5, ry: 1, dir: 'bottom', kind: 'air', label: 'Anschluss' }],
    params: [
      pVolumenstrom(),
      pAbmessung(),
      sel('lage', 'Anordnung', ['Dach', 'Fassade', 'Freistehend'], { group: 'Ausführung' }),
      num('hoehe_ueber_dach', 'Höhe über Dachfläche', 'm', { group: 'Ausführung', step: 0.1 }),
      bool('vogelschutz', 'Vogelschutzgitter', { group: 'Ausführung', default: true }),
      pDruckverlust(),
    ],
    draw: (c) => (
      <g>
        <path d={`M${n(c.w * 0.08)} 20L${n(c.w * 0.5)} 4L${n(c.w * 0.92)} 20`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} strokeLinejoin="round" />
        <path d={`M${n(c.w * 0.38)} 20L${n(c.w * 0.38)} ${n(c.h)}M${n(c.w * 0.62)} 20L${n(c.w * 0.62)} ${n(c.h)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M${n(c.w * 0.14)} 24L${n(c.w * 0.34)} 24M${n(c.w * 0.66)} 24L${n(c.w * 0.86)} 24`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={arrowHead(c.w * 0.5, 30, 90, 5)} fill={c.t.line} stroke="none" />
      </g>
    ),
  },
  {
    id: 'dachhaube-fortluft',
    label: 'Fortluftausblasung',
    category: 'kanal',
    tagPrefix: 'FA',
    w: 56, h: 48,
    norm: 'DIN EN 16798-3 — Fortluftführung',
    keywords: ['fortluft', 'ausblasung', 'dach', 'senkrecht'],
    ports: [{ id: 'in', rx: 0.5, ry: 1, dir: 'bottom', kind: 'air', label: 'Anschluss' }],
    params: [
      pVolumenstrom(),
      sel('ausblasrichtung', 'Ausblasrichtung', ['senkrecht nach oben', 'horizontal', 'schraeg'], { group: 'Ausführung', default: 'senkrecht nach oben' }),
      num('austrittsgeschwindigkeit', 'Austrittsgeschwindigkeit', 'm/s', { group: 'Auslegung', step: 0.5, default: 8 }),
      num('hoehe_ueber_dach', 'Höhe über Dachfläche', 'm', { group: 'Ausführung', step: 0.1, default: 1.5 }),
      num('abstand_ansaugung', 'Abstand zur Außenluftansaugung', 'm', { group: 'Hygiene', step: 0.5 }),
      sel('eta_kategorie', 'Abluftkategorie', ['ETA 1', 'ETA 2', 'ETA 3', 'ETA 4'], { group: 'Hygiene', hint: 'DIN EN 16798-3' }),
    ],
    draw: (c) => (
      <g>
        <path d={`M${n(c.w * 0.38)} ${n(c.h)}L${n(c.w * 0.38)} 16M${n(c.w * 0.62)} ${n(c.h)}L${n(c.w * 0.62)} 16`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M${n(c.w * 0.26)} 16L${n(c.w * 0.74)} 16`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={arrowHead(c.w * 0.5, 3, -90, 6)} fill={c.t.line} stroke="none" />
        <path d={`M${n(c.w * 0.5)} 16L${n(c.w * 0.5)} 8`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
      </g>
    ),
  },
  {
    id: 'brandschott',
    label: 'Wand-/Deckendurchführung',
    category: 'kanal',
    tagPrefix: 'SCH',
    w: 40, h: 56,
    norm: 'DIN 4102-11 / DIN EN 1366-3 — Abschottung',
    keywords: ['schott', 'durchführung', 'wand', 'brandabschnitt'],
    ports: airInOut(),
    params: [
      sel('feuerwiderstand', 'Feuerwiderstandsklasse', ['EI 30', 'EI 60', 'EI 90', 'EI 120'], { group: 'Brandschutz', default: 'EI 90', showByDefault: true, short: 'FW' }),
      sel('bauteil', 'Durchdrungenes Bauteil', ['Massivwand', 'Trockenbauwand', 'Massivdecke', 'Schacht'], { group: 'Brandschutz' }),
      txt('abschottung', 'Abschottungssystem', { group: 'Brandschutz', placeholder: 'Mineralwolle mit Brandschutzbeschichtung' }),
      txt('nachweis', 'Verwendbarkeitsnachweis', { group: 'Brandschutz', placeholder: 'abP / abZ / ETA' }),
    ],
    draw: (c) => {
      const b0 = c.h / 2 - 22
      return (
        <g>
          <rect x={n(c.w * 0.3)} y={0} width={n(c.w * 0.4)} height={n(c.h)} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.inner} />
          <path d={hatch(c.w * 0.3, 0, c.w * 0.4, c.h, 6, 60)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <path d={`M0 ${n(b0 + 12)}L${n(c.w)} ${n(b0 + 12)}M0 ${n(b0 + 32)}L${n(c.w)} ${n(b0 + 32)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        </g>
      )
    },
  },
  {
    id: 'kanal-endkappe',
    label: 'Kanalende / Blindkappe',
    category: 'kanal',
    tagPrefix: 'KE',
    w: 28, h: 44,
    norm: 'DIN EN 12792',
    keywords: ['ende', 'kappe', 'blind', 'abschluss'],
    ports: airIn(),
    params: [pAbmessung(), sel('form', 'Querschnittsform', KANALFORM, { group: 'Ausführung' }), bool('reserve', 'Als Reserveanschluss vorgesehen', { group: 'Ausführung' })],
    draw: (c) => (
      <g>
        <path d={`M0 10L18 10M0 34L18 34M18 10L18 34`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
      </g>
    ),
  },
  {
    id: 'anlagenschnittstelle',
    label: 'Schnittstelle / Anschluss bauseits',
    category: 'kanal',
    tagPrefix: 'SST',
    w: 60, h: 36,
    norm: 'DIN EN ISO 10628 — Schnittstellenkennzeichnung',
    keywords: ['schnittstelle', 'übergabe', 'bauseits', 'anschluss'],
    ports: airIn(),
    params: [
      txt('gegenstelle', 'Anschluss an', { group: 'Kennzeichnung', placeholder: 'z. B. Küche Halle 2' }),
      txt('gewerk', 'Zuständiges Gewerk', { group: 'Kennzeichnung' }),
      pVolumenstrom(),
      txt('blattverweis', 'Verweis auf Blatt', { group: 'Kennzeichnung' }),
    ],
    draw: (c) => (
      <g>
        <path d={`M0 0L${n(c.w - 12)} 0L${n(c.w)} ${n(c.h / 2)}L${n(c.w - 12)} ${n(c.h)}L0 ${n(c.h)}Z`} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <Glyph c={c} x={c.w * 0.42} y={c.h / 2} size={10}>SST</Glyph>
      </g>
    ),
  },
]

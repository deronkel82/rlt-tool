import type { PortDef, SymbolDef } from '../types'
import { Glyph, SW, arc, arrowHead, n } from '../draw'
import { bool, num, pAbmessung, pDruckverlust, pVolumenstrom, sel, txt } from '../params'

const left = (label = 'Kanalanschluss'): PortDef[] => [{ id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air', label }]
const top = (label = 'Kanalanschluss'): PortDef[] => [{ id: 'in', rx: 0.5, ry: 0, dir: 'top', kind: 'air', label }]

/** Kennwerte, die jeder Luftdurchlass braucht. */
const durchlassParams = () => [
  pVolumenstrom(),
  pAbmessung({ label: 'Nenngröße', placeholder: '625 × 625 mm bzw. Ø 200 mm' }),
  num('wurfweite', 'Wurfweite', 'm', { group: 'Auslegung', step: 0.1 }),
  num('v_raum', 'Raumluftgeschwindigkeit im Aufenthaltsbereich', 'm/s', { group: 'Auslegung', step: 0.01, default: 0.2 }),
  num('lpa', 'Schalldruckpegel', 'dB(A)', { group: 'Schall', step: 1, showByDefault: true, short: 'Lp' }),
  pDruckverlust(),
  sel('material', 'Werkstoff', ['Aluminium', 'Stahl pulverbeschichtet', 'Edelstahl', 'Kunststoff'], { group: 'Ausführung' }),
  txt('farbe', 'Farbton', { group: 'Ausführung', placeholder: 'RAL 9010' }),
  bool('anschlusskasten', 'Anschlusskasten', { group: 'Ausführung', default: true }),
  bool('drossel', 'Drosselvorrichtung', { group: 'Ausführung', default: true }),
]

export const durchlaesse: SymbolDef[] = [
  {
    id: 'durchlass-zuluft',
    label: 'Zuluftdurchlass',
    category: 'durchlaesse',
    tagPrefix: 'ZUD',
    w: 44, h: 44,
    norm: 'DIN EN 12792 — Luftaustritt in den Raum',
    keywords: ['zuluft', 'auslass', 'einblasung'],
    ports: left(),
    params: [...durchlassParams(), num('untertemperatur', 'Untertemperatur', 'K', { group: 'Auslegung', step: 0.5 })],
    draw: (c) => (
      <g>
        <path d={`M10 6L10 ${n(c.h - 6)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} />
        <path d={`M0 ${n(c.h / 2)}L10 ${n(c.h / 2)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M10 ${n(c.h / 2)}L${n(c.w - 6)} 8M10 ${n(c.h / 2)}L${n(c.w - 6)} ${n(c.h - 8)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={arrowHead(c.w - 4, 7, -28, 5) + arrowHead(c.w - 4, c.h - 7, 28, 5)} fill={c.t.line} stroke="none" />
      </g>
    ),
  },
  {
    id: 'durchlass-abluft',
    label: 'Abluftdurchlass',
    category: 'durchlaesse',
    tagPrefix: 'ABD',
    w: 44, h: 44,
    norm: 'DIN EN 12792 — Lufteintritt aus dem Raum',
    keywords: ['abluft', 'absaugung', 'einlass'],
    ports: left(),
    params: durchlassParams(),
    draw: (c) => (
      <g>
        <path d={`M10 6L10 ${n(c.h - 6)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} />
        <path d={`M0 ${n(c.h / 2)}L10 ${n(c.h / 2)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M10 ${n(c.h / 2)}L${n(c.w - 6)} 8M10 ${n(c.h / 2)}L${n(c.w - 6)} ${n(c.h - 8)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={arrowHead(13, c.h / 2 - 4, 208, 5) + arrowHead(13, c.h / 2 + 4, 152, 5)} fill={c.t.line} stroke="none" />
      </g>
    ),
  },
  {
    id: 'gitter-wand',
    label: 'Luftdurchlassgitter',
    category: 'durchlaesse',
    tagPrefix: 'GIT',
    w: 40, h: 48,
    norm: 'DIN EN 12792 — Gitter mit Lamellen',
    keywords: ['gitter', 'lamellen', 'wandgitter', 'lüftungsgitter'],
    ports: left(),
    params: [
      ...durchlassParams(),
      sel('lamellen', 'Lamellenanordnung', ['einreihig horizontal', 'einreihig vertikal', 'zweireihig verstellbar', 'feststehend'], { group: 'Ausführung' }),
      sel('funktion', 'Funktion', ['Zuluft', 'Abluft', 'Überströmung'], { group: 'Auslegung', default: 'Zuluft' }),
    ],
    draw: (c) => {
      const rows = 4
      const items = []
      for (let i = 0; i < rows; i++) {
        const y = 8 + ((c.h - 16) / (rows - 1)) * i
        items.push(<path key={i} d={`M14 ${n(y)}L${n(c.w - 5)} ${n(y)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />)
      }
      return (
        <g>
          <rect x={10} y={3} width={n(c.w - 13)} height={n(c.h - 6)} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={`M0 ${n(c.h / 2)}L10 ${n(c.h / 2)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          {items}
        </g>
      )
    },
  },
  {
    id: 'drallauslass',
    label: 'Drallauslass',
    category: 'durchlaesse',
    tagPrefix: 'DRA',
    w: 48, h: 48,
    norm: 'DIN EN 12792 — Deckenluftdurchlass mit Drallerzeugung',
    keywords: ['drall', 'decke', 'wirbel', 'mischlüftung'],
    ports: top(),
    params: [
      ...durchlassParams(),
      num('lamellen', 'Anzahl Drallelemente', 'Stk', { group: 'Ausführung', step: 1 }),
      bool('verstellbar', 'Lamellen verstellbar', { group: 'Ausführung' }),
      sel('einbau', 'Einbau', ['Deckeneinbau', 'Deckenaufbau', 'Rasterdecke'], { group: 'Ausführung', default: 'Rasterdecke' }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h / 2 + 2
      const r = 18
      const vanes = 8
      const items = []
      for (let i = 0; i < vanes; i++) {
        const a = (i * 360) / vanes
        items.push(<path key={i} d={arc(cx, cy, r * 0.78, a, a + 42)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />)
      }
      return (
        <g>
          <path d={`M${n(cx)} 0L${n(cx)} ${n(cy - r)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <circle cx={n(cx)} cy={n(cy)} r={r} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          {items}
          <circle cx={n(cx)} cy={n(cy)} r={r * 0.3} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        </g>
      )
    },
  },
  {
    id: 'deckenauslass',
    label: 'Deckenauslass / Tellerventil',
    category: 'durchlaesse',
    tagPrefix: 'DEC',
    w: 44, h: 44,
    norm: 'DIN EN 12792 — runder Deckenluftdurchlass',
    keywords: ['teller', 'decke', 'rund', 'ventil'],
    ports: top(),
    params: [
      ...durchlassParams(),
      sel('funktion', 'Funktion', ['Zuluft', 'Abluft'], { group: 'Auslegung', default: 'Zuluft' }),
      sel('bauart', 'Bauart', ['Tellerventil', 'Rundauslass', 'Kegelauslass'], { group: 'Ausführung' }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h / 2 + 2
      return (
        <g>
          <path d={`M${n(cx)} 0L${n(cx)} ${n(cy - 16)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <circle cx={n(cx)} cy={n(cy)} r={16} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <circle cx={n(cx)} cy={n(cy)} r={10} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <circle cx={n(cx)} cy={n(cy)} r={4} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        </g>
      )
    },
  },
  {
    id: 'weitwurfduese',
    label: 'Weitwurfdüse',
    category: 'durchlaesse',
    tagPrefix: 'WWD',
    w: 48, h: 40,
    norm: 'DIN EN 12792 — Düsenluftdurchlass',
    keywords: ['düse', 'weitwurf', 'halle', 'kugeldüse'],
    ports: left(),
    params: [
      ...durchlassParams(),
      num('schwenkbereich', 'Schwenkbereich', '°', { group: 'Ausführung', step: 5, default: 30 }),
      num('austrittsgeschwindigkeit', 'Austrittsgeschwindigkeit', 'm/s', { group: 'Auslegung', step: 0.5 }),
      bool('motorisch', 'Motorisch schwenkbar', { group: 'MSR' }),
    ],
    draw: (c) => {
      const cy = c.h / 2
      return (
        <g>
          <path d={`M0 ${n(cy)}L12 ${n(cy)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={`M12 ${n(cy - 11)}L${n(c.w - 16)} ${n(cy - 6)}L${n(c.w - 16)} ${n(cy + 6)}L12 ${n(cy + 11)}Z`} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={`M${n(c.w - 16)} ${n(cy - 6)}L${n(c.w - 4)} ${n(cy - 10)}M${n(c.w - 16)} ${n(cy + 6)}L${n(c.w - 4)} ${n(cy + 10)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <path d={arrowHead(c.w - 2, cy, 0, 5)} fill={c.t.line} stroke="none" />
        </g>
      )
    },
  },
  {
    id: 'quellauslass',
    label: 'Quellluftauslass',
    category: 'durchlaesse',
    tagPrefix: 'QLA',
    w: 44, h: 52,
    norm: 'DIN EN 12792 — Quelllüftung mit geringer Impulsströmung',
    keywords: ['quellluft', 'verdrängung', 'säule', 'impulsarm'],
    ports: [{ id: 'in', rx: 0.5, ry: 1, dir: 'bottom', kind: 'air', label: 'Kanalanschluss' }],
    params: [
      ...durchlassParams(),
      num('austrittsgeschwindigkeit', 'Austrittsgeschwindigkeit', 'm/s', { group: 'Auslegung', step: 0.05, default: 0.2 }),
      num('untertemperatur', 'Untertemperatur', 'K', { group: 'Auslegung', step: 0.5, default: 2 }),
      num('nahzone', 'Nahzone', 'm', { group: 'Auslegung', step: 0.1 }),
      sel('bauform', 'Bauform', ['Halbrundsäule', 'Viertelkreissäule', 'Flachbauform', 'Bodenintegriert'], { group: 'Ausführung' }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      return (
        <g>
          <path d={`M${n(cx - 14)} ${n(c.h - 4)}L${n(cx - 14)} 16A14 14 0 0 1 ${n(cx + 14)} 16L${n(cx + 14)} ${n(c.h - 4)}Z`} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={`M${n(cx - 9)} 22L${n(cx - 9)} ${n(c.h - 10)}M${n(cx)} 18L${n(cx)} ${n(c.h - 10)}M${n(cx + 9)} 22L${n(cx + 9)} ${n(c.h - 10)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <path d={arrowHead(cx - 20, c.h - 14, 180, 4) + arrowHead(cx + 20, c.h - 14, 0, 4)} fill={c.t.line} stroke="none" />
        </g>
      )
    },
  },
  {
    id: 'schlitzdurchlass',
    label: 'Schlitzdurchlass',
    category: 'durchlaesse',
    tagPrefix: 'SLD',
    w: 64, h: 32,
    norm: 'DIN EN 12792 — linienförmiger Luftdurchlass',
    keywords: ['schlitz', 'linie', 'band', 'fassade'],
    ports: [{ id: 'in', rx: 0.5, ry: 0, dir: 'top', kind: 'air', label: 'Kanalanschluss' }],
    params: [
      ...durchlassParams(),
      num('schlitze', 'Anzahl Schlitze', 'Stk', { group: 'Ausführung', step: 1, default: 2 }),
      num('laenge', 'Baulänge', 'm', { group: 'Ausführung', step: 0.1 }),
      bool('verstellbar', 'Ausblasrichtung verstellbar', { group: 'Ausführung', default: true }),
    ],
    draw: (c) => (
      <g>
        <path d={`M${n(c.w / 2)} 0L${n(c.w / 2)} 8`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <rect x={4} y={8} width={n(c.w - 8)} height={n(c.h - 14)} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M9 ${n(c.h * 0.44)}L${n(c.w - 9)} ${n(c.h * 0.44)}M9 ${n(c.h * 0.66)}L${n(c.w - 9)} ${n(c.h * 0.66)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} />
      </g>
    ),
  },
  {
    id: 'bodenauslass',
    label: 'Bodendrallauslass',
    category: 'durchlaesse',
    tagPrefix: 'BOD',
    w: 44, h: 44,
    norm: 'DIN EN 12792 — Bodenluftdurchlass',
    keywords: ['boden', 'doppelboden', 'drall', 'rechenzentrum'],
    ports: [{ id: 'in', rx: 0.5, ry: 1, dir: 'bottom', kind: 'air', label: 'Doppelbodenanschluss' }],
    params: [
      ...durchlassParams(),
      sel('bauart', 'Bauart', ['Drallauslass', 'Gitterplatte', 'Quellauslass'], { group: 'Ausführung' }),
      bool('begehbar', 'Begehbar / befahrbar', { group: 'Ausführung', default: true }),
      bool('schmutzfang', 'Schmutzfangkorb', { group: 'Wartung', default: true }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h / 2 - 2
      const items = []
      for (let i = 0; i < 8; i++) {
        const a = (i * 360) / 8
        items.push(<path key={i} d={arc(cx, cy, 12, a, a + 38)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />)
      }
      return (
        <g>
          <path d={`M${n(cx)} ${n(c.h)}L${n(cx)} ${n(cy + 16)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <circle cx={n(cx)} cy={n(cy)} r={16} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          {items}
        </g>
      )
    },
  },
  {
    id: 'ueberstroemelement',
    label: 'Überströmelement',
    category: 'durchlaesse',
    tagPrefix: 'UEE',
    w: 44, h: 40,
    norm: 'DIN EN 12792 — Überströmung zwischen Räumen',
    keywords: ['überström', 'türgitter', 'türspalt', 'kaskade'],
    ports: [
      { id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air', label: 'Raum A' },
      { id: 'out', rx: 1, ry: 0.5, dir: 'right', kind: 'air', label: 'Raum B' },
    ],
    params: [
      pVolumenstrom(),
      sel('bauart', 'Bauart', ['Türgitter', 'Türspalt', 'Überströmschalldämpfer', 'Mauerkasten'], { group: 'Ausführung', default: 'Überströmschalldämpfer' }),
      pAbmessung(),
      num('freier_querschnitt', 'Freier Querschnitt', 'cm²', { group: 'Auslegung', step: 10 }),
      num('lpa', 'Schalldruckpegel', 'dB(A)', { group: 'Schall', step: 1 }),
      num('dnew', 'Normschallpegeldifferenz', 'dB', { group: 'Schall', step: 1 }),
      pDruckverlust(),
    ],
    draw: (c) => (
      <g>
        <rect x={9} y={6} width={n(c.w - 18)} height={n(c.h - 12)} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M14 ${n(c.h * 0.38)}L${n(c.w - 14)} ${n(c.h * 0.38)}M14 ${n(c.h * 0.62)}L${n(c.w - 14)} ${n(c.h * 0.62)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M0 ${n(c.h / 2)}L9 ${n(c.h / 2)}M${n(c.w - 9)} ${n(c.h / 2)}L${n(c.w)} ${n(c.h / 2)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={arrowHead(c.w - 1, c.h / 2, 0, 4.5)} fill={c.t.line} stroke="none" />
      </g>
    ),
  },
  {
    id: 'laminarfeld',
    label: 'Laminarfeld (TAV)',
    category: 'durchlaesse',
    tagPrefix: 'TAV',
    w: 92, h: 44,
    norm: 'DIN 1946-4 — turbulenzarme Verdrängungsströmung',
    keywords: ['laminar', 'op', 'tav', 'reinraum', 'krankenhaus'],
    ports: top(),
    params: [
      pVolumenstrom(),
      pAbmessung({ label: 'Feldgröße', placeholder: '3200 × 3200 mm' }),
      num('austrittsgeschwindigkeit', 'Austrittsgeschwindigkeit', 'm/s', { group: 'Auslegung', step: 0.01, default: 0.23 }),
      sel('raumklasse', 'Raumklasse', ['Raumklasse Ia (DIN 1946-4)', 'Raumklasse Ib (DIN 1946-4)', 'Raumklasse II (DIN 1946-4)'], { group: 'Auslegung', default: 'Raumklasse Ia (DIN 1946-4)' }),
      sel('filterstufe', 'Endständige Filterstufe', ['H13', 'H14', 'U15'], { group: 'Hygiene', default: 'H14' }),
      num('schutzgrad', 'Schutzgrad', '—', { group: 'Prüfung', step: 0.1 }),
      num('lpa', 'Schalldruckpegel', 'dB(A)', { group: 'Schall', step: 1 }),
    ],
    draw: (c) => {
      const arrows = []
      for (let i = 0; i < 7; i++) {
        const x = 10 + ((c.w - 20) / 6) * i
        arrows.push(<path key={i} d={`M${n(x)} 20L${n(x)} ${n(c.h - 8)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />)
        arrows.push(<path key={`a${i}`} d={arrowHead(x, c.h - 4, 90, 4)} fill={c.t.line} stroke="none" />)
      }
      return (
        <g>
          <path d={`M${n(c.w / 2)} 0L${n(c.w / 2)} 6`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <rect x={4} y={6} width={n(c.w - 8)} height={14} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          {arrows}
        </g>
      )
    },
  },
  {
    id: 'induktionsdurchlass',
    label: 'Induktionsdurchlass',
    category: 'durchlaesse',
    tagPrefix: 'IND',
    w: 60, h: 44,
    norm: 'DIN EN 12792 — Induktionsgerät',
    keywords: ['induktion', 'sekundärluft', 'fassade'],
    ports: [
      { id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air', label: 'Primärluft' },
      { id: 'vl', rx: 0.3, ry: 1, dir: 'bottom', kind: 'fluid', label: 'Vorlauf' },
      { id: 'rl', rx: 0.7, ry: 1, dir: 'bottom', kind: 'fluid', label: 'Rücklauf' },
    ],
    params: [
      pVolumenstrom({ label: 'Primärluftvolumenstrom' }),
      num('induktionsverhaeltnis', 'Induktionsverhältnis', '—', { group: 'Auslegung', step: 0.1 }),
      num('kuehlleistung', 'Kühlleistung', 'W', { group: 'Auslegung', step: 10 }),
      num('heizleistung', 'Heizleistung', 'W', { group: 'Auslegung', step: 10 }),
      num('lpa', 'Schalldruckpegel', 'dB(A)', { group: 'Schall', step: 1 }),
      pDruckverlust(),
    ],
    draw: (c) => (
      <g>
        <rect x={6} y={6} width={n(c.w - 12)} height={n(c.h - 12)} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M0 ${n(c.h / 2)}L6 ${n(c.h / 2)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M12 ${n(c.h - 12)}L${n(c.w - 12)} 12`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M14 12L${n(c.w * 0.42)} 12M14 ${n(c.h - 12)}L${n(c.w * 0.42)} ${n(c.h - 12)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        <Glyph c={c} x={c.w * 0.74} y={c.h - 14} size={9}>I</Glyph>
      </g>
    ),
  },
  {
    id: 'kuehlbalken',
    label: 'Kühlbalken',
    category: 'durchlaesse',
    tagPrefix: 'KB',
    w: 72, h: 40,
    norm: 'DIN EN 15116 — aktiver/passiver Kühlbalken',
    keywords: ['kühlbalken', 'chilled beam', 'kühldecke'],
    ports: [
      { id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air', label: 'Primärluft' },
      { id: 'vl', rx: 0.32, ry: 0, dir: 'top', kind: 'fluid', label: 'Kaltwasser Vorlauf' },
      { id: 'rl', rx: 0.68, ry: 0, dir: 'top', kind: 'fluid', label: 'Kaltwasser Rücklauf' },
    ],
    params: [
      sel('bauart', 'Bauart', ['aktiv (mit Primärluft)', 'passiv'], { group: 'Ausführung', default: 'aktiv (mit Primärluft)' }),
      pVolumenstrom({ label: 'Primärluftvolumenstrom' }),
      num('kuehlleistung', 'Kühlleistung', 'W', { group: 'Auslegung', step: 10, showByDefault: true, short: 'Q' }),
      num('heizleistung', 'Heizleistung', 'W', { group: 'Auslegung', step: 10 }),
      num('t_vl', 'Kaltwasser Vorlauf', '°C', { group: 'Medium', step: 0.5, default: 16 }),
      num('laenge', 'Baulänge', 'm', { group: 'Ausführung', step: 0.1 }),
      num('lpa', 'Schalldruckpegel', 'dB(A)', { group: 'Schall', step: 1 }),
      bool('taupunktwaechter', 'Taupunktwächter', { group: 'MSR', default: true }),
    ],
    draw: (c) => (
      <g>
        <rect x={6} y={10} width={n(c.w - 12)} height={n(c.h - 20)} rx={3} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M0 ${n(c.h / 2)}L6 ${n(c.h / 2)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M${n(c.w * 0.32)} 0L${n(c.w * 0.32)} 10M${n(c.w * 0.68)} 0L${n(c.w * 0.68)} 10`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M12 ${n(c.h / 2)}L${n(c.w - 12)} ${n(c.h / 2)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} strokeDasharray="4 3" />
        <path d={arrowHead(c.w * 0.3, c.h - 4, 90, 4) + arrowHead(c.w * 0.7, c.h - 4, 90, 4)} fill={c.t.line} stroke="none" />
      </g>
    ),
  },
  {
    id: 'textilluftverteiler',
    label: 'Textilluftverteiler',
    category: 'durchlaesse',
    tagPrefix: 'TLV',
    w: 76, h: 36,
    norm: 'DIN EN 12792 — Luftverteilung über Gewebeschlauch',
    keywords: ['textil', 'schlauch', 'gewebe', 'halle', 'lebensmittel'],
    ports: [{ id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air', label: 'Kanalanschluss' }],
    params: [
      pVolumenstrom(),
      num('durchmesser', 'Durchmesser', 'mm', { group: 'Ausführung', step: 10 }),
      num('laenge', 'Länge', 'm', { group: 'Ausführung', step: 0.5, showByDefault: true, short: 'L' }),
      sel('ausstroemung', 'Ausströmart', ['Mikroperforation', 'Düsen', 'Schlitze', 'Kombination'], { group: 'Ausführung' }),
      sel('material', 'Gewebe', ['Polyester permeabel', 'Polyester impermeabel', 'Antistatisch', 'Lebensmittelecht'], { group: 'Ausführung' }),
      bool('waschbar', 'Waschbar', { group: 'Hygiene', default: true }),
      pDruckverlust(),
    ],
    draw: (c) => {
      const cy = c.h / 2
      const holes = []
      for (let i = 0; i < 8; i++) {
        const x = 14 + ((c.w - 26) / 7) * i
        holes.push(<path key={i} d={arrowHead(x, c.h - 3, 90, 3.5)} fill={c.t.line} stroke="none" />)
      }
      return (
        <g>
          <path d={`M0 ${n(cy)}L8 ${n(cy)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <rect x={8} y={n(cy - 11)} width={n(c.w - 12)} height={22} rx={11} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          {holes}
        </g>
      )
    },
  },
  {
    id: 'dunstabzugshaube',
    label: 'Dunstabzugshaube',
    category: 'durchlaesse',
    tagPrefix: 'DAH',
    w: 76, h: 48,
    norm: 'VDI 2052 — Küchenlufttechnik',
    keywords: ['küche', 'haube', 'dunst', 'fett', 'gastronomie'],
    ports: [{ id: 'out', rx: 0.5, ry: 0, dir: 'top', kind: 'air', label: 'Abluftanschluss' }],
    params: [
      pVolumenstrom({ label: 'Abluftvolumenstrom' }),
      num('zuluft', 'Zuluftvolumenstrom', 'm³/h', { group: 'Auslegung', step: 10 }),
      sel('bauart', 'Bauart', ['Wandhaube', 'Inselhaube', 'Deckenlüftungssystem', 'Induktionshaube'], { group: 'Ausführung' }),
      pAbmessung({ placeholder: '2400 × 1100 mm' }),
      sel('filter', 'Aerosolabscheider', ['Labyrinthfilter', 'Zyklonabscheider', 'Elektrostatisch'], { group: 'Ausführung' }),
      num('abscheidegrad', 'Abscheidegrad', '%', { group: 'Auslegung', step: 1 }),
      bool('uv', 'UV-Geruchsreduktion', { group: 'Hygiene' }),
      bool('feuerloeschung', 'Löschanlage integriert', { group: 'Brandschutz' }),
      num('lpa', 'Schalldruckpegel', 'dB(A)', { group: 'Schall', step: 1 }),
    ],
    draw: (c) => (
      <g>
        <path d={`M${n(c.w / 2)} 0L${n(c.w / 2)} 8`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={`M4 ${n(c.h - 6)}L14 8L${n(c.w - 14)} 8L${n(c.w - 4)} ${n(c.h - 6)}`} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} strokeLinejoin="round" />
        <path d={`M14 ${n(c.h - 14)}L${n(c.w - 14)} ${n(c.h - 14)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M${n(c.w * 0.3)} ${n(c.h - 14)}L${n(c.w * 0.36)} ${n(c.h - 22)}M${n(c.w * 0.46)} ${n(c.h - 14)}L${n(c.w * 0.52)} ${n(c.h - 22)}M${n(c.w * 0.62)} ${n(c.h - 14)}L${n(c.w * 0.68)} ${n(c.h - 22)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
      </g>
    ),
  },
]

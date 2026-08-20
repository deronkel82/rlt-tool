import type { SymbolDef } from '../types'
import { Box, Glyph, SW, arc, arrowHead, n } from '../draw'
import { airDual } from '../ports'
import { bool, num, pDruckverlust, pLeistung, sel, txt } from '../params'

const DW = 76
const DH = 68

/** Gemeinsame Kennwerte aller Wärmerückgewinner. */
const wrgParams = () => [
  num('rueckwaermzahl', 'Rückwärmzahl (trocken)', '%', { group: 'Auslegung', step: 1, max: 100, showByDefault: true, short: 'η' }),
  num('rueckfeuchtzahl', 'Rückfeuchtzahl', '%', { group: 'Auslegung', step: 1, max: 100 }),
  pLeistung('Übertragungsleistung', { showByDefault: false }),
  num('v_zul', 'Volumenstrom Zuluftseite', 'm³/h', { group: 'Auslegung', step: 10 }),
  num('v_abl', 'Volumenstrom Abluftseite', 'm³/h', { group: 'Auslegung', step: 10 }),
  pDruckverlust({ label: 'Druckverlust Zuluftseite' }),
  num('dp_abl', 'Druckverlust Abluftseite', 'Pa', { group: 'Auslegung', step: 5 }),
  sel('effizienzklasse', 'Effizienzklasse WRG', ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'], { group: 'Energie', hint: 'DIN EN 13053' }),
  bool('erp', 'Erfüllt VO (EU) 1253/2014', { group: 'Energie', default: true }),
]

export const wrg: SymbolDef[] = [
  {
    id: 'wrg-platten',
    label: 'Plattenwärmeübertrager (Kreuzstrom)',
    category: 'wrg',
    tagPrefix: 'WRG',
    w: DW, h: DH,
    norm: 'DIN EN 12792 — Rechteck mit gekreuzten Diagonalen',
    keywords: ['kreuzstrom', 'platten', 'rekuperator'],
    ports: airDual(),
    params: [
      ...wrgParams(),
      sel('material', 'Plattenwerkstoff', ['Aluminium', 'Aluminium beschichtet', 'Edelstahl', 'Kunststoff'], { group: 'Ausführung' }),
      bool('bypass', 'Bypassklappe vorhanden', { group: 'Ausführung', default: true }),
      bool('kondensatablauf', 'Kondensatablauf mit Siphon', { group: 'Ausführung', default: true }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path d={`M0 0L${n(c.w)} ${n(c.h)}M0 ${n(c.h)}L${n(c.w)} 0`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
      </g>
    ),
  },
  {
    id: 'wrg-gegenstrom',
    label: 'Gegenstrom-Plattenwärmeübertrager',
    category: 'wrg',
    tagPrefix: 'WRG',
    w: DW, h: DH,
    norm: 'DIN EN 12792 — Rechteck mit gegenläufigen Strömungswegen',
    keywords: ['gegenstrom', 'platten', 'hoher wirkungsgrad'],
    ports: airDual(),
    params: [
      ...wrgParams(),
      sel('material', 'Plattenwerkstoff', ['Aluminium', 'Aluminium beschichtet', 'Edelstahl', 'Kunststoff'], { group: 'Ausführung' }),
      bool('bypass', 'Bypassklappe vorhanden', { group: 'Ausführung', default: true }),
      bool('kondensatablauf', 'Kondensatablauf mit Siphon', { group: 'Ausführung', default: true }),
    ],
    draw: (c) => {
      const y1 = c.h * 0.28
      const y2 = c.h * 0.72
      return (
        <g>
          <Box c={c} />
          <path d={`M5 ${n(y1)}L${n(c.w - 5)} ${n(y1)}M5 ${n(y2)}L${n(c.w - 5)} ${n(y2)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <path d={arrowHead(c.w - 8, y1, 0, 5) + arrowHead(8, y2, 180, 5)} fill={c.t.line} stroke="none" />
          <path d={`M${n(c.w * 0.5)} ${n(y1)}L${n(c.w * 0.5)} ${n(y2)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} strokeDasharray="3 3" />
        </g>
      )
    },
  },
  {
    id: 'wrg-rotation',
    label: 'Rotationswärmeübertrager',
    category: 'wrg',
    tagPrefix: 'WRG',
    w: DW, h: DH,
    norm: 'DIN EN 12792 — Rechteck mit Rotor',
    keywords: ['rotor', 'regenerator', 'sorption', 'enthalpie'],
    ports: airDual(),
    params: [
      ...wrgParams(),
      sel('rotortyp', 'Rotortyp', ['Kondensationsrotor', 'Enthalpierotor (hygroskopisch)', 'Sorptionsrotor'], { group: 'Ausführung', default: 'Kondensationsrotor' }),
      num('drehzahl', 'Rotordrehzahl', '1/min', { group: 'Ausführung', step: 1, default: 10 }),
      sel('regelung', 'Leistungsregelung', ['Drehzahlregelung', 'Ein/Aus'], { group: 'MSR', default: 'Drehzahlregelung' }),
      bool('spuelzone', 'Spülzone vorhanden', { group: 'Hygiene', hint: 'Begrenzt die Leckluftrate zwischen Abluft und Zuluft' }),
      num('leckluft', 'Leckluftrate', '%', { group: 'Hygiene', step: 0.1 }),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h / 2
      const r = Math.min(c.w, c.h) * 0.36
      return (
        <g>
          <Box c={c} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <path d={`M${n(cx)} 0L${n(cx)} ${n(cy - r)}M${n(cx)} ${n(cy + r)}L${n(cx)} ${n(c.h)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <path d={arc(cx, cy, r * 0.55, -150, 60)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <path d={arrowHead(cx + Math.cos((60 * Math.PI) / 180) * r * 0.55, cy + Math.sin((60 * Math.PI) / 180) * r * 0.55, 150, 4)} fill={c.t.line} stroke="none" />
        </g>
      )
    },
  },
  {
    id: 'wrg-kvs',
    label: 'Kreislaufverbundsystem',
    category: 'wrg',
    tagPrefix: 'WRG',
    w: 108, h: DH,
    norm: 'DIN EN 12792 — zwei Register mit Zwischenkreislauf',
    keywords: ['kvs', 'kreislaufverbund', 'sole', 'getrennt'],
    ports: [
      { id: 'in1', rx: 0, ry: 0.24, dir: 'left', kind: 'air', label: 'Außenluft Eintritt' },
      { id: 'out1', rx: 1, ry: 0.24, dir: 'right', kind: 'air', label: 'Zuluft Austritt' },
      { id: 'in2', rx: 1, ry: 0.76, dir: 'right', kind: 'air', label: 'Abluft Eintritt' },
      { id: 'out2', rx: 0, ry: 0.76, dir: 'left', kind: 'air', label: 'Fortluft Austritt' },
    ],
    params: [
      ...wrgParams(),
      txt('medium', 'Wärmeträger', { group: 'Medium', default: 'Wasser-Glykol 34 %' }),
      num('v_medium', 'Medienvolumenstrom', 'm³/h', { group: 'Medium', step: 0.1 }),
      num('pumpenleistung', 'Pumpenleistung', 'kW', { group: 'Medium', step: 0.05 }),
      bool('getrennt', 'Vollständige Stofftrennung', { group: 'Hygiene', default: true, hint: 'Erforderlich bei DIN 1946-4 und Abluft der Kategorie ETA 3/4' }),
    ],
    draw: (c) => {
      const rw = 26
      const rh = 22
      const y1 = c.h * 0.24 - rh / 2
      const y2 = c.h * 0.76 - rh / 2
      const x = (c.w - rw) / 2
      const cyP = c.h / 2
      return (
        <g>
          <rect x={0} y={0} width={c.w} height={c.h} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} strokeDasharray="6 4" />
          <rect x={n(x)} y={n(y1)} width={rw} height={rh} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.inner} />
          <path d={`M${n(x + 2)} ${n(y1 + rh - 2)}L${n(x + rw - 2)} ${n(y1 + 2)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <rect x={n(x)} y={n(y2)} width={rw} height={rh} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.inner} />
          <path d={`M${n(x + 2)} ${n(y2 + 2)}L${n(x + rw - 2)} ${n(y2 + rh - 2)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <path d={`M${n(x + 6)} ${n(y1 + rh)}L${n(x + 6)} ${n(y2)}M${n(x + rw - 6)} ${n(y1 + rh)}L${n(x + rw - 6)} ${n(cyP - 6)}M${n(x + rw - 6)} ${n(cyP + 6)}L${n(x + rw - 6)} ${n(y2)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <circle cx={n(x + rw - 6)} cy={n(cyP)} r={6} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.hair} />
          <path d={`M${n(x + rw - 9)} ${n(cyP - 4)}L${n(x + rw - 9)} ${n(cyP + 4)}L${n(x + rw - 1)} ${n(cyP)}Z`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <path d={`M5 ${n(c.h * 0.24)}L${n(x)} ${n(c.h * 0.24)}M${n(x + rw)} ${n(c.h * 0.24)}L${n(c.w - 5)} ${n(c.h * 0.24)}M5 ${n(c.h * 0.76)}L${n(x)} ${n(c.h * 0.76)}M${n(x + rw)} ${n(c.h * 0.76)}L${n(c.w - 5)} ${n(c.h * 0.76)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        </g>
      )
    },
  },
  {
    id: 'wrg-waermerohr',
    label: 'Wärmerohr (Heat-Pipe)',
    category: 'wrg',
    tagPrefix: 'WRG',
    w: DW, h: DH,
    norm: 'DIN EN 12792 — Rohrbündel mit Trennebene',
    keywords: ['heatpipe', 'wärmerohr', 'thermosiphon'],
    ports: airDual(),
    params: [
      ...wrgParams(),
      txt('kaeltemittel', 'Arbeitsmittel', { group: 'Medium', default: 'R134a' }),
      num('rohre', 'Anzahl Rohrreihen', 'Stk', { group: 'Ausführung', step: 1 }),
      bool('kippbar', 'Neigungsverstellung zur Leistungsregelung', { group: 'MSR' }),
    ],
    draw: (c) => {
      const cols = 5
      const paths: string[] = []
      for (let i = 0; i < cols; i++) {
        const x = ((i + 1) * c.w) / (cols + 1)
        paths.push(`M${n(x)} 6L${n(x)} ${n(c.h - 6)}`)
      }
      return (
        <g>
          <Box c={c} />
          <path d={`M0 ${n(c.h / 2)}L${n(c.w)} ${n(c.h / 2)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} />
          <path d={paths.join('')} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        </g>
      )
    },
  },
  {
    id: 'wrg-regenerator',
    label: 'Umschaltregenerator',
    category: 'wrg',
    tagPrefix: 'WRG',
    w: DW, h: DH,
    norm: 'DIN EN 12792 — regenerativer Wärmeübertrager',
    keywords: ['regenerator', 'speichermasse', 'pendellüftung'],
    ports: airDual(),
    params: [
      ...wrgParams(),
      num('umschaltzeit', 'Umschaltintervall', 's', { group: 'MSR', step: 5, default: 70 }),
      sel('speichermasse', 'Speichermasse', ['Keramik', 'Aluminium', 'Kunststoff'], { group: 'Ausführung' }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <rect x={n(c.w * 0.32)} y={6} width={n(c.w * 0.36)} height={n(c.h - 12)} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M${n(c.w * 0.4)} 6L${n(c.w * 0.4)} ${n(c.h - 6)}M${n(c.w * 0.5)} 6L${n(c.w * 0.5)} ${n(c.h - 6)}M${n(c.w * 0.6)} 6L${n(c.w * 0.6)} ${n(c.h - 6)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        <path d={arrowHead(c.w - 7, c.h * 0.24, 0, 4.5) + arrowHead(7, c.h * 0.76, 180, 4.5)} fill={c.t.line} stroke="none" />
      </g>
    ),
  },
  {
    id: 'wrg-bypass',
    label: 'WRG-Bypass',
    category: 'wrg',
    tagPrefix: 'BYP',
    w: 72, h: 56,
    norm: 'DIN EN 12792 — Umgehungsleitung mit Klappe',
    keywords: ['bypass', 'umgehung', 'sommerbetrieb', 'freie kühlung'],
    ports: [
      { id: 'in', rx: 0, ry: 0.8, dir: 'left', kind: 'air', label: 'Eintritt' },
      { id: 'out', rx: 1, ry: 0.8, dir: 'right', kind: 'air', label: 'Austritt' },
    ],
    params: [
      num('anteil', 'Bypassanteil', '%', { group: 'Auslegung', step: 5, max: 100 }),
      sel('regelung', 'Ansteuerung', ['stetig (0–10 V)', 'Auf/Zu', 'temperaturgefuehrt'], { group: 'MSR', default: 'stetig (0–10 V)' }),
      bool('freie_kuehlung', 'Freie Kühlung im Sommerbetrieb', { group: 'Energie', default: true }),
    ],
    draw: (c) => {
      const yb = c.h * 0.8
      const yt = c.h * 0.22
      return (
        <g>
          <path d={`M0 ${n(yb)}L${n(c.w)} ${n(yb)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={`M${n(c.w * 0.16)} ${n(yb)}L${n(c.w * 0.28)} ${n(yt)}L${n(c.w * 0.72)} ${n(yt)}L${n(c.w * 0.84)} ${n(yb)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={`M${n(c.w * 0.44)} ${n(yt - 7)}L${n(c.w * 0.56)} ${n(yt + 7)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} strokeLinecap="round" />
          <circle cx={n(c.w * 0.5)} cy={n(yt)} r={1.8} fill={c.t.line} stroke="none" />
          <Glyph c={c} x={c.w * 0.5} y={yb - 9} size={9}>Bypass</Glyph>
        </g>
      )
    },
  },
]

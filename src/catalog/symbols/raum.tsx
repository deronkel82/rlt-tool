import type { PortDef, SymbolDef } from '../types'
import { Glyph, SW, arrowHead, hatch, n } from '../draw'
import {
  DRUCKHALTUNG, IDA_KLASSEN, NUTZUNGSARTEN, ODA_KLASSEN,
  bool, calc, mlt, num, round, sel, toNum, txt,
} from '../params'

/** Anschlüsse an allen vier Seiten, je getrennt fuer Zu- und Abluft. */
const raumPorts = (): PortDef[] => [
  { id: 'zul_w', rx: 0, ry: 0.32, dir: 'left', kind: 'air', label: 'Zuluft links' },
  { id: 'abl_w', rx: 0, ry: 0.68, dir: 'left', kind: 'air', label: 'Abluft links' },
  { id: 'zul_e', rx: 1, ry: 0.32, dir: 'right', kind: 'air', label: 'Zuluft rechts' },
  { id: 'abl_e', rx: 1, ry: 0.68, dir: 'right', kind: 'air', label: 'Abluft rechts' },
  { id: 'zul_n', rx: 0.32, ry: 0, dir: 'top', kind: 'air', label: 'Zuluft oben' },
  { id: 'abl_n', rx: 0.68, ry: 0, dir: 'top', kind: 'air', label: 'Abluft oben' },
  { id: 'zul_s', rx: 0.32, ry: 1, dir: 'bottom', kind: 'air', label: 'Zuluft unten' },
  { id: 'abl_s', rx: 0.68, ry: 1, dir: 'bottom', kind: 'air', label: 'Abluft unten' },
]

export const raum: SymbolDef[] = [
  {
    id: 'nutzungseinheit',
    label: 'Nutzungseinheit',
    category: 'raum',
    tagPrefix: 'RAUM',
    w: 200, h: 132,
    resizable: true,
    minW: 96, minH: 64,
    layer: 'background',
    norm: 'DIN EN 16798-1 — versorgter Raum mit Auslegungsdaten',
    keywords: ['raum', 'halle', 'büro', 'zone', 'nutzung', 'bereich'],
    ports: raumPorts(),
    params: [
      txt('raumname', 'Raumbezeichnung', { group: 'Raum', default: 'Halle', showByDefault: false, placeholder: 'z. B. Montagehalle Nord' }),
      txt('raumnummer', 'Raumnummer', { group: 'Raum', placeholder: 'z. B. 1.OG-014' }),
      sel('nutzung', 'Nutzungsart', NUTZUNGSARTEN, { group: 'Raum', default: 'Produktionshalle' }),
      num('flaeche', 'Grundfläche', 'm²', { group: 'Geometrie', step: 1, min: 0 }),
      num('hoehe', 'Lichte Höhe', 'm', { group: 'Geometrie', step: 0.1, min: 0, default: 3 }),
      calc('volumen', 'Raumvolumen', 'm³', (p) => {
        const a = toNum(p.flaeche)
        const h = toNum(p.hoehe)
        return a !== null && h !== null ? round(a * h, 1) : null
      }, { group: 'Geometrie' }),
      num('personen', 'Personenzahl', 'Pers.', { group: 'Nutzung', step: 1, min: 0 }),
      calc('belegungsdichte', 'Fläche je Person', 'm²/Pers.', (p) => {
        const a = toNum(p.flaeche)
        const per = toNum(p.personen)
        return a !== null && per ? round(a / per, 1) : null
      }, { group: 'Nutzung' }),
      txt('betriebszeit', 'Betriebszeit', { group: 'Nutzung', placeholder: 'Mo–Fr 06:00–18:00' }),

      num('v_zul', 'Zuluftvolumenstrom', 'm³/h', { group: 'Luftmengen', step: 10, min: 0, showByDefault: true, short: 'ZUL' }),
      num('v_abl', 'Abluftvolumenstrom', 'm³/h', { group: 'Luftmengen', step: 10, min: 0, showByDefault: true, short: 'ABL' }),
      calc('bilanz', 'Luftbilanz', 'm³/h', (p) => {
        const z = toNum(p.v_zul)
        const a = toNum(p.v_abl)
        return z !== null && a !== null ? round(z - a, 0) : null
      }, { group: 'Luftmengen', hint: 'Positiv bedeutet Überdruck im Raum' }),
      calc('luftwechsel', 'Luftwechselrate', '1/h', (p) => {
        const z = toNum(p.v_zul)
        const a = toNum(p.flaeche)
        const h = toNum(p.hoehe)
        const v = a !== null && h !== null ? a * h : null
        return z !== null && v ? round(z / v, 1) : null
      }, { group: 'Luftmengen', showByDefault: true, short: 'LW' }),
      calc('aul_pro_person', 'Außenluft je Person', 'm³/(h·Pers.)', (p) => {
        const z = toNum(p.v_zul)
        const per = toNum(p.personen)
        return z !== null && per ? round(z / per, 0) : null
      }, { group: 'Luftmengen', hint: 'Richtwerte nach DIN EN 16798-1' }),
      calc('flaechenbezogen', 'Flächenbezogener Volumenstrom', 'm³/(h·m²)', (p) => {
        const z = toNum(p.v_zul)
        const a = toNum(p.flaeche)
        return z !== null && a ? round(z / a, 1) : null
      }, { group: 'Luftmengen' }),

      num('t_soll_winter', 'Solltemperatur Winter', '°C', { group: 'Raumkonditionen', step: 0.5, default: 20 }),
      num('t_soll_sommer', 'Solltemperatur Sommer', '°C', { group: 'Raumkonditionen', step: 0.5, default: 26 }),
      num('rf_soll', 'Sollfeuchte', '% r. F.', { group: 'Raumkonditionen', step: 1, max: 100 }),
      sel('druckhaltung', 'Druckhaltung', DRUCKHALTUNG, { group: 'Raumkonditionen', default: 'Gleichdruck' }),
      num('druckdifferenz', 'Druckdifferenz zur Umgebung', 'Pa', { group: 'Raumkonditionen', step: 1 }),
      sel('ida', 'Raumluftqualitätsklasse', IDA_KLASSEN, { group: 'Raumkonditionen', default: 'IDA 2 - mittlere Qualität', hint: 'DIN EN 16798-1' }),
      sel('oda', 'Außenluftqualität', ODA_KLASSEN, { group: 'Raumkonditionen', hint: 'DIN EN 16798-3' }),
      num('co2_soll', 'CO₂-Grenzwert', 'ppm', { group: 'Raumkonditionen', step: 50 }),

      num('lp_zul', 'Zulässiger Schalldruckpegel', 'dB(A)', { group: 'Schall', step: 1 }),
      num('kuehllast', 'Kühllast', 'kW', { group: 'Lasten', step: 0.1 }),
      num('heizlast', 'Heizlast', 'kW', { group: 'Lasten', step: 0.1 }),
      num('feuchtelast', 'Feuchtelast', 'kg/h', { group: 'Lasten', step: 0.1 }),

      sel('raumklasse', 'Besondere Anforderung', ['keine', 'Raumklasse Ia (DIN 1946-4)', 'Raumklasse Ib (DIN 1946-4)', 'Raumklasse II (DIN 1946-4)', 'Reinraum ISO 5', 'Reinraum ISO 7', 'Reinraum ISO 8', 'Ex-Bereich Zone 1', 'Ex-Bereich Zone 2'], { group: 'Sonderanforderung', default: 'keine' }),
      sel('brandabschnitt', 'Brandabschnitt', ['—', 'BA 1', 'BA 2', 'BA 3', 'BA 4'], { group: 'Sonderanforderung' }),
      bool('entrauchung', 'Maschinelle Entrauchung erforderlich', { group: 'Sonderanforderung' }),
      mlt('hinweis', 'Hinweise', { group: 'Sonderanforderung', placeholder: 'Mehrzeilige Notizen zum Raum' }),
    ],
    draw: (c) => {
      const name = typeof c.p.raumname === 'string' && c.p.raumname ? c.p.raumname : 'Nutzungseinheit'
      const nutzung = typeof c.p.nutzung === 'string' ? c.p.nutzung : ''
      const flaeche = toNum(c.p.flaeche)
      const hoehe = toNum(c.p.hoehe)
      const teile: string[] = []
      if (flaeche !== null) teile.push(`${flaeche.toLocaleString('de-DE')} m²`)
      if (hoehe !== null) teile.push(`${hoehe.toLocaleString('de-DE')} m`)
      const masse = teile.join(' · ')
      return (
        <g>
          <rect x={0} y={0} width={c.w} height={c.h} rx={3} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.bold} />
          <rect x={4} y={4} width={n(c.w - 8)} height={n(c.h - 8)} rx={2} fill="none" stroke={c.t.line} strokeWidth={SW.hair} strokeDasharray="2 4" />
          <Glyph c={c} x={10} y={16} size={13} anchor="start">{name}</Glyph>
          {nutzung ? <Glyph c={c} x={10} y={30} size={10} weight={400} anchor="start" color={c.t.muted}>{nutzung}</Glyph> : null}
          {masse ? <Glyph c={c} x={10} y={c.h - 13} size={10} weight={400} anchor="start" color={c.t.muted}>{masse}</Glyph> : null}
        </g>
      )
    },
  },
  {
    id: 'lueftungszone',
    label: 'Lüftungszone',
    category: 'raum',
    tagPrefix: 'ZONE',
    w: 240, h: 160,
    resizable: true,
    minW: 96, minH: 64,
    layer: 'background',
    norm: 'DIN EN 16798-3 — Zoneneinteilung',
    keywords: ['zone', 'bereich', 'abschnitt', 'gruppe'],
    ports: [],
    params: [
      txt('zonenname', 'Zonenbezeichnung', { group: 'Zone', default: 'Zone 1' }),
      txt('geschoss', 'Geschoss', { group: 'Zone' }),
      num('flaeche', 'Zonenfläche', 'm²', { group: 'Zone', step: 1 }),
      num('v_zul', 'Zuluftvolumenstrom', 'm³/h', { group: 'Zone', step: 10, showByDefault: true, short: 'ZUL' }),
      num('v_abl', 'Abluftvolumenstrom', 'm³/h', { group: 'Zone', step: 10 }),
      sel('regelung', 'Zonenregelung', ['Konstantvolumenstrom', 'Variabler Volumenstrom', 'Bedarfsgeführt (CO₂)', 'Zeitprogramm'], { group: 'MSR' }),
      txt('brandabschnitt', 'Brandabschnitt', { group: 'Brandschutz' }),
    ],
    draw: (c) => {
      const name = typeof c.p.zonenname === 'string' && c.p.zonenname ? c.p.zonenname : 'Zone'
      return (
        <g>
          <rect x={0} y={0} width={c.w} height={c.h} rx={6} fill="none" stroke={c.t.muted} strokeWidth={SW.inner} strokeDasharray="10 6" />
          <Glyph c={c} x={10} y={15} size={11} anchor="start" color={c.t.muted}>{name}</Glyph>
        </g>
      )
    },
  },
  {
    id: 'aussenluftfassung',
    label: 'Außenluftfassung',
    category: 'raum',
    tagPrefix: 'AUL',
    w: 52, h: 44,
    norm: 'DIN EN 16798-3 — Außenluftansaugung',
    keywords: ['außenluft', 'ansaugung', 'aul', 'oda', 'quelle'],
    ports: [{ id: 'out', rx: 1, ry: 0.5, dir: 'right', kind: 'air', label: 'Außenluft' }],
    params: [
      num('volumenstrom', 'Volumenstrom', 'm³/h', { group: 'Auslegung', step: 10, showByDefault: true, short: 'V̇' }),
      sel('oda', 'Außenluftqualität', ODA_KLASSEN, { group: 'Auslegung', default: 'ODA 2', hint: 'DIN EN 16798-3' }),
      num('hoehe', 'Ansaughöhe über Gelände', 'm', { group: 'Ausführung', step: 0.5, default: 3 }),
      num('abstand_fortluft', 'Abstand zur Fortluft', 'm', { group: 'Hygiene', step: 0.5 }),
      txt('lage', 'Lage der Ansaugung', { group: 'Ausführung', placeholder: 'Nordfassade, schattig' }),
      num('t_ausl_winter', 'Auslegungstemperatur Winter', '°C', { group: 'Auslegung', step: 0.5, default: -12 }),
      num('t_ausl_sommer', 'Auslegungstemperatur Sommer', '°C', { group: 'Auslegung', step: 0.5, default: 32 }),
    ],
    draw: (c) => (
      <g>
        <path d={`M0 ${n(c.h)}L0 6L${n(c.w * 0.6)} 6`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} />
        <path d={hatch(-1, 6, 8, c.h - 6, 6, 60)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        <path d={`M${n(c.w * 0.18)} ${n(c.h * 0.62)}L${n(c.w - 8)} ${n(c.h * 0.62)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={arrowHead(c.w - 2, c.h * 0.62, 0, 6)} fill={c.t.line} stroke="none" />
        <Glyph c={c} x={c.w * 0.55} y={c.h * 0.62 - 10} size={10}>AUL</Glyph>
      </g>
    ),
  },
  {
    id: 'fortluftausblasung',
    label: 'Fortluft ins Freie',
    category: 'raum',
    tagPrefix: 'FOL',
    w: 52, h: 44,
    norm: 'DIN EN 16798-3 — Fortluftführung',
    keywords: ['fortluft', 'fol', 'eha', 'senke', 'ausblasung'],
    ports: [{ id: 'in', rx: 0, ry: 0.5, dir: 'left', kind: 'air', label: 'Fortluft' }],
    params: [
      num('volumenstrom', 'Volumenstrom', 'm³/h', { group: 'Auslegung', step: 10, showByDefault: true, short: 'V̇' }),
      sel('eta', 'Abluftkategorie', ['ETA 1', 'ETA 2', 'ETA 3', 'ETA 4'], { group: 'Hygiene', default: 'ETA 2', hint: 'DIN EN 16798-3' }),
      num('hoehe', 'Ausblashöhe über Dach', 'm', { group: 'Ausführung', step: 0.5, default: 1.5 }),
      num('abstand_ansaugung', 'Abstand zur Außenluftansaugung', 'm', { group: 'Hygiene', step: 0.5 }),
      bool('wiedereintritt', 'Wiedereintritt ausgeschlossen', { group: 'Hygiene', default: true }),
    ],
    draw: (c) => (
      <g>
        <path d={`M${n(c.w)} ${n(c.h)}L${n(c.w)} 6L${n(c.w * 0.4)} 6`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} />
        <path d={hatch(c.w - 7, 6, 8, c.h - 6, 6, 60)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        <path d={`M8 ${n(c.h * 0.62)}L${n(c.w * 0.82)} ${n(c.h * 0.62)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
        <path d={arrowHead(c.w * 0.88, c.h * 0.62, 0, 6)} fill={c.t.line} stroke="none" />
        <Glyph c={c} x={c.w * 0.45} y={c.h * 0.62 - 10} size={10}>FOL</Glyph>
      </g>
    ),
  },
  {
    id: 'textfeld',
    label: 'Textfeld',
    category: 'raum',
    tagPrefix: 'TXT',
    w: 168, h: 48,
    resizable: true,
    minW: 40, minH: 20,
    norm: '—',
    keywords: ['text', 'notiz', 'beschriftung', 'kommentar'],
    ports: [],
    params: [
      mlt('text', 'Text', { group: 'Text', default: 'Hinweis', placeholder: 'Mehrzeiliger Text' }),
      num('schriftgroesse', 'Schriftgröße', 'pt', { group: 'Text', step: 1, default: 13, min: 7, max: 48 }),
      sel('ausrichtung', 'Ausrichtung', ['links', 'zentriert', 'rechts'], { group: 'Text', default: 'links' }),
      bool('rahmen', 'Rahmen zeichnen', { group: 'Text' }),
    ],
    draw: (c) => {
      const raw = typeof c.p.text === 'string' ? c.p.text : ''
      const size = toNum(c.p.schriftgroesse) ?? 13
      const align = c.p.ausrichtung === 'zentriert' ? 'middle' : c.p.ausrichtung === 'rechts' ? 'end' : 'start'
      const x = align === 'middle' ? c.w / 2 : align === 'end' ? c.w - 6 : 6
      const lines = raw.split('\n')
      return (
        <g>
          {c.p.rahmen ? <rect x={0} y={0} width={c.w} height={c.h} rx={2} fill="none" stroke={c.t.line} strokeWidth={SW.inner} /> : null}
          {lines.map((line, i) => (
            <Glyph key={i} c={c} x={x} y={size * 1.1 + i * size * 1.35} size={size} weight={400} anchor={align as 'start' | 'middle' | 'end'} baseline="auto">
              {line}
            </Glyph>
          ))}
        </g>
      )
    },
  },
  {
    id: 'anlagenrahmen',
    label: 'Bereichsrahmen',
    category: 'raum',
    tagPrefix: 'BER',
    w: 280, h: 180,
    resizable: true,
    minW: 80, minH: 60,
    layer: 'background',
    norm: '—',
    keywords: ['rahmen', 'bereich', 'gruppe', 'technikzentrale'],
    ports: [],
    params: [
      txt('titel', 'Bereichsbezeichnung', { group: 'Bereich', default: 'Technikzentrale' }),
      sel('linie', 'Linienart', ['durchgezogen', 'gestrichelt', 'strichpunktiert'], { group: 'Bereich', default: 'strichpunktiert' }),
      txt('bemerkung_bereich', 'Bemerkung', { group: 'Bereich' }),
    ],
    draw: (c) => {
      const titel = typeof c.p.titel === 'string' ? c.p.titel : ''
      const dash = c.p.linie === 'durchgezogen' ? undefined : c.p.linie === 'gestrichelt' ? '8 5' : '14 4 3 4'
      return (
        <g>
          <rect x={0} y={0} width={c.w} height={c.h} rx={4} fill="none" stroke={c.t.line} strokeWidth={SW.inner} strokeDasharray={dash} />
          {titel ? <Glyph c={c} x={10} y={15} size={11} anchor="start" color={c.t.muted}>{titel}</Glyph> : null}
        </g>
      )
    },
  },
]

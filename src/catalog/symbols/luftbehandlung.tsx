import type { SymbolDef } from '../types'
import { Box, Glyph, SW, arc, arrowHead, coil, dots, hatch, n, spiral, waveH, zigzagV } from '../draw'
import { airDual, airInOut, fluidBelow } from '../ports'
import {
  ANTRIEBSART, ENERGIEEFFIZIENZ, FILTERKLASSEN_1822, FILTERKLASSEN_16890, REGELUNG, SCHUTZART,
  bool, num, pAbmessung, pAnzahl, pDruckverlust, pLeistung, pSchallleistung, pVolumenstrom, sel, txt,
} from '../params'

const W = 64
const H = 44
const FAN = 48

/** Förderrichtungsdreieck im Ventilatorkreis (DIN EN 12792). */
function fanTriangle(cx: number, cy: number, r: number): string {
  return `M${n(cx - r * 0.52)} ${n(cy - r * 0.66)}L${n(cx - r * 0.52)} ${n(cy + r * 0.66)}L${n(cx + r * 0.8)} ${n(cy)}Z`
}

export const luftbehandlung: SymbolDef[] = [
  {
    id: 'ventilator',
    label: 'Ventilator',
    category: 'luftbehandlung',
    tagPrefix: 'VENT',
    w: FAN, h: FAN,
    norm: 'DIN EN 12792 — Kreis mit Förderrichtungsdreieck',
    keywords: ['lüfter', 'fan', 'gebläse'],
    ports: airInOut(),
    params: [
      pVolumenstrom(),
      num('pressung', 'Externe Pressung', 'Pa', { group: 'Auslegung', step: 10, showByDefault: true, short: 'dp' }),
      sel('bauart', 'Bauart', ['Radialventilator', 'Axialventilator', 'Diagonalventilator', 'Querstromventilator'], { group: 'Ausführung', default: 'Radialventilator' }),
      sel('laufrad', 'Laufrad', ['rückwärtsgekrümmt', 'vorwärtsgekrümmt', 'freilaufend'], { group: 'Ausführung' }),
      sel('antrieb', 'Antrieb', ANTRIEBSART, { group: 'Ausführung', default: 'Direktantrieb' }),
      sel('regelung', 'Drehzahlregelung', REGELUNG, { group: 'Ausführung', default: 'EC-Motor' }),
      num('motorleistung', 'Motornennleistung', 'kW', { group: 'Elektro', step: 0.1 }),
      num('drehzahl', 'Drehzahl', '1/min', { group: 'Elektro', step: 10 }),
      num('stromaufnahme', 'Stromaufnahme', 'A', { group: 'Elektro', step: 0.1 }),
      sel('schutzart', 'Schutzart', SCHUTZART, { group: 'Elektro' }),
      num('wirkungsgrad', 'Gesamtwirkungsgrad', '%', { group: 'Energie', step: 1, max: 100 }),
      sel('sfp', 'SFP-Kategorie', ['SFP 1', 'SFP 2', 'SFP 3', 'SFP 4', 'SFP 5', 'SFP 6', 'SFP 7'], { group: 'Energie', hint: 'Spezifische Ventilatorleistung nach DIN EN 16798-3' }),
      pSchallleistung(),
      bool('schwingungsdaempfer', 'Schwingungsdämpfer', { group: 'Ausführung', default: true }),
    ],
    draw: (c) => {
      const r = Math.min(c.w, c.h) / 2 - SW.outline / 2
      const cx = c.w / 2
      const cy = c.h / 2
      return (
        <g>
          <circle cx={cx} cy={cy} r={r} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={fanTriangle(cx, cy, r)} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        </g>
      )
    },
  },
  {
    id: 'ventilator-radial',
    label: 'Radialventilator',
    category: 'luftbehandlung',
    tagPrefix: 'VENT',
    w: FAN, h: FAN,
    norm: 'DIN EN 12792 — Spiralgehäuse',
    keywords: ['radial', 'spirale', 'schnecke'],
    ports: airInOut(),
    params: [
      pVolumenstrom(),
      num('pressung', 'Externe Pressung', 'Pa', { group: 'Auslegung', step: 10, showByDefault: true, short: 'dp' }),
      sel('laufrad', 'Laufrad', ['rückwärtsgekrümmt', 'vorwärtsgekrümmt', 'freilaufend'], { group: 'Ausführung', default: 'rückwärtsgekrümmt' }),
      sel('antrieb', 'Antrieb', ANTRIEBSART, { group: 'Ausführung', default: 'Direktantrieb' }),
      sel('regelung', 'Drehzahlregelung', REGELUNG, { group: 'Ausführung', default: 'EC-Motor' }),
      num('motorleistung', 'Motornennleistung', 'kW', { group: 'Elektro', step: 0.1 }),
      num('drehzahl', 'Drehzahl', '1/min', { group: 'Elektro', step: 10 }),
      pSchallleistung(),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h / 2
      const r = Math.min(c.w, c.h) / 2 - SW.outline / 2
      return (
        <g>
          <circle cx={cx} cy={cy} r={r} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={spiral(cx, cy, r * 0.28, r * 0.86, 1, 150)} fill="none" stroke={c.t.line} strokeWidth={SW.inner} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={r * 0.16} fill={c.t.line} stroke="none" />
        </g>
      )
    },
  },
  {
    id: 'ventilator-axial',
    label: 'Axialventilator',
    category: 'luftbehandlung',
    tagPrefix: 'VENT',
    w: FAN, h: FAN,
    norm: 'DIN EN 12792 — Nabe mit Laufradflügeln',
    keywords: ['axial', 'propeller'],
    ports: airInOut(),
    params: [
      pVolumenstrom(),
      num('pressung', 'Externe Pressung', 'Pa', { group: 'Auslegung', step: 10, showByDefault: true, short: 'dp' }),
      sel('regelung', 'Drehzahlregelung', REGELUNG, { group: 'Ausführung', default: 'EC-Motor' }),
      num('motorleistung', 'Motornennleistung', 'kW', { group: 'Elektro', step: 0.1 }),
      bool('umkehrbar', 'Förderrichtung umkehrbar', { group: 'Ausführung' }),
      pSchallleistung(),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const cy = c.h / 2
      const r = Math.min(c.w, c.h) / 2 - SW.outline / 2
      const hub = r * 0.2
      const blade = (dir: 1 | -1) =>
        `M${n(cx)} ${n(cy + dir * hub)}L${n(cx - r * 0.72)} ${n(cy + dir * r * 0.5)}L${n(cx + r * 0.72)} ${n(cy + dir * r * 0.5)}Z`
      return (
        <g>
          <circle cx={cx} cy={cy} r={r} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={blade(1)} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <path d={blade(-1)} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <circle cx={cx} cy={cy} r={hub} fill={c.t.line} stroke="none" />
        </g>
      )
    },
  },
  {
    id: 'ventilator-dach',
    label: 'Dachventilator',
    category: 'luftbehandlung',
    tagPrefix: 'VENT',
    w: 56, h: 48,
    norm: 'DIN EN 12792',
    keywords: ['dach', 'aufsatz', 'fortluft'],
    ports: [{ id: 'in', rx: 0.5, ry: 1, dir: 'bottom', kind: 'air', label: 'Lufteintritt' }],
    params: [
      pVolumenstrom(),
      num('pressung', 'Externe Pressung', 'Pa', { group: 'Auslegung', step: 10 }),
      sel('bauart', 'Bauart', ['Radial, horizontal ausblasend', 'Radial, vertikal ausblasend', 'Axial'], { group: 'Ausführung' }),
      sel('regelung', 'Drehzahlregelung', REGELUNG, { group: 'Ausführung', default: 'EC-Motor' }),
      num('motorleistung', 'Motornennleistung', 'kW', { group: 'Elektro', step: 0.1 }),
      bool('entrauchung', 'Entrauchungstauglich', { group: 'Brandschutz', hint: 'F200/F300/F400 nach DIN EN 12101-3' }),
      pSchallleistung(),
    ],
    draw: (c) => {
      const cx = c.w / 2
      const r = 14
      const cy = 18
      return (
        <g>
          <path d={`M${n(cx - 22)} ${n(c.h)}L${n(cx - 22)} ${n(c.h - 8)}L${n(cx + 22)} ${n(c.h - 8)}L${n(cx + 22)} ${n(c.h)}`} fill="none" stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={`M${n(cx - 18)} ${n(c.h - 8)}L${n(cx - 13)} ${n(cy + r * 0.7)}M${n(cx + 18)} ${n(c.h - 8)}L${n(cx + 13)} ${n(cy + r * 0.7)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          <circle cx={cx} cy={cy} r={r} fill={c.t.fill} stroke={c.t.line} strokeWidth={SW.outline} />
          <path d={fanTriangle(cx, cy, r)} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        </g>
      )
    },
  },
  {
    id: 'filter',
    label: 'Luftfilter',
    category: 'luftbehandlung',
    tagPrefix: 'FIL',
    w: W, h: H,
    norm: 'DIN EN 12792 — Rechteck mit Strichlinie quer zur Strömung',
    keywords: ['filter', 'staub'],
    ports: airInOut(),
    params: [
      sel('filterklasse', 'Filterklasse', FILTERKLASSEN_16890, { group: 'Auslegung', default: 'ISO ePM1 60 %', showByDefault: true, short: 'Kl.', hint: 'Klassifizierung nach DIN EN ISO 16890' }),
      sel('bauart', 'Bauart', ['Taschenfilter', 'Kompaktfilter', 'Panelfilter', 'Zylinderfilter', 'Rollbandfilter'], { group: 'Ausführung', default: 'Taschenfilter' }),
      pVolumenstrom({ showByDefault: false }),
      pAbmessung({ placeholder: '592 x 592 x 535 mm' }),
      pAnzahl(),
      num('dp_anfang', 'Anfangsdruckverlust', 'Pa', { group: 'Auslegung', step: 5 }),
      num('dp_end', 'Enddruckverlust', 'Pa', { group: 'Auslegung', step: 10, default: 250 }),
      sel('effizienz', 'Energieeffizienzklasse', ['A+', 'A', 'B', 'C', 'D', 'E'], { group: 'Energie', hint: 'Eurovent 4/21' }),
      bool('dp_ueberwachung', 'Differenzdrucküberwachung', { group: 'MSR', default: true }),
      bool('hygiene', 'Hygieneausführung VDI 6022', { group: 'Hygiene', default: true }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path d={`M${n(c.w / 2)} 0L${n(c.w / 2)} ${n(c.h)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} strokeDasharray="4 3" />
      </g>
    ),
  },
  {
    id: 'filter-tasche',
    label: 'Taschenfilter',
    category: 'luftbehandlung',
    tagPrefix: 'FIL',
    w: W, h: H,
    norm: 'DIN EN ISO 16890',
    keywords: ['tasche', 'beutel'],
    ports: airInOut(),
    params: [
      sel('filterklasse', 'Filterklasse', FILTERKLASSEN_16890, { group: 'Auslegung', default: 'ISO ePM1 60 %', showByDefault: true, short: 'Kl.' }),
      num('taschen', 'Anzahl Taschen', 'Stk', { group: 'Ausführung', step: 1 }),
      num('taschentiefe', 'Taschentiefe', 'mm', { group: 'Ausführung', step: 10 }),
      pAbmessung({ placeholder: '592 x 592 x 535 mm' }),
      pAnzahl(),
      num('dp_anfang', 'Anfangsdruckverlust', 'Pa', { group: 'Auslegung', step: 5 }),
      num('dp_end', 'Enddruckverlust', 'Pa', { group: 'Auslegung', step: 10, default: 250 }),
      bool('dp_ueberwachung', 'Differenzdrucküberwachung', { group: 'MSR', default: true }),
    ],
    draw: (c) => {
      const x0 = c.w * 0.3
      const x1 = c.w - 4
      const pockets = 4
      const gap = c.h / (pockets + 1)
      const paths: string[] = []
      for (let i = 1; i <= pockets; i++) {
        const y = gap * i
        paths.push(`M${n(x0)} ${n(y - 3.4)}L${n(x1)} ${n(y - 1)}L${n(x1)} ${n(y + 1)}L${n(x0)} ${n(y + 3.4)}`)
      }
      return (
        <g>
          <Box c={c} />
          <path d={`M${n(x0)} 0L${n(x0)} ${n(c.h)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} strokeDasharray="4 3" />
          <path d={paths.join('')} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        </g>
      )
    },
  },
  {
    id: 'filter-kompakt',
    label: 'Kompaktfilter',
    category: 'luftbehandlung',
    tagPrefix: 'FIL',
    w: W, h: H,
    norm: 'DIN EN ISO 16890',
    keywords: ['kompakt', 'falten', 'patrone'],
    ports: airInOut(),
    params: [
      sel('filterklasse', 'Filterklasse', FILTERKLASSEN_16890, { group: 'Auslegung', default: 'ISO ePM1 70 %', showByDefault: true, short: 'Kl.' }),
      pAbmessung({ placeholder: '592 x 592 x 292 mm' }),
      pAnzahl(),
      num('dp_anfang', 'Anfangsdruckverlust', 'Pa', { group: 'Auslegung', step: 5 }),
      num('dp_end', 'Enddruckverlust', 'Pa', { group: 'Auslegung', step: 10, default: 300 }),
      bool('dp_ueberwachung', 'Differenzdrucküberwachung', { group: 'MSR', default: true }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path d={zigzagV(c.w / 2, 3, c.h - 3, 5, 5)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
      </g>
    ),
  },
  {
    id: 'filter-schwebstoff',
    label: 'Schwebstofffilter',
    category: 'luftbehandlung',
    tagPrefix: 'FIL',
    w: W, h: H,
    norm: 'DIN EN 1822 — HEPA/ULPA',
    keywords: ['hepa', 'ulpa', 'endstufe', 'reinraum'],
    ports: airInOut(),
    params: [
      sel('filterklasse', 'Filterklasse', FILTERKLASSEN_1822, { group: 'Auslegung', default: 'H13', showByDefault: true, short: 'Kl.' }),
      num('abscheidegrad', 'Abscheidegrad (MPPS)', '%', { group: 'Auslegung', step: 0.001 }),
      pAbmessung({ placeholder: '610 x 610 x 292 mm' }),
      pAnzahl(),
      num('dp_anfang', 'Anfangsdruckverlust', 'Pa', { group: 'Auslegung', step: 5 }),
      num('dp_end', 'Enddruckverlust', 'Pa', { group: 'Auslegung', step: 10, default: 450 }),
      bool('lecktest', 'Vor-Ort-Lecktest DIN EN ISO 14644-3', { group: 'Prüfung', default: true }),
      bool('dp_ueberwachung', 'Differenzdrucküberwachung', { group: 'MSR', default: true }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path
          d={`M${n(c.w * 0.38)} 0L${n(c.w * 0.38)} ${n(c.h)}M${n(c.w * 0.62)} 0L${n(c.w * 0.62)} ${n(c.h)}`}
          fill="none" stroke={c.t.line} strokeWidth={SW.inner} strokeDasharray="4 3"
        />
      </g>
    ),
  },
  {
    id: 'filter-aktivkohle',
    label: 'Aktivkohlefilter',
    category: 'luftbehandlung',
    tagPrefix: 'FIL',
    w: W, h: H,
    norm: 'DIN EN 12792 — Adsorptionsfilter',
    keywords: ['geruch', 'adsorption', 'kohle', 'voc'],
    ports: airInOut(),
    params: [
      sel('bauart', 'Bauart', ['Patronenfilter', 'Kassettenfilter', 'Schüttung'], { group: 'Ausführung' }),
      num('kohlemasse', 'Kohlemasse', 'kg', { group: 'Auslegung', step: 1 }),
      num('kontaktzeit', 'Kontaktzeit', 's', { group: 'Auslegung', step: 0.01 }),
      txt('schadstoff', 'Zielschadstoff', { group: 'Auslegung', placeholder: 'z. B. Lösemittel, Geruch' }),
      pDruckverlust(),
      pAbmessung(),
      pAnzahl(),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        {dots(c, 6, 5, c.w - 12, c.h - 10, 7, 1.3)}
      </g>
    ),
  },
  {
    id: 'filter-metall',
    label: 'Metallgewebefilter',
    category: 'luftbehandlung',
    tagPrefix: 'FIL',
    w: W, h: H,
    norm: 'DIN EN 12792 — Fett-/Vorfilter',
    keywords: ['fettfilter', 'küche', 'gewebe', 'grob'],
    ports: airInOut(),
    params: [
      sel('bauart', 'Bauart', ['Metallgewebefilter', 'Flammschutzfilter', 'Aerosolabscheider'], { group: 'Ausführung' }),
      num('abscheidegrad', 'Abscheidegrad', '%', { group: 'Auslegung', step: 1 }),
      pDruckverlust(),
      pAbmessung(),
      pAnzahl(),
      bool('spuelmaschine', 'Spülmaschinengeeignet', { group: 'Ausführung', default: true }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path d={hatch(5, 4, c.w - 10, c.h - 8, 6, 45) + hatch(5, 4, c.w - 10, c.h - 8, 6, -45)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
      </g>
    ),
  },
  {
    id: 'erhitzer',
    label: 'Lufterhitzer',
    category: 'luftbehandlung',
    tagPrefix: 'ERH',
    w: W, h: H,
    norm: 'DIN EN 12792 — Rechteck mit ansteigender Diagonale',
    keywords: ['heizregister', 'vorerhitzer', 'nacherhitzer', 'wärme'],
    ports: [...airInOut(), ...fluidBelow()],
    params: [
      sel('medium', 'Heizmedium', ['Warmwasser (PWW)', 'Heißwasser', 'Dampf', 'Elektro', 'Kältemittel'], { group: 'Auslegung', default: 'Warmwasser (PWW)' }),
      pLeistung('Heizleistung', { showByDefault: true, short: 'Q' }),
      num('t_luft_ein', 'Lufteintrittstemperatur', '°C', { group: 'Auslegung', step: 0.5 }),
      num('t_luft_aus', 'Luftaustrittstemperatur', '°C', { group: 'Auslegung', step: 0.5, showByDefault: true, short: 'tA' }),
      num('t_vl', 'Medium Vorlauf', '°C', { group: 'Medium', step: 1, default: 70 }),
      num('t_rl', 'Medium Rücklauf', '°C', { group: 'Medium', step: 1, default: 50 }),
      num('v_medium', 'Medienvolumenstrom', 'm³/h', { group: 'Medium', step: 0.01 }),
      pDruckverlust({ label: 'Druckverlust Luft' }),
      num('dp_medium', 'Druckverlust Medium', 'kPa', { group: 'Medium', step: 1 }),
      sel('lamellen', 'Lamellenwerkstoff', ['Aluminium', 'Kupfer', 'beschichtet'], { group: 'Ausführung' }),
      num('reihen', 'Rohrreihen', 'Stk', { group: 'Ausführung', step: 1 }),
      bool('frostschutz', 'Frostschutzüberwachung', { group: 'MSR', default: true }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path d={`M4 ${n(c.h - 4)}L${n(c.w - 4)} 4`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'erhitzer-elektro',
    label: 'Elektro-Lufterhitzer',
    category: 'luftbehandlung',
    tagPrefix: 'ERH',
    w: W, h: H,
    norm: 'DIN EN 12792',
    keywords: ['elektro', 'heizregister', 'ptc'],
    ports: airInOut(),
    params: [
      pLeistung('Heizleistung', { showByDefault: true, short: 'Q' }),
      num('stufen', 'Regelstufen', 'Stk', { group: 'Ausführung', step: 1 }),
      sel('regelung', 'Regelung', ['Stufenschaltung', 'Thyristorsteller', 'Pulspaket'], { group: 'MSR' }),
      num('spannung', 'Spannung', 'V', { group: 'Elektro', default: 400 }),
      num('t_luft_aus', 'Luftaustrittstemperatur', '°C', { group: 'Auslegung', step: 0.5 }),
      bool('stroemungswaechter', 'Strömungswächter', { group: 'MSR', default: true }),
      bool('sicherheitstb', 'Sicherheitstemperaturbegrenzer', { group: 'MSR', default: true }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path d={`M4 ${n(c.h - 4)}L${n(c.w - 4)} 4`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} strokeLinecap="round" />
        <path d={coil(c.w * 0.14, c.w * 0.52, c.h * 0.74, 4, 3)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
      </g>
    ),
  },
  {
    id: 'kuehler',
    label: 'Luftkühler',
    category: 'luftbehandlung',
    tagPrefix: 'KUE',
    w: W, h: H,
    norm: 'DIN EN 12792 — Rechteck mit fallender Diagonale',
    keywords: ['kühlregister', 'kaltwasser', 'entfeuchtung'],
    ports: [...airInOut(), ...fluidBelow('Kaltwasser Vorlauf', 'Kaltwasser Rücklauf')],
    params: [
      sel('medium', 'Kühlmedium', ['Kaltwasser', 'Sole', 'Direktverdampfer (DX)'], { group: 'Auslegung', default: 'Kaltwasser' }),
      pLeistung('Kälteleistung gesamt', { showByDefault: true, short: 'Q' }),
      num('leistung_sens', 'Kälteleistung sensibel', 'kW', { group: 'Auslegung', step: 0.1 }),
      num('t_luft_ein', 'Lufteintritt', '°C', { group: 'Auslegung', step: 0.5 }),
      num('rf_luft_ein', 'rel. Feuchte Eintritt', '%', { group: 'Auslegung', step: 1, max: 100 }),
      num('t_luft_aus', 'Luftaustritt', '°C', { group: 'Auslegung', step: 0.5, showByDefault: true, short: 'tA' }),
      num('rf_luft_aus', 'rel. Feuchte Austritt', '%', { group: 'Auslegung', step: 1, max: 100 }),
      num('t_vl', 'Medium Vorlauf', '°C', { group: 'Medium', step: 1, default: 6 }),
      num('t_rl', 'Medium Rücklauf', '°C', { group: 'Medium', step: 1, default: 12 }),
      num('kondensat', 'Kondensatanfall', 'kg/h', { group: 'Medium', step: 0.1 }),
      pDruckverlust({ label: 'Druckverlust Luft' }),
      bool('tropfenabscheider', 'Tropfenabscheider integriert', { group: 'Ausführung', default: true }),
      bool('kondensatablauf', 'Kondensatablauf mit Siphon', { group: 'Ausführung', default: true }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path d={`M4 4L${n(c.w - 4)} ${n(c.h - 4)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'kuehler-direkt',
    label: 'Direktverdampfer',
    category: 'luftbehandlung',
    tagPrefix: 'KUE',
    w: W, h: H,
    norm: 'DIN EN 12792 — Kühler mit Kältemittelanschluss',
    keywords: ['dx', 'kältemittel', 'verdampfer', 'split'],
    ports: [...airInOut(), ...fluidBelow('Kältemittel Eintritt', 'Kältemittel Austritt')],
    params: [
      pLeistung('Kälteleistung', { showByDefault: true, short: 'Q' }),
      txt('kaeltemittel', 'Kältemittel', { group: 'Medium', placeholder: 'R32, R290, R454B', default: 'R32' }),
      num('gwp', 'GWP', '—', { group: 'Medium', step: 1 }),
      num('t_verdampfung', 'Verdampfungstemperatur', '°C', { group: 'Medium', step: 0.5 }),
      sel('regelung', 'Leistungsregelung', ['Ein/Aus', 'zweistufig', 'Inverter'], { group: 'MSR', default: 'Inverter' }),
      pDruckverlust({ label: 'Druckverlust Luft' }),
      bool('kondensatablauf', 'Kondensatablauf mit Siphon', { group: 'Ausführung', default: true }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path d={`M4 4L${n(c.w - 4)} ${n(c.h - 4)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} strokeLinecap="round" />
        <Glyph c={c} x={c.w * 0.74} y={c.h * 0.26} size={11}>DX</Glyph>
      </g>
    ),
  },
  {
    id: 'befeuchter-dampf',
    label: 'Dampfbefeuchter',
    category: 'luftbehandlung',
    tagPrefix: 'BEF',
    w: W, h: H,
    norm: 'DIN EN 12792 — Befeuchter mit Dampfeintrag',
    keywords: ['dampf', 'elektrode', 'befeuchtung', 'hygiene'],
    ports: airInOut(),
    params: [
      sel('bauart', 'Bauart', ['Elektrodendampferzeuger', 'Heizelementdampferzeuger', 'Dampfanschluss zentral', 'Gasbeheizt'], { group: 'Ausführung', default: 'Elektrodendampferzeuger' }),
      num('befeuchtungsleistung', 'Befeuchtungsleistung', 'kg/h', { group: 'Auslegung', step: 0.5, showByDefault: true, short: 'ṁD' }),
      num('rf_soll', 'Sollfeuchte Austritt', '%', { group: 'Auslegung', step: 1, max: 100, showByDefault: true, short: 'rF' }),
      num('leistung_el', 'Elektrische Leistung', 'kW', { group: 'Elektro', step: 0.1 }),
      sel('wasserqualitaet', 'Wasserqualität', ['Trinkwasser', 'enthärtet', 'VE-Wasser', 'Umkehrosmose'], { group: 'Medium', default: 'Trinkwasser' }),
      num('befeuchtungsstrecke', 'Befeuchtungsstrecke', 'm', { group: 'Ausführung', step: 0.1 }),
      bool('hygiene', 'Hygieneanforderung VDI 6022', { group: 'Hygiene', default: true }),
    ],
    draw: (c) => {
      const lx = c.w * 0.34
      return (
        <g>
          <Box c={c} />
          <path d={`M${n(lx)} ${n(c.h - 5)}L${n(lx)} ${n(c.h * 0.3)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} strokeLinecap="round" />
          <path d={`M${n(lx)} ${n(c.h * 0.42)}q6 -7 12 0M${n(lx)} ${n(c.h * 0.62)}q6 -7 12 0M${n(lx + 14)} ${n(c.h * 0.52)}q6 -7 12 0`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
          <path d={arrowHead(c.w * 0.8, c.h * 0.34, -60, 4.5)} fill={c.t.line} stroke="none" />
        </g>
      )
    },
  },
  {
    id: 'befeuchter-spruehe',
    label: 'Sprühbefeuchter',
    category: 'luftbehandlung',
    tagPrefix: 'BEF',
    w: W, h: H,
    norm: 'DIN EN 12792 — Luftwäscher',
    keywords: ['luftwäscher', 'düsen', 'hochdruck', 'adiabat'],
    ports: airInOut(),
    params: [
      sel('bauart', 'Bauart', ['Hochdrucksprühbefeuchter', 'Umlaufsprühbefeuchter', 'Zweistoffdüse', 'Ultraschall'], { group: 'Ausführung', default: 'Hochdrucksprühbefeuchter' }),
      num('befeuchtungsleistung', 'Befeuchtungsleistung', 'kg/h', { group: 'Auslegung', step: 0.5, showByDefault: true, short: 'ṁW' }),
      num('rf_soll', 'Sollfeuchte Austritt', '%', { group: 'Auslegung', step: 1, max: 100 }),
      num('wirkungsgrad', 'Befeuchtungswirkungsgrad', '%', { group: 'Auslegung', step: 1, max: 100 }),
      num('kuehlleistung', 'Adiabate Kühlleistung', 'kW', { group: 'Auslegung', step: 0.1 }),
      sel('wasserqualitaet', 'Wasserqualität', ['Umkehrosmose', 'VE-Wasser', 'enthärtet'], { group: 'Medium', default: 'Umkehrosmose' }),
      bool('uv', 'UV-Entkeimung Umlaufwasser', { group: 'Hygiene' }),
      bool('hygiene', 'Hygieneanforderung VDI 6022', { group: 'Hygiene', default: true }),
    ],
    draw: (c) => {
      const nx = [0.34, 0.5, 0.66]
      return (
        <g>
          <Box c={c} />
          <path d={`M8 ${n(c.h - 6)}L${n(c.w - 8)} ${n(c.h - 6)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
          {nx.map((f, i) => (
            <g key={i}>
              <circle cx={n(c.w * f)} cy={n(c.h * 0.26)} r={2} fill={c.t.line} stroke="none" />
              <path d={`M${n(c.w * f)} ${n(c.h * 0.3)}L${n(c.w * f - 5)} ${n(c.h - 9)}M${n(c.w * f)} ${n(c.h * 0.3)}L${n(c.w * f + 5)} ${n(c.h - 9)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
            </g>
          ))}
          <path d={`M${n(c.w * 0.34)} ${n(c.h * 0.26)}L${n(c.w * 0.66)} ${n(c.h * 0.26)}M${n(c.w * 0.5)} ${n(c.h * 0.26)}L${n(c.w * 0.5)} 4`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
        </g>
      )
    },
  },
  {
    id: 'befeuchter-verdunst',
    label: 'Verdunstungsbefeuchter',
    category: 'luftbehandlung',
    tagPrefix: 'BEF',
    w: W, h: H,
    norm: 'DIN EN 12792 — Kontaktbefeuchter',
    keywords: ['kontakt', 'wabe', 'adiabat', 'verdunstung'],
    ports: airInOut(),
    params: [
      num('befeuchtungsleistung', 'Befeuchtungsleistung', 'kg/h', { group: 'Auslegung', step: 0.5, showByDefault: true, short: 'ṁW' }),
      num('wirkungsgrad', 'Befeuchtungswirkungsgrad', '%', { group: 'Auslegung', step: 1, max: 100, default: 85 }),
      num('kuehlleistung', 'Adiabate Kühlleistung', 'kW', { group: 'Auslegung', step: 0.1 }),
      sel('material', 'Kontaktmaterial', ['Glasfaservlies', 'Zellulose', 'Kunststoffgewebe', 'Keramik'], { group: 'Ausführung' }),
      pDruckverlust(),
      bool('hygiene', 'Hygieneanforderung VDI 6022', { group: 'Hygiene', default: true }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path d={waveH(6, c.w - 6, c.h * 0.36, 4, 3) + waveH(6, c.w - 6, c.h * 0.64, 4, 3)} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M8 ${n(c.h - 5)}L${n(c.w - 8)} ${n(c.h - 5)}`} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
      </g>
    ),
  },
  {
    id: 'tropfenabscheider',
    label: 'Tropfenabscheider',
    category: 'luftbehandlung',
    tagPrefix: 'TRA',
    w: 40, h: H,
    norm: 'DIN EN 12792 — Rechteck mit Zickzackprofil',
    keywords: ['abscheider', 'lamellen', 'wasser'],
    ports: airInOut(),
    params: [
      num('abscheidegrad', 'Abscheidegrad', '%', { group: 'Auslegung', step: 1, max: 100, default: 99 }),
      num('v_max', 'Zulässige Anströmgeschwindigkeit', 'm/s', { group: 'Auslegung', step: 0.1 }),
      sel('material', 'Werkstoff', ['Kunststoff', 'Edelstahl', 'Aluminium'], { group: 'Ausführung' }),
      pDruckverlust(),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path d={zigzagV(c.w * 0.35, 3, c.h - 3, 4, 4) + zigzagV(c.w * 0.65, 3, c.h - 3, 4, 4)} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
      </g>
    ),
  },
  {
    id: 'schalldaempfer',
    label: 'Schalldämpfer',
    category: 'luftbehandlung',
    tagPrefix: 'SD',
    w: W, h: H,
    norm: 'DIN EN 12792 — Rechteck mit Punktfüllung',
    keywords: ['schall', 'dämpfer', 'akustik'],
    ports: airInOut(),
    params: [
      sel('bauart', 'Bauart', ['Kulissenschalldämpfer', 'Rohrschalldämpfer', 'Zellenschalldämpfer', 'Umlenkschalldämpfer'], { group: 'Ausführung', default: 'Kulissenschalldämpfer' }),
      num('laenge', 'Baulänge', 'mm', { group: 'Ausführung', step: 100, showByDefault: true, short: 'L' }),
      num('kulissen', 'Anzahl Kulissen', 'Stk', { group: 'Ausführung', step: 1 }),
      num('spaltbreite', 'Spaltbreite', 'mm', { group: 'Ausführung', step: 10 }),
      txt('daempfung', 'Einfügungsdämpfung', { group: 'Schall', placeholder: '15/22/30/35/30/25 dB (125 Hz – 4 kHz)' }),
      num('dw', 'Dämpfung gesamt', 'dB', { group: 'Schall', step: 1, showByDefault: true, short: 'D' }),
      pDruckverlust(),
      bool('hygiene', 'Abriebfeste Abdeckung VDI 6022', { group: 'Hygiene', default: true }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        {dots(c, 5, 4, c.w - 10, c.h - 8, 6.5, 1.2)}
      </g>
    ),
  },
  {
    id: 'schalldaempfer-kulisse',
    label: 'Kulissenschalldämpfer',
    category: 'luftbehandlung',
    tagPrefix: 'SD',
    w: W, h: H,
    norm: 'DIN EN 12792',
    keywords: ['kulisse', 'schall'],
    ports: airInOut(),
    params: [
      num('laenge', 'Baulänge', 'mm', { group: 'Ausführung', step: 100, showByDefault: true, short: 'L' }),
      num('kulissen', 'Anzahl Kulissen', 'Stk', { group: 'Ausführung', step: 1, default: 3 }),
      num('kulissendicke', 'Kulissendicke', 'mm', { group: 'Ausführung', step: 10, default: 100 }),
      num('spaltbreite', 'Spaltbreite', 'mm', { group: 'Ausführung', step: 10, default: 100 }),
      num('dw', 'Dämpfung gesamt', 'dB', { group: 'Schall', step: 1, showByDefault: true, short: 'D' }),
      pDruckverlust(),
    ],
    draw: (c) => {
      const k = 3
      const gap = c.h / (k * 2 + 1)
      const items = []
      for (let i = 0; i < k; i++) {
        const y = gap * (i * 2 + 1)
        items.push(<rect key={i} x={5} y={n(y)} width={n(c.w - 10)} height={n(gap)} rx={n(gap / 2)} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />)
      }
      return <g><Box c={c} />{items}</g>
    },
  },
  {
    id: 'entkeimung-uv',
    label: 'UV-C-Entkeimung',
    category: 'luftbehandlung',
    tagPrefix: 'UVC',
    w: 48, h: H,
    norm: 'VDI 6022 — Luftentkeimung',
    keywords: ['uv', 'entkeimung', 'hygiene', 'desinfektion'],
    ports: airInOut(),
    params: [
      num('leistung_el', 'Elektrische Leistung', 'kW', { group: 'Elektro', step: 0.05 }),
      num('bestrahlung', 'Bestrahlungsstärke', 'W/m²', { group: 'Auslegung', step: 1 }),
      num('strahler', 'Anzahl Strahler', 'Stk', { group: 'Ausführung', step: 1 }),
      num('standzeit', 'Standzeit Strahler', 'h', { group: 'Wartung', step: 100 }),
      bool('ueberwachung', 'Funktionsüberwachung', { group: 'MSR', default: true }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path d={`M${n(c.w * 0.26)} 7L${n(c.w * 0.26)} ${n(c.h - 7)}M${n(c.w * 0.74)} 7L${n(c.w * 0.74)} ${n(c.h - 7)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} strokeLinecap="round" />
        <Glyph c={c} x={c.w * 0.5} y={c.h * 0.5} size={11}>UV</Glyph>
      </g>
    ),
  },
  {
    id: 'mischkammer',
    label: 'Mischkammer',
    category: 'luftbehandlung',
    tagPrefix: 'MK',
    w: 72, h: 64,
    norm: 'DIN EN 12792 — Mischen von Außen- und Umluft',
    keywords: ['mischen', 'umluft', 'mischluft'],
    ports: [
      { id: 'aul', rx: 0, ry: 0.28, dir: 'left', kind: 'air', label: 'Außenluft' },
      { id: 'uml', rx: 0, ry: 0.75, dir: 'left', kind: 'air', label: 'Umluft' },
      { id: 'out', rx: 1, ry: 0.5, dir: 'right', kind: 'air', label: 'Mischluft' },
    ],
    params: [
      num('anteil_aul', 'Mindestaußenluftanteil', '%', { group: 'Auslegung', step: 5, max: 100, showByDefault: true, short: 'AUL' }),
      pVolumenstrom({ label: 'Mischluftvolumenstrom' }),
      sel('regelung', 'Regelung', ['Festwert', 'temperaturgefuehrt', 'CO₂-geführt', 'enthalpiegefuehrt'], { group: 'MSR' }),
      bool('klappen_dicht', 'Dichtschließende Klappen', { group: 'Ausführung', default: true }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path d={`M4 ${n(c.h * 0.28)}L${n(c.w * 0.42)} ${n(c.h * 0.28)}L${n(c.w * 0.58)} ${n(c.h * 0.5)}M4 ${n(c.h * 0.75)}L${n(c.w * 0.42)} ${n(c.h * 0.75)}L${n(c.w * 0.58)} ${n(c.h * 0.5)}M${n(c.w * 0.58)} ${n(c.h * 0.5)}L${n(c.w - 4)} ${n(c.h * 0.5)}`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={`M${n(c.w * 0.18)} ${n(c.h * 0.16)}L${n(c.w * 0.3)} ${n(c.h * 0.4)}M${n(c.w * 0.18)} ${n(c.h * 0.63)}L${n(c.w * 0.3)} ${n(c.h * 0.87)}`} fill="none" stroke={c.t.line} strokeWidth={SW.bold} strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'waermeuebertrager-luft',
    label: 'Luft-Luft-Wärmeübertrager',
    category: 'luftbehandlung',
    tagPrefix: 'WUE',
    w: 72, h: 64,
    norm: 'DIN EN 12792',
    keywords: ['wärmetauscher', 'übertrager'],
    ports: airDual(),
    params: [
      pLeistung('Übertragungsleistung'),
      num('wirkungsgrad', 'Rückwärmzahl', '%', { group: 'Auslegung', step: 1, max: 100, showByDefault: true, short: 'η' }),
      pDruckverlust({ label: 'Druckverlust je Seite' }),
    ],
    draw: (c) => (
      <g>
        <Box c={c} />
        <path d={`M0 0L${n(c.w)} ${n(c.h)}M0 ${n(c.h)}L${n(c.w)} 0`} fill="none" stroke={c.t.line} strokeWidth={SW.inner} />
        <path d={arc(c.w / 2, c.h / 2, Math.min(c.w, c.h) * 0.22, 200, 340)} fill="none" stroke={c.t.line} strokeWidth={SW.hair} />
      </g>
    ),
  },
  {
    id: 'rlt-geraet',
    label: 'RLT-Zentralgerät',
    category: 'luftbehandlung',
    tagPrefix: 'RLT',
    w: 360, h: 152,
    resizable: true,
    minW: 120, minH: 80,
    layer: 'background',
    norm: 'DIN EN 1886 / DIN EN 13053 — Geräteumhüllende',
    keywords: ['zentralgerät', 'ahu', 'gehäuse', 'rahmen'],
    ports: [],
    params: [
      pVolumenstrom({ label: 'Nennvolumenstrom' }),
      sel('bauform', 'Bauform', ['Aufstellung innen', 'Aufstellung außen (Wetterschutz)', 'Dachgerät', 'Kompaktgerät'], { group: 'Ausführung' }),
      sel('gehaeuseklasse', 'Gehäuseklassifizierung', ['T2/TB2', 'T3/TB3', 'L1/L2', 'F9'], { group: 'Ausführung', hint: 'DIN EN 1886' }),
      sel('effizienz', 'Effizienzklasse', ENERGIEEFFIZIENZ, { group: 'Energie', hint: 'DIN EN 13053' }),
      num('gewicht', 'Betriebsgewicht', 'kg', { group: 'Ausführung', step: 10 }),
      pAbmessung({ placeholder: 'L × B × H in mm' }),
      bool('erp', 'ErP-konform (VO 1253/2014)', { group: 'Energie', default: true }),
      bool('hygiene', 'Hygienegerät VDI 6022 / DIN 1946-4', { group: 'Hygiene' }),
    ],
    draw: (c) => (
      <g>
        <rect x={0} y={0} width={c.w} height={c.h} rx={4} fill="none" stroke={c.t.line} strokeWidth={SW.outline} strokeDasharray="7 4" />
      </g>
    ),
  },
]

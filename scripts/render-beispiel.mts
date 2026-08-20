// Erzeugt Vorschauen der Beispielanlage als SVG, damit sich das Ergebnis des
// Exports ohne Browser ansehen laesst.
import { writeFileSync, mkdirSync } from 'node:fs'
import { buildSvg, type ExportOptions } from '../src/export/svg'
import { beispielDoc } from '../src/state/beispiel'

const doc = beispielDoc()
mkdirSync('docs/vorschau', { recursive: true })

const varianten: Array<[string, ExportOptions]> = [
  ['beispiel', { farbe: true, beschriftung: true, stueckliste: false, schriftfeld: true, leitungen: false }],
  ['beispiel-stueckliste', { farbe: true, beschriftung: true, stueckliste: true, schriftfeld: true, leitungen: true }],
  ['beispiel-sw', { farbe: false, beschriftung: true, stueckliste: false, schriftfeld: true, leitungen: false }],
]

for (const [name, opts] of varianten) {
  const { svg, width, height } = buildSvg(doc, opts)
  writeFileSync(`docs/vorschau/${name}.svg`, svg)
  console.log(`geschrieben: docs/vorschau/${name}.svg (${width} \u00d7 ${height})`)
}

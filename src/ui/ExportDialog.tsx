import { useEffect, useMemo, useState } from 'react'
import { deliverFile, safeFilename, svgToDataUrl, svgToPngBlob } from '../export/file'
import { bomToCsv } from '../export/bom'
import { docToJson } from '../export/project'
import { DEFAULT_EXPORT, buildSvg, type ExportOptions } from '../export/svg'
import { useStore } from '../state/store'
import { IconClose, IconDownload } from './icons'

const OPTION_KEY = 'rlt.export'

function loadOptions(): ExportOptions {
  try {
    const raw = localStorage.getItem(OPTION_KEY)
    if (raw) return { ...DEFAULT_EXPORT, ...(JSON.parse(raw) as Partial<ExportOptions>) }
  } catch {
    /* Voreinstellungen genügen */
  }
  return DEFAULT_EXPORT
}

export function ExportDialog({ onClose, onToast }: { onClose: () => void; onToast: (msg: string, error?: boolean) => void }) {
  const doc = useStore((s) => s.doc)
  const [opts, setOpts] = useState<ExportOptions>(loadOptions)
  const [scale, setScale] = useState(2)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(OPTION_KEY, JSON.stringify(opts))
    } catch {
      /* Voreinstellungen sind nicht kritisch */
    }
  }, [opts])

  const built = useMemo(() => buildSvg(doc, opts), [doc, opts])
  const preview = useMemo(() => svgToDataUrl(built.svg), [built.svg])
  const leer = doc.nodes.length === 0

  const toggle = (key: keyof ExportOptions) => setOpts((o) => ({ ...o, [key]: !o[key] }))

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Der Export ist fehlgeschlagen.', true)
    } finally {
      setBusy(false)
    }
  }

  const exportPng = () =>
    run(async () => {
      const blob = await svgToPngBlob(built.svg, built.width, built.height, scale)
      const where = await deliverFile(blob, safeFilename(doc.meta.projekt, 'png'), doc.meta.projekt)
      onToast(where === 'geteilt' ? 'Bild geteilt' : 'Bild gespeichert')
      onClose()
    })

  const exportSvg = () =>
    run(async () => {
      const blob = new Blob([built.svg], { type: 'image/svg+xml;charset=utf-8' })
      const where = await deliverFile(blob, safeFilename(doc.meta.projekt, 'svg'), doc.meta.projekt)
      onToast(where === 'geteilt' ? 'Vektorgrafik geteilt' : 'Vektorgrafik gespeichert')
      onClose()
    })

  const exportJson = () =>
    run(async () => {
      const blob = new Blob([docToJson(doc)], { type: 'application/json' })
      const where = await deliverFile(blob, safeFilename(doc.meta.projekt, 'json'), doc.meta.projekt)
      onToast(where === 'geteilt' ? 'Projektdatei geteilt' : 'Projektdatei gespeichert')
      onClose()
    })

  const exportCsv = () =>
    run(async () => {
      const blob = new Blob([bomToCsv(doc)], { type: 'text/csv;charset=utf-8' })
      const where = await deliverFile(blob, safeFilename(`${doc.meta.projekt}-Stückliste`, 'csv'), doc.meta.projekt)
      onToast(where === 'geteilt' ? 'Stückliste geteilt' : 'Stückliste gespeichert')
      onClose()
    })

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Exportieren" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet wide">
        <div className="panel-head">
          <h2>Exportieren<span className="sub">{built.width} × {built.height} Punkte</span></h2>
          <button className="iconbtn" onClick={onClose} aria-label="Schließen"><IconClose /></button>
        </div>

        <div className="sheet-body stack">
          {leer ? (
            <p className="empty-hint">Das Schema ist noch leer.</p>
          ) : (
            <div className="exportpreview">
              <img src={preview} alt="Vorschau des Schemas" />
            </div>
          )}

          <div className="pgroup" style={{ marginBottom: 0 }}>
            <h3>Inhalt</h3>
            <label className="switch" style={{ marginBottom: 8 }}>
              <input type="checkbox" checked={opts.farbe} onChange={() => toggle('farbe')} />
              <span>Luftarten farbig (sonst einfarbig schwarz)</span>
            </label>
            <label className="switch" style={{ marginBottom: 8 }}>
              <input type="checkbox" checked={opts.beschriftung} onChange={() => toggle('beschriftung')} />
              <span>Beschriftungen an den Symbolen</span>
            </label>
            <label className="switch" style={{ marginBottom: 8 }}>
              <input type="checkbox" checked={opts.schriftfeld} onChange={() => toggle('schriftfeld')} />
              <span>Schriftfeld mit Projektangaben</span>
            </label>
            <label className="switch" style={{ marginBottom: 8 }}>
              <input type="checkbox" checked={opts.stueckliste} onChange={() => toggle('stueckliste')} />
              <span>Stückliste unter das Schema setzen</span>
            </label>
            {opts.stueckliste ? (
              <label className="switch" style={{ marginLeft: 28 }}>
                <input type="checkbox" checked={opts.leitungen} onChange={() => toggle('leitungen')} />
                <span>Leitungen mit auflisten</span>
              </label>
            ) : null}
          </div>

          <div className="pgroup" style={{ marginBottom: 0 }}>
            <h3>Bildauflösung</h3>
            <div className="rowbtns">
              {[1, 2, 3].map((s) => (
                <button key={s} className={`btn${scale === s ? ' primary' : ''}`} onClick={() => setScale(s)}>
                  {s}× ({Math.round(built.width * s)} × {Math.round(built.height * s)})
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sheet-foot">
          <button className="btn ghost" onClick={exportCsv} disabled={busy || leer}>Stückliste (CSV)</button>
          <button className="btn ghost" onClick={exportJson} disabled={busy}>Projektdatei (JSON)</button>
          <button className="btn" onClick={exportSvg} disabled={busy || leer}>Vektor (SVG)</button>
          <button className="btn primary" onClick={exportPng} disabled={busy || leer}>
            <IconDownload /> {busy ? 'Bitte warten …' : 'Bild (PNG)'}
          </button>
        </div>
      </div>
    </div>
  )
}

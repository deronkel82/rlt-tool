import { canvasApi } from '../canvas/api'
import { useStore, type Tool } from '../state/store'
import { IconClose, IconFit, IconLasso, IconLink, IconMinus, IconPlus, IconPointer } from './icons'

const TOOLS: { id: Tool; label: string; hint: string; icon: () => JSX.Element }[] = [
  { id: 'auswahl', label: 'Auswählen', hint: 'Ein Finger auf freier Fläche verschiebt den Ausschnitt', icon: IconPointer },
  { id: 'lasso', label: 'Rahmenauswahl', hint: 'Ein Finger zieht einen Auswahlrahmen auf', icon: IconLasso },
  { id: 'kanal', label: 'Leitungen', hint: 'Alle Anschlusspunkte sind sichtbar und ziehbar', icon: IconLink },
]

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const tool = useStore((s) => s.tool)
  const setTool = useStore((s) => s.setTool)
  const zoom = useStore((s) => s.viewport.zoom)
  const zoomBy = (f: number) => canvasApi.zoomBy?.(f)

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Ansicht und Werkzeuge" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="panel-head">
          <h2>Ansicht und Werkzeuge</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Schließen"><IconClose /></button>
        </div>
        <div className="sheet-body stack">
          <div className="pgroup" style={{ marginBottom: 0 }}>
            <h3>Werkzeug</h3>
            <div className="stack">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  className={`btn${tool === t.id ? ' primary' : ''}`}
                  style={{ justifyContent: 'flex-start', height: 46 }}
                  onClick={() => setTool(t.id)}
                >
                  <t.icon />
                  <span style={{ textAlign: 'left' }}>
                    {t.label}
                    <span style={{ display: 'block', fontSize: 11.5, opacity: 0.75 }}>{t.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pgroup" style={{ marginBottom: 0 }}>
            <h3>Ansicht</h3>
            <div className="rowbtns" style={{ marginBottom: 10 }}>
              <button className="btn" onClick={() => zoomBy(1 / 1.25)}><IconMinus /> Kleiner</button>
              <span className="zoomlabel" style={{ alignSelf: 'center' }}>{Math.round(zoom * 100)} %</span>
              <button className="btn" onClick={() => zoomBy(1.25)}><IconPlus /> Größer</button>
              <button className="btn" onClick={() => canvasApi.fitToContent?.()}><IconFit /> Einpassen</button>
            </div>
            <label className="switch" style={{ marginBottom: 8 }}>
              <input type="checkbox" checked={settings.raster} onChange={(e) => setSettings({ raster: e.target.checked })} />
              <span>Raster anzeigen</span>
            </label>
            <label className="switch" style={{ marginBottom: 8 }}>
              <input type="checkbox" checked={settings.fangen} onChange={(e) => setSettings({ fangen: e.target.checked })} />
              <span>Am Raster fangen</span>
            </label>
            <label className="switch" style={{ marginBottom: 8 }}>
              <input type="checkbox" checked={settings.strangModus} onChange={(e) => setSettings({ strangModus: e.target.checked })} />
              <span>Strang-Modus — Bauteile rasten aneinander ein und verbinden sich</span>
            </label>
            <label className="switch" style={{ marginBottom: 8 }}>
              <input type="checkbox" checked={settings.farbcode} onChange={(e) => setSettings({ farbcode: e.target.checked })} />
              <span>Luftarten farbig darstellen</span>
            </label>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.theme === 'dunkel'}
                onChange={(e) => setSettings({ theme: e.target.checked ? 'dunkel' : 'hell' })}
              />
              <span>Dunkle Darstellung</span>
            </label>
          </div>

          <div className="norm">
            Zwei Finger verschieben und zoomen die Zeichenfläche. Ein Anschlusspunkt lässt sich zu einem anderen ziehen,
            um eine Leitung zu legen. Mit dem Apple Pencil zieht ein Strich immer einen Auswahlrahmen auf.
          </div>
        </div>
      </div>
    </div>
  )
}

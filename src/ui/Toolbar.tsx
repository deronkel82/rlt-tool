import { canvasApi } from '../canvas/api'
import { useStore, type Tool } from '../state/store'
import {
  IconDownload, IconFit, IconGrid, IconLasso, IconLink, IconMagnet, IconMenu, IconMinus,
  IconMoon, IconPalette, IconPlus, IconRedo, IconSliders, IconSun, IconTable, IconUndo,
} from './icons'

const TOOLS: { id: Tool; label: string; icon: () => JSX.Element }[] = [
  { id: 'auswahl', label: 'Auswählen und verschieben', icon: IconMenu },
  { id: 'lasso', label: 'Rahmenauswahl', icon: IconLasso },
  { id: 'kanal', label: 'Leitungen verlegen', icon: IconLink },
]

export function Toolbar({
  onProjects, onTogglePalette, onToggleInspector, onToggleBom, onExport, onSettings,
  paletteOpen, inspectorOpen, bomOpen,
}: {
  onProjects: () => void
  onTogglePalette: () => void
  onToggleInspector: () => void
  onToggleBom: () => void
  onExport: () => void
  onSettings: () => void
  paletteOpen: boolean
  inspectorOpen: boolean
  bomOpen: boolean
}) {
  const meta = useStore((s) => s.doc.meta)
  const dirty = useStore((s) => s.dirty)
  const past = useStore((s) => s.past.length)
  const future = useStore((s) => s.future.length)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const tool = useStore((s) => s.tool)
  const setTool = useStore((s) => s.setTool)
  const zoom = useStore((s) => s.viewport.zoom)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)

  const zoomBy = (f: number) => canvasApi.zoomBy?.(f)

  return (
    <header className="topbar">
      <button className="iconbtn" onClick={onProjects} aria-label="Projekte"><IconMenu /></button>

      <div className="title">
        <strong>{meta.projekt || 'RLT-Schema'}</strong>
        <span><span className={`savedot${dirty ? ' dirty' : ''}`} />{dirty ? 'wird gespeichert …' : 'gespeichert'}</span>
      </div>

      <div className="group">
        <button className="iconbtn" onClick={undo} disabled={past === 0} aria-label="Rückgängig"><IconUndo /></button>
        <button className="iconbtn" onClick={redo} disabled={future === 0} aria-label="Wiederherstellen"><IconRedo /></button>
      </div>

      <div className="group hide-narrow" role="group" aria-label="Werkzeug">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className="iconbtn"
            aria-pressed={tool === t.id}
            onClick={() => setTool(t.id)}
            aria-label={t.label}
            title={t.label}
          >
            <t.icon />
          </button>
        ))}
      </div>

      <div className="group hide-narrow">
        <button className="iconbtn" onClick={() => zoomBy(1 / 1.25)} aria-label="Verkleinern"><IconMinus /></button>
        <span className="zoomlabel">{Math.round(zoom * 100)} %</span>
        <button className="iconbtn" onClick={() => zoomBy(1.25)} aria-label="Vergrößern"><IconPlus /></button>
        <button className="iconbtn" onClick={() => canvasApi.fitToContent?.()} aria-label="Alles einpassen" title="Alles einpassen"><IconFit /></button>
      </div>

      <div className="group hide-narrow">
        <button
          className="iconbtn" aria-pressed={settings.raster}
          onClick={() => setSettings({ raster: !settings.raster })}
          aria-label="Raster anzeigen" title="Raster anzeigen"
        ><IconGrid /></button>
        <button
          className="iconbtn" aria-pressed={settings.fangen}
          onClick={() => setSettings({ fangen: !settings.fangen })}
          aria-label="Am Raster fangen" title="Am Raster fangen"
        ><IconMagnet /></button>
        <button
          className="iconbtn" aria-pressed={settings.theme === 'dunkel'}
          onClick={() => setSettings({ theme: settings.theme === 'dunkel' ? 'hell' : 'dunkel' })}
          aria-label="Dunkle Darstellung" title="Dunkle Darstellung"
        >{settings.theme === 'dunkel' ? <IconSun /> : <IconMoon />}</button>
      </div>

      <span className="spacer" />

      <button className="iconbtn" aria-pressed={paletteOpen} onClick={onTogglePalette} aria-label="Symbolpalette" title="Symbolpalette"><IconPalette /></button>
      <button className="iconbtn" aria-pressed={inspectorOpen} onClick={onToggleInspector} aria-label="Eigenschaften" title="Eigenschaften"><IconSliders /></button>
      <button className="iconbtn" aria-pressed={bomOpen} onClick={onToggleBom} aria-label="Stückliste" title="Stückliste"><IconTable /></button>
      <button className="iconbtn show-narrow" onClick={onSettings} aria-label="Ansicht und Werkzeuge"><IconGrid /></button>
      <button className="btn primary" onClick={onExport}><IconDownload /> Export</button>
    </header>
  )
}

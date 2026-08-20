import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from './canvas/Canvas'
import { canvasApi } from './canvas/api'
import { readTextFile } from './export/file'
import { jsonToDoc } from './export/project'
import { buildThumbnail } from './export/svg'
import { beispielDoc } from './state/beispiel'
import { useStore } from './state/store'
import { emptyDoc, type RltDoc } from './state/types'
import { deleteProject, getProject, newProjectId, putProject } from './storage/db'
import { BomPanel } from './ui/BomPanel'
import { ExportDialog } from './ui/ExportDialog'
import { Inspector } from './ui/Inspector'
import { Palette } from './ui/Palette'
import { ProjectDrawer } from './ui/ProjectDrawer'
import { SettingsSheet } from './ui/SettingsSheet'
import { Toolbar } from './ui/Toolbar'

const LAST_KEY = 'rlt.last'
const WIDE = 1081

export function App() {
  const doc = useStore((s) => s.doc)
  const dirty = useStore((s) => s.dirty)
  const projectId = useStore((s) => s.projectId)
  const loadDoc = useStore((s) => s.loadDoc)
  const markSaved = useStore((s) => s.markSaved)
  const theme = useStore((s) => s.settings.theme)

  const [wide, setWide] = useState(() => window.innerWidth >= WIDE)
  const [paletteOpen, setPaletteOpen] = useState(() => window.innerWidth >= WIDE)
  const [inspectorOpen, setInspectorOpen] = useState(() => window.innerWidth >= WIDE)
  const [bomOpen, setBomOpen] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null)

  const createdAt = useRef<number>(Date.now())
  const saveTimer = useRef<number | null>(null)

  const showToast = useCallback((msg: string, error = false) => {
    setToast({ msg, error })
    window.setTimeout(() => setToast((t) => (t?.msg === msg ? null : t)), 3200)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const onResize = () => {
      const isWide = window.innerWidth >= WIDE
      setWide(isWide)
      if (isWide) {
        setPaletteOpen(true)
        setInspectorOpen(true)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Zuletzt bearbeitetes Projekt öffnen, sonst mit einem Beispiel starten.
  useEffect(() => {
    let alive = true
    const boot = async () => {
      const last = localStorage.getItem(LAST_KEY)
      if (last) {
        try {
          const rec = await getProject(last)
          if (rec && alive) {
            createdAt.current = rec.createdAt
            loadDoc(rec.doc, rec.id)
            window.setTimeout(() => canvasApi.fitToContent?.(), 60)
            return
          }
        } catch {
          /* Speicher nicht verfügbar, dann mit dem Beispiel starten */
        }
      }
      if (!alive) return
      const id = newProjectId()
      createdAt.current = Date.now()
      loadDoc(beispielDoc(), id)
      localStorage.setItem(LAST_KEY, id)
      window.setTimeout(() => canvasApi.fitToContent?.(), 60)
    }
    void boot()
    return () => {
      alive = false
    }
  }, [loadDoc])

  const saveNow = useCallback(async () => {
    const state = useStore.getState()
    const id = state.projectId
    if (!id) return
    const current = state.doc
    if (current.nodes.length === 0 && !localStorage.getItem(`rlt.exists.${id}`)) return
    try {
      await putProject({
        id,
        name: current.meta.projekt,
        anlage: current.meta.anlage,
        createdAt: createdAt.current,
        updatedAt: Date.now(),
        thumb: buildThumbnail(current),
        doc: current,
      })
      localStorage.setItem(`rlt.exists.${id}`, '1')
      localStorage.setItem(LAST_KEY, id)
      markSaved()
      setRefreshKey((k) => k + 1)
    } catch {
      showToast('Das Projekt konnte nicht gespeichert werden.', true)
    }
  }, [markSaved, showToast])

  // Automatisch speichern, kurz nachdem die Bearbeitung ruht.
  useEffect(() => {
    if (!dirty) return
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => void saveNow(), 900)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [doc, dirty, saveNow])

  const switchTo = useCallback(
    async (next: RltDoc, id: string, created: number) => {
      await saveNow()
      createdAt.current = created
      loadDoc(next, id)
      localStorage.setItem(LAST_KEY, id)
      setProjectsOpen(false)
      window.setTimeout(() => canvasApi.fitToContent?.(), 60)
    },
    [loadDoc, saveNow],
  )

  const openProject = async (id: string) => {
    const rec = await getProject(id)
    if (!rec) {
      showToast('Das Projekt wurde nicht gefunden.', true)
      return
    }
    await switchTo(rec.doc, rec.id, rec.createdAt)
  }

  const newProject = async () => {
    const id = newProjectId()
    const fresh = emptyDoc()
    fresh.meta.projekt = 'Neues Projekt'
    await switchTo(fresh, id, Date.now())
    showToast('Neues Projekt angelegt')
  }

  const loadBeispiel = async () => {
    const id = newProjectId()
    await switchTo(beispielDoc(), id, Date.now())
    showToast('Beispielanlage geladen')
  }

  const duplicateProject = async (id: string) => {
    const rec = await getProject(id)
    if (!rec) return
    const copyId = newProjectId()
    const copy: RltDoc = structuredClone(rec.doc)
    copy.meta.projekt = `${copy.meta.projekt} (Kopie)`
    await switchTo(copy, copyId, Date.now())
    showToast('Projekt dupliziert')
  }

  const removeProject = async (id: string) => {
    await deleteProject(id)
    localStorage.removeItem(`rlt.exists.${id}`)
    setRefreshKey((k) => k + 1)
    if (id === projectId) await newProject()
    else showToast('Projekt gelöscht')
  }

  const importJson = async () => {
    const file = await readTextFile('.json,application/json')
    if (!file) return
    try {
      const next = jsonToDoc(file.text)
      await switchTo(next, newProjectId(), Date.now())
      showToast(`${file.name} geladen`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Die Datei konnte nicht gelesen werden.', true)
    }
  }

  const closeOverlays = () => {
    if (!wide) {
      setPaletteOpen(false)
      setInspectorOpen(false)
    }
    setProjectsOpen(false)
  }

  const overlayOpen = !wide && (paletteOpen || inspectorOpen || projectsOpen)

  return (
    <div className="app">
      <Toolbar
        onProjects={() => setProjectsOpen((v) => !v)}
        onTogglePalette={() => setPaletteOpen((v) => !v)}
        onToggleInspector={() => setInspectorOpen((v) => !v)}
        onToggleBom={() => setBomOpen((v) => !v)}
        onExport={() => setExportOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        paletteOpen={paletteOpen}
        inspectorOpen={inspectorOpen}
        bomOpen={bomOpen}
      />

      <div className="body">
        {paletteOpen ? <Palette onClose={() => setPaletteOpen(false)} /> : null}

        <Canvas />

        {inspectorOpen ? <Inspector onClose={() => setInspectorOpen(false)} /> : null}

        {projectsOpen ? (
          <ProjectDrawer
            currentId={projectId}
            refreshKey={refreshKey}
            onClose={() => setProjectsOpen(false)}
            onOpen={(id) => void openProject(id)}
            onNew={() => void newProject()}
            onDelete={(id) => void removeProject(id)}
            onDuplicate={(id) => void duplicateProject(id)}
            onImport={() => void importJson()}
          />
        ) : null}

        {overlayOpen ? <div className="scrim" onPointerDown={closeOverlays} /> : null}

        {bomOpen ? <BomPanel onClose={() => setBomOpen(false)} onToast={showToast} /> : null}
      </div>

      {exportOpen ? <ExportDialog onClose={() => setExportOpen(false)} onToast={showToast} /> : null}
      {settingsOpen ? <SettingsSheet onClose={() => setSettingsOpen(false)} /> : null}

      {doc.nodes.length === 0 ? (
        <button className="btn ghost beispiel-btn" onClick={() => void loadBeispiel()}>
          Beispielanlage laden
        </button>
      ) : null}

      {toast ? <div className={`toast${toast.error ? ' error' : ''}`} role="status">{toast.msg}</div> : null}
    </div>
  )
}

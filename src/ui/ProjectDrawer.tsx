import { useEffect, useState } from 'react'
import { formatDateTime } from '../format'
import { listProjects, type ProjectSummary } from '../storage/db'
import { IconClose, IconFolder, IconPlus, IconTrash, IconUpload } from './icons'

export function ProjectDrawer({
  currentId, refreshKey, onClose, onOpen, onNew, onDelete, onDuplicate, onImport,
}: {
  currentId: string | null
  refreshKey: number
  onClose: () => void
  onOpen: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onImport: () => void
}) {
  const [items, setItems] = useState<ProjectSummary[] | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    listProjects()
      .then((list) => alive && setItems(list))
      .catch(() => alive && setItems([]))
    return () => {
      alive = false
    }
  }, [refreshKey])

  return (
    <aside className="drawer left" aria-label="Projekte">
      <div className="panel-head">
        <h2>Projekte<span className="sub">im Gerät gespeichert</span></h2>
        <button className="iconbtn" onClick={onClose} aria-label="Projekte schließen"><IconClose /></button>
      </div>

      <div className="panel-scroll">
        <div className="rowbtns" style={{ marginBottom: 14 }}>
          <button className="btn primary" onClick={onNew}><IconPlus /> Neues Projekt</button>
          <button className="btn ghost" onClick={onImport}><IconUpload /> JSON laden</button>
        </div>

        {items === null ? <p className="empty-hint">Wird geladen …</p> : null}
        {items?.length === 0 ? (
          <p className="empty-hint">Noch keine gespeicherten Projekte. Das aktuelle Schema wird automatisch abgelegt, sobald du etwas zeichnest.</p>
        ) : null}

        <div className="projectlist">
          {items?.map((p) => (
            <div key={p.id}>
              <button
                className={`projectcard${p.id === currentId ? ' active' : ''}`}
                onClick={() => onOpen(p.id)}
              >
                {p.thumb ? <img src={p.thumb} alt="" /> : <span className="projectcard-noimg"><IconFolder /></span>}
                <span className="meta">
                  <strong>{p.name || 'Ohne Namen'}</strong>
                  <span>{p.anlage || `${p.komponenten} Komponenten`}</span>
                  <span>{formatDateTime(p.updatedAt)}</span>
                </span>
              </button>
              <div className="rowbtns" style={{ marginTop: 6, marginBottom: 4 }}>
                <button className="btn ghost" style={{ height: 32, fontSize: 12.5 }} onClick={() => onDuplicate(p.id)}>
                  Duplizieren
                </button>
                {confirmId === p.id ? (
                  <>
                    <button
                      className="btn danger"
                      style={{ height: 32, fontSize: 12.5 }}
                      onClick={() => {
                        onDelete(p.id)
                        setConfirmId(null)
                      }}
                    >
                      Wirklich löschen
                    </button>
                    <button className="btn ghost" style={{ height: 32, fontSize: 12.5 }} onClick={() => setConfirmId(null)}>
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <button className="btn ghost" style={{ height: 32, fontSize: 12.5 }} onClick={() => setConfirmId(p.id)}>
                    <IconTrash /> Löschen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

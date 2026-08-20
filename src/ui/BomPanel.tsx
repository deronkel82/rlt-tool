import { Fragment, useMemo } from 'react'
import { bomToCsv, buildBom, buildEdgeBom } from '../export/bom'
import { deliverFile, safeFilename } from '../export/file'
import { useStore } from '../state/store'
import { IconClose, IconDownload } from './icons'

export function BomPanel({ onClose, onToast }: { onClose: () => void; onToast: (msg: string) => void }) {
  const doc = useStore((s) => s.doc)
  const selection = useStore((s) => s.selection)
  const select = useStore((s) => s.select)

  const groups = useMemo(() => buildBom(doc), [doc])
  const edgeRows = useMemo(() => buildEdgeBom(doc), [doc])
  const tagToId = useMemo(() => new Map(doc.nodes.map((n) => [n.tag, n.id])), [doc.nodes])

  const exportCsv = async () => {
    const csv = bomToCsv(doc)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const where = await deliverFile(blob, safeFilename(`${doc.meta.projekt}-Stückliste`, 'csv'), 'Stückliste')
    onToast(where === 'geteilt' ? 'Stückliste geteilt' : 'Stückliste gespeichert')
  }

  const total = groups.reduce((a, g) => a + g.rows.length, 0)

  return (
    <section className="bom" aria-label="Stückliste">
      <div className="panel-head">
        <h2>Stückliste<span className="sub">{total} Komponenten, {edgeRows.length} Leitungen</span></h2>
        <button className="btn ghost" onClick={exportCsv} disabled={total === 0}><IconDownload /> CSV</button>
        <button className="iconbtn" onClick={onClose} aria-label="Stückliste schließen"><IconClose /></button>
      </div>
      <div className="panel-scroll" style={{ padding: 0 }}>
        {total === 0 && edgeRows.length === 0 ? (
          <p className="empty-hint" style={{ padding: 16 }}>Noch keine Komponenten im Schema.</p>
        ) : (
          <table className="bom-table">
            <thead>
              <tr>
                <th style={{ width: 92 }}>Kennzeichen</th>
                <th style={{ width: 170 }}>Bauteil</th>
                <th style={{ width: 170 }}>Bezeichnung</th>
                <th>Kenndaten</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g.kategorie}>
                  <tr className="group">
                    <td colSpan={4}>{g.kategorie}</td>
                  </tr>
                  {g.rows.map((r) => {
                    const id = tagToId.get(r.tag)
                    return (
                      <tr
                        key={r.tag}
                        className={id && selection.includes(id) ? 'sel' : undefined}
                        onClick={() => id && select([id])}
                      >
                        <td className="tag">{r.tag}</td>
                        <td>{r.bauteil}</td>
                        <td>{r.bezeichnung}</td>
                        <td className="data">{r.kenndaten}</td>
                      </tr>
                    )
                  })}
                </Fragment>
              ))}
              {edgeRows.length > 0 ? (
                <Fragment>
                  <tr className="group"><td colSpan={4}>Leitungen</td></tr>
                  {edgeRows.map((r, i) => (
                    <tr key={`${r.tag}-${i}`}>
                      <td className="tag">{r.tag}</td>
                      <td>{r.bauteil}</td>
                      <td>{r.bezeichnung}</td>
                      <td className="data">{r.kenndaten}</td>
                    </tr>
                  ))}
                </Fragment>
              ) : null}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

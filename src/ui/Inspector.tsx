import { useMemo } from 'react'
import { requireSymbol, withComputed } from '../catalog'
import { edgeParamDefs, withComputedEdge } from '../catalog/edge'
import type { ParamDef, ParamValue, ParamValues } from '../catalog/types'
import { formatValue } from '../format'
import { useStore } from '../state/store'
import type { RltEdge, RltNode } from '../state/types'
import { AIR_TYPES, FLUID_TYPES, type AirType, type FluidType } from '../theme'
import { IconClose, IconCopy, IconEye, IconEyeOff, IconFlip, IconRotate, IconTrash } from './icons'
import { SymbolPreview } from './SymbolPreview'

export function Inspector({ onClose }: { onClose: () => void }) {
  const doc = useStore((s) => s.doc)
  const selection = useStore((s) => s.selection)

  const nodes = useMemo(() => doc.nodes.filter((n) => selection.includes(n.id)), [doc.nodes, selection])
  const edges = useMemo(() => doc.edges.filter((e) => selection.includes(e.id)), [doc.edges, selection])

  let content
  if (nodes.length === 1 && edges.length === 0) content = <NodeInspector node={nodes[0]} />
  else if (edges.length === 1 && nodes.length === 0) content = <EdgeInspector edge={edges[0]} />
  else if (nodes.length + edges.length > 1) content = <MultiInspector count={nodes.length + edges.length} />
  else content = <ProjectInspector />

  return (
    <aside className="inspector" aria-label="Eigenschaften">
      <div className="panel-head">
        <h2>
          Eigenschaften
          <span className="sub">
            {nodes.length + edges.length === 0
              ? 'Projektangaben'
              : `${nodes.length + edges.length} ausgewählt`}
          </span>
        </h2>
        <button className="iconbtn" onClick={onClose} aria-label="Eigenschaften schließen"><IconClose /></button>
      </div>
      {content}
      {nodes.length + edges.length > 0 ? <SelectionActions /> : null}
    </aside>
  )
}

function SelectionActions() {
  const rotate = useStore((s) => s.rotateSelection)
  const flip = useStore((s) => s.flipSelection)
  const duplicate = useStore((s) => s.duplicateSelection)
  const remove = useStore((s) => s.deleteSelection)
  return (
    <div className="selbar">
      <button className="btn ghost" onClick={() => rotate(90)}><IconRotate /> Drehen</button>
      <button className="btn ghost" onClick={flip}><IconFlip /> Spiegeln</button>
      <button className="btn ghost" onClick={duplicate}><IconCopy /> Kopie</button>
      <button className="btn danger" onClick={remove}><IconTrash /> Löschen</button>
    </div>
  )
}

function MultiInspector({ count }: { count: number }) {
  return (
    <div className="panel-scroll">
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        {count} Objekte ausgewählt. Die Aktionen unten wirken auf die gesamte Auswahl; für Parameter bitte ein
        einzelnes Bauteil antippen.
      </p>
    </div>
  )
}

function ProjectInspector() {
  const meta = useStore((s) => s.doc.meta)
  const setMeta = useStore((s) => s.setMeta)
  const counts = useStore((s) => ({ n: s.doc.nodes.length, e: s.doc.edges.length }))
  return (
    <div className="panel-scroll">
      <div className="pgroup">
        <h3>Projekt</h3>
        <div className="prow">
          <div className="plabel"><span>Projektname</span></div>
          <input className="field" value={meta.projekt} onChange={(e) => setMeta({ projekt: e.target.value })} />
        </div>
        <div className="prow">
          <div className="plabel"><span>Anlagenbezeichnung</span></div>
          <input className="field" value={meta.anlage} placeholder="z. B. RLT 01 Halle Nord" onChange={(e) => setMeta({ anlage: e.target.value })} />
        </div>
        <div className="prow">
          <div className="plabel"><span>Bearbeiter</span></div>
          <input className="field" value={meta.bearbeiter} onChange={(e) => setMeta({ bearbeiter: e.target.value })} />
        </div>
        <div className="prow">
          <div className="plabel"><span>Datum</span></div>
          <input className="field" type="date" value={meta.datum} onChange={(e) => setMeta({ datum: e.target.value })} />
        </div>
        <div className="prow">
          <div className="plabel"><span>Bemerkung</span></div>
          <textarea className="field" value={meta.bemerkung} onChange={(e) => setMeta({ bemerkung: e.target.value })} />
        </div>
      </div>
      <div className="norm">
        {counts.n} Komponenten, {counts.e} Leitungen. Die Angaben erscheinen im Schriftfeld des Exports.
      </div>
    </div>
  )
}

function NodeInspector({ node }: { node: RltNode }) {
  const def = requireSymbol(node.type)
  const setParam = useStore((s) => s.setParam)
  const toggleVisible = useStore((s) => s.toggleVisibleParam)
  const updateNode = useStore((s) => s.updateNode)
  const pushHistory = useStore((s) => s.pushHistory)
  const dark = useStore((s) => s.settings.theme) === 'dunkel'
  const values = useMemo(() => withComputed(def, node.params), [def, node.params])

  return (
    <div className="panel-scroll">
      <div className="tagline">
        <SymbolPreview def={def} w={46} h={34} dark={dark} />
        <div style={{ minWidth: 0 }}>
          <div className="tag">{node.tag}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{def.label}</div>
        </div>
      </div>

      {def.norm ? <div className="norm">{def.norm}</div> : null}

      <div className="prow">
        <label className="switch">
          <input
            type="checkbox"
            checked={!node.hideLabel}
            onChange={(e) => {
              pushHistory()
              updateNode(node.id, { hideLabel: !e.target.checked })
            }}
          />
          <span>Beschriftung im Schema anzeigen</span>
        </label>
      </div>

      <ParamGroups
        defs={def.params}
        values={values}
        visible={node.visible}
        onChange={(key, value) => setParam(node.id, key, value)}
        onToggleVisible={(key) => toggleVisible(node.id, key)}
      />
    </div>
  )
}

function EdgeInspector({ edge }: { edge: RltEdge }) {
  const doc = useStore((s) => s.doc)
  const setEdgeParam = useStore((s) => s.setEdgeParam)
  const toggleVisible = useStore((s) => s.toggleEdgeVisibleParam)
  const updateEdge = useStore((s) => s.updateEdge)
  const pushHistory = useStore((s) => s.pushHistory)
  const defs = edgeParamDefs(edge.kind)
  const values = useMemo(() => withComputedEdge(edge.kind, edge.params), [edge.kind, edge.params])
  const from = doc.nodes.find((n) => n.id === edge.a.node)
  const to = doc.nodes.find((n) => n.id === edge.b.node)
  const art = edge.kind === 'air' ? 'Luftkanal' : edge.kind === 'fluid' ? 'Rohrleitung' : 'Signalleitung'

  return (
    <div className="panel-scroll">
      <div className="tagline">
        <div>
          <div className="tag">{art}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{from?.tag ?? '?'} → {to?.tag ?? '?'}</div>
        </div>
      </div>

      {edge.kind === 'air' ? (
        <div className="prow">
          <div className="plabel"><span>Luftart</span></div>
          <select
            className="field"
            value={edge.air}
            onChange={(e) => {
              pushHistory()
              updateEdge(edge.id, { air: e.target.value as AirType })
            }}
          >
            {Object.entries(AIR_TYPES).map(([key, v]) => (
              <option key={key} value={key}>{v.label} ({v.abbr} / {v.en})</option>
            ))}
          </select>
          <p className="hint-text">Farbkennzeichnung nach üblicher Praxis: AUL grün, ZUL blau, ABL gelb, FOL braun, UML orange.</p>
        </div>
      ) : null}

      {edge.kind === 'fluid' ? (
        <div className="prow">
          <div className="plabel"><span>Medium</span></div>
          <select
            className="field"
            value={edge.fluid}
            onChange={(e) => {
              pushHistory()
              updateEdge(edge.id, { fluid: e.target.value as FluidType })
            }}
          >
            {Object.entries(FLUID_TYPES).map(([key, v]) => (
              <option key={key} value={key}>{v.label}</option>
            ))}
          </select>
        </div>
      ) : null}

      <ParamGroups
        defs={defs}
        values={values}
        visible={edge.visible}
        onChange={(key, value) => setEdgeParam(edge.id, key, value)}
        onToggleVisible={(key) => toggleVisible(edge.id, key)}
      />
    </div>
  )
}

function ParamGroups({
  defs, values, visible, onChange, onToggleVisible,
}: {
  defs: ParamDef[]
  values: ParamValues
  visible: string[]
  onChange: (key: string, value: ParamValue) => void
  onToggleVisible: (key: string) => void
}) {
  const groups = useMemo(() => {
    const map = new Map<string, ParamDef[]>()
    for (const d of defs) {
      const g = d.group ?? 'Allgemein'
      const arr = map.get(g) ?? []
      arr.push(d)
      map.set(g, arr)
    }
    return Array.from(map.entries())
  }, [defs])

  return (
    <>
      {groups.map(([name, items]) => (
        <div className="pgroup" key={name}>
          <h3>{name}</h3>
          {items.map((d) => (
            <ParamRow
              key={d.key}
              def={d}
              value={values[d.key] ?? null}
              shown={visible.includes(d.key)}
              onChange={(v) => onChange(d.key, v)}
              onToggleVisible={() => onToggleVisible(d.key)}
            />
          ))}
        </div>
      ))}
    </>
  )
}

function ParamRow({
  def, value, shown, onChange, onToggleVisible,
}: {
  def: ParamDef
  value: ParamValue
  shown: boolean
  onChange: (v: ParamValue) => void
  onToggleVisible: () => void
}) {
  const eye = (
    <button
      className="eye"
      aria-pressed={shown}
      onClick={onToggleVisible}
      title={shown ? 'Wird am Symbol angezeigt' : 'Am Symbol anzeigen'}
      aria-label={shown ? 'Beschriftung am Symbol ausblenden' : 'Beschriftung am Symbol anzeigen'}
    >
      {shown ? <IconEye /> : <IconEyeOff />}
    </button>
  )

  if (def.type === 'boolean') {
    return (
      <div className="prow">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label className="switch" style={{ flex: '1 1 auto' }}>
            <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
            <span style={{ fontSize: 13 }}>{def.label}</span>
          </label>
          {eye}
        </div>
        {def.hint ? <p className="hint-text">{def.hint}</p> : null}
      </div>
    )
  }

  return (
    <div className="prow">
      <div className="plabel">
        <span>{def.label}</span>
        {eye}
      </div>
      <div className="pinput">
        {def.type === 'computed' ? (
          <div className={`computed${value === null || value === '' ? ' empty' : ''}`}>
            {value === null || value === '' ? 'wird berechnet' : formatValue(def, value)}
          </div>
        ) : def.type === 'select' ? (
          <select className="field" value={String(value ?? '')} onChange={(e) => onChange(e.target.value || null)}>
            <option value="">—</option>
            {def.options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : def.type === 'multiline' ? (
          <textarea
            className="field"
            value={String(value ?? '')}
            placeholder={def.placeholder}
            onChange={(e) => onChange(e.target.value || null)}
          />
        ) : def.type === 'number' ? (
          <>
            <input
              className="field"
              type="number"
              inputMode="decimal"
              step={def.step ?? 'any'}
              min={def.min}
              max={def.max}
              value={value === null || value === undefined ? '' : String(value)}
              placeholder={def.placeholder}
              onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            />
            {def.unit ? <span className="unit">{def.unit}</span> : null}
          </>
        ) : (
          <input
            className="field"
            type="text"
            value={String(value ?? '')}
            placeholder={def.placeholder}
            onChange={(e) => onChange(e.target.value || null)}
          />
        )}
      </div>
      {def.hint ? <p className="hint-text">{def.hint}</p> : null}
    </div>
  )
}

import { useMemo, useRef, useState } from 'react'
import { CATEGORIES, SYMBOLS, searchSymbols } from '../catalog'
import type { CategoryId, SymbolDef } from '../catalog/types'
import { canvasApi } from '../canvas/api'
import { useStore } from '../state/store'
import { IconClose, IconSearch } from './icons'
import { SymbolPreview } from './SymbolPreview'

interface Ghost {
  def: SymbolDef
  x: number
  y: number
}

export function Palette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'alle'>('alle')
  const [ghost, setGhost] = useState<Ghost | null>(null)
  const armed = useStore((s) => s.armed)
  const setArmed = useStore((s) => s.setArmed)
  const addNode = useStore((s) => s.addNode)
  const dark = useStore((s) => s.settings.theme) === 'dunkel'
  const dragState = useRef<{ def: SymbolDef; startX: number; startY: number; moved: boolean } | null>(null)

  const list = useMemo(() => {
    const base = query.trim() ? searchSymbols(query) : SYMBOLS
    return category === 'alle' ? base : base.filter((s) => s.category === category)
  }, [query, category])

  const grouped = useMemo(() => {
    const map = new Map<CategoryId, SymbolDef[]>()
    for (const s of list) {
      const arr = map.get(s.category) ?? []
      arr.push(s)
      map.set(s.category, arr)
    }
    return CATEGORIES.map((c) => ({ cat: c, items: map.get(c.id) ?? [] })).filter((g) => g.items.length > 0)
  }, [list])

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, def: SymbolDef) => {
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* Ohne Zeigerfang bleibt Antippen und Ziehen innerhalb der Palette möglich. */
    }
    dragState.current = { def, startX: e.clientX, startY: e.clientY, moved: false }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragState.current
    if (!st) return
    const moved = Math.hypot(e.clientX - st.startX, e.clientY - st.startY) > 8
    if (moved) {
      st.moved = true
      setGhost({ def: st.def, x: e.clientX, y: e.clientY })
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragState.current
    dragState.current = null
    setGhost(null)
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* Zeiger war nicht erfasst */
    }
    if (!st) return
    if (st.moved) {
      if (canvasApi.isInside?.(e.clientX, e.clientY) && canvasApi.screenToWorld) {
        const p = canvasApi.screenToWorld(e.clientX, e.clientY)
        addNode(st.def.id, p.x, p.y, { center: true })
        setArmed(null)
      }
      return
    }
    // Antippen: Symbol vormerken, dann auf die Fläche tippen.
    setArmed(armed === st.def.id ? null : st.def.id)
  }

  return (
    <aside className="palette" aria-label="Symbolpalette">
      <div className="panel-head">
        <h2>Symbole<span className="sub">{SYMBOLS.length} Normsymbole</span></h2>
        <button className="iconbtn" onClick={onClose} aria-label="Palette schließen"><IconClose /></button>
      </div>

      <div className="palette-search">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: 10, color: 'var(--muted)' }}><IconSearch /></span>
          <input
            className="field"
            style={{ paddingLeft: 34 }}
            placeholder="Symbol suchen"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            inputMode="search"
            aria-label="Symbol suchen"
          />
        </div>
      </div>

      <div className="palette-cats" role="group" aria-label="Kategorien">
        <button className="chip" aria-pressed={category === 'alle'} onClick={() => setCategory('alle')}>Alle</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className="chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
            {c.short}
          </button>
        ))}
      </div>

      <div className="palette-list">
        {grouped.length === 0 ? <p className="empty-hint">Kein Symbol gefunden.</p> : null}
        {grouped.map((g) => (
          <div key={g.cat.id}>
            <div className="palette-group-title">{g.cat.label}</div>
            <div className="palette-grid">
              {g.items.map((def) => (
                <button
                  key={def.id}
                  className="palette-item"
                  aria-pressed={armed === def.id}
                  title={`${def.label}${def.norm ? ` — ${def.norm}` : ''}`}
                  onPointerDown={(e) => onPointerDown(e, def)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <SymbolPreview def={def} dark={dark} />
                  <span>{def.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {ghost ? (
        <div className="palette-ghost" style={{ left: ghost.x - 28, top: ghost.y - 24 }}>
          <SymbolPreview def={ghost.def} w={52} h={38} dark={dark} />
        </div>
      ) : null}
    </aside>
  )
}

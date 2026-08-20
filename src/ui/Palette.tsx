import { useMemo, useRef, useState } from 'react'
import { CATEGORIES, SYMBOLS, searchSymbols } from '../catalog'
import type { CategoryId, SymbolDef } from '../catalog/types'
import { UMFAENGE, anzahlImUmfang, symbolImUmfang } from '../catalog/umfang'
import { canvasApi } from '../canvas/api'
import { useStore } from '../state/store'
import { IconClose, IconSearch } from './icons'
import { SymbolPreview } from './SymbolPreview'

/** Ab dieser Strecke gilt eine Bewegung als Ziehen und nicht mehr als Tippen. */
const ZIEH_SCHWELLE = 10
/**
 * Ab diesem Verhältnis von senkrechter zu waagerechter Strecke gilt eine
 * Fingerbewegung als Blättern. Schräge Bewegungen bleiben ein Ziehen, damit
 * der Weg zur Zeichenfläche nicht genau waagerecht sein muss.
 */
const BLAETTER_VERHAELTNIS = 1.5

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
  const umfang = useStore((s) => s.settings.symbolumfang)
  const setSettings = useStore((s) => s.setSettings)
  const dark = useStore((s) => s.settings.theme) === 'dunkel'
  const dragState = useRef<{
    def: SymbolDef
    startX: number
    startY: number
    zeiger: number
    ziehen: boolean
    verworfen: boolean
  } | null>(null)

  // Suche und Kategorie filtern den gesamten Katalog; der Umfang legt danach
  // fest, was davon in der Palette erscheint.
  const passend = useMemo(() => {
    const base = query.trim() ? searchSymbols(query) : SYMBOLS
    return category === 'alle' ? base : base.filter((s) => s.category === category)
  }, [query, category])

  const sichtbar = useMemo(() => passend.filter((s) => symbolImUmfang(s.id, umfang)), [passend, umfang])
  const verborgen = passend.length - sichtbar.length

  const grouped = useMemo(() => {
    const map = new Map<CategoryId, SymbolDef[]>()
    for (const s of sichtbar) {
      const arr = map.get(s.category) ?? []
      arr.push(s)
      map.set(s.category, arr)
    }
    return CATEGORIES.map((c) => ({ cat: c, items: map.get(c.id) ?? [] })).filter((g) => g.items.length > 0)
  }, [sichtbar])

  // Der Zeiger wird bewusst erst gefangen, wenn aus der Bewegung ein Ziehen
  // geworden ist. Vorher soll der Browser frei blättern können.
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, def: SymbolDef) => {
    dragState.current = {
      def,
      startX: e.clientX,
      startY: e.clientY,
      zeiger: e.pointerId,
      ziehen: false,
      verworfen: false,
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragState.current
    if (!st || st.verworfen) return
    const dx = e.clientX - st.startX
    const dy = e.clientY - st.startY

    if (!st.ziehen) {
      if (Math.hypot(dx, dy) < ZIEH_SCHWELLE) return
      // Am Finger ist eine überwiegend senkrechte Bewegung ein Blättern in der
      // Liste und kein Ziehen eines Symbols.
      if (e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) * BLAETTER_VERHAELTNIS) {
        st.verworfen = true
        return
      }
      st.ziehen = true
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        /* Ohne Zeigerfang bleibt das Ziehen innerhalb der Palette möglich. */
      }
    }
    setGhost({ def: st.def, x: e.clientX, y: e.clientY })
  }

  const beenden = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragState.current
    dragState.current = null
    setGhost(null)
    if (st?.ziehen) {
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(st.zeiger)
      } catch {
        /* Zeiger war nicht erfasst */
      }
    }
    return st
  }

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = beenden(e)
    if (!st || st.verworfen) return
    if (st.ziehen) {
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

  // Übernimmt der Browser die Geste zum Blättern, bricht er den Zeiger ab.
  // Daraus darf weder ein Ziehen noch ein Antippen werden.
  const onPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    beenden(e)
  }

  return (
    <aside className="palette" aria-label="Symbolpalette">
      <div className="panel-head">
        <h2>
          Symbole
          <span className="sub">{anzahlImUmfang(umfang)} von {SYMBOLS.length} Normsymbolen</span>
        </h2>
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

        <div className="palette-umfang" role="group" aria-label="Umfang der Bibliothek">
          {UMFAENGE.map((u) => (
            <button
              key={u.id}
              className="seg"
              aria-pressed={umfang === u.id}
              title={`${u.label} — ${u.hinweis} (${anzahlImUmfang(u.id)} Symbole)`}
              onClick={() => setSettings({ symbolumfang: u.id })}
            >
              {u.label}
            </button>
          ))}
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
        {grouped.length === 0 && verborgen === 0 ? <p className="empty-hint">Kein Symbol gefunden.</p> : null}

        {verborgen > 0 ? (
          <p className="umfang-hinweis">
            {verborgen === 1
              ? 'Ein weiteres Symbol liegt außerhalb des gewählten Umfangs.'
              : `${verborgen} weitere Symbole liegen außerhalb des gewählten Umfangs.`}{' '}
            <button className="linkbtn" onClick={() => setSettings({ symbolumfang: 'gross' })}>
              Vollen Satz anzeigen
            </button>
          </p>
        ) : null}

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
                  onPointerCancel={onPointerCancel}
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

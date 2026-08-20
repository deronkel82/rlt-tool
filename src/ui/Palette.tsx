import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
/** So lange auf einer Kachel verweilen hebt das Symbol zum Ziehen an. */
const HALTEDAUER = 320

interface Ghost {
  def: SymbolDef
  x: number
  y: number
}

interface ZiehZustand {
  def: SymbolDef
  startX: number
  startY: number
  letztX: number
  letztY: number
  zeiger: number
  ziel: HTMLElement
  ziehen: boolean
  verworfen: boolean
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

  const zustand = useRef<ZiehZustand | null>(null)
  const halteUhr = useRef<number | null>(null)
  const paletteRef = useRef<HTMLElement>(null)

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

  const uhrLoeschen = useCallback(() => {
    if (halteUhr.current !== null) {
      window.clearTimeout(halteUhr.current)
      halteUhr.current = null
    }
  }, [])

  useEffect(() => uhrLoeschen, [uhrLoeschen])

  /** Symbol anheben: ab hier gehört die Geste uns. */
  const anheben = useCallback((st: ZiehZustand) => {
    st.ziehen = true
    try {
      st.ziel.setPointerCapture(st.zeiger)
    } catch {
      /* Ohne Zeigerfang bleibt das Ziehen möglich, solange der Finger liegt. */
    }
    setGhost({ def: st.def, x: st.letztX, y: st.letztY })
  }, [])

  /**
   * Ablegen. Über der Palette selbst wird nichts gesetzt — dort läge das
   * Bauteil hinter dem Fenster. Stattdessen bleibt das Symbol vorgemerkt,
   * sodass ein Tippen auf die Fläche es platziert.
   */
  const ablegen = useCallback(
    (def: SymbolDef, x: number, y: number): boolean => {
      const p = paletteRef.current?.getBoundingClientRect()
      const ueberPalette = !!p && x >= p.left && x <= p.right && y >= p.top && y <= p.bottom
      if (!ueberPalette && canvasApi.isInside?.(x, y) && canvasApi.screenToWorld) {
        const welt = canvasApi.screenToWorld(x, y)
        addNode(def.id, welt.x, welt.y, { center: true })
        setArmed(null)
        return true
      }
      setArmed(def.id)
      return false
    },
    [addNode, setArmed],
  )

  const beenden = useCallback((): ZiehZustand | null => {
    const st = zustand.current
    zustand.current = null
    uhrLoeschen()
    setGhost(null)
    if (st?.ziehen) {
      try {
        st.ziel.releasePointerCapture(st.zeiger)
      } catch {
        /* Zeiger war nicht erfasst */
      }
    }
    return st
  }, [uhrLoeschen])

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, def: SymbolDef) => {
    const st: ZiehZustand = {
      def,
      startX: e.clientX,
      startY: e.clientY,
      letztX: e.clientX,
      letztY: e.clientY,
      zeiger: e.pointerId,
      ziel: e.currentTarget,
      ziehen: false,
      verworfen: false,
    }
    zustand.current = st
    uhrLoeschen()
    // Liegt der Finger ruhig, wird das Symbol angehoben. Das ist der Weg, der
    // nicht davon abhängt, wie der Browser die Bewegung einordnet.
    halteUhr.current = window.setTimeout(() => {
      halteUhr.current = null
      const akt = zustand.current
      if (akt === st && !akt.verworfen && !akt.ziehen) anheben(akt)
    }, HALTEDAUER)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = zustand.current
    if (!st) return
    st.letztX = e.clientX
    st.letztY = e.clientY
    if (st.verworfen) return

    if (!st.ziehen) {
      const dx = e.clientX - st.startX
      const dy = e.clientY - st.startY
      if (Math.hypot(dx, dy) < ZIEH_SCHWELLE) return
      uhrLoeschen()
      // Am Finger ist eine deutlich senkrechte Bewegung ein Blättern in der
      // Liste und kein Ziehen eines Symbols.
      if (e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) * BLAETTER_VERHAELTNIS) {
        st.verworfen = true
        return
      }
      anheben(st)
      return
    }
    setGhost({ def: st.def, x: e.clientX, y: e.clientY })
  }

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = beenden()
    if (!st || st.verworfen) return
    if (st.ziehen) {
      ablegen(st.def, e.clientX, e.clientY)
      return
    }
    // Antippen: Symbol vormerken, dann auf die Fläche tippen.
    setArmed(armed === st.def.id ? null : st.def.id)
  }

  /**
   * Der Browser bricht den Zeiger ab, wenn er die Geste selbst übernimmt.
   * Hing bereits ein Symbol am Finger, ist die Absicht eindeutig — dann wird
   * an der zuletzt bekannten Stelle abgelegt, statt die Geste zu verlieren.
   */
  const onPointerCancel = () => {
    const st = beenden()
    if (st?.ziehen) ablegen(st.def, st.letztX, st.letztY)
  }

  return (
    <aside className={`palette${ghost ? ' hebt' : ''}`} aria-label="Symbolpalette" ref={paletteRef}>
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
                  className={`palette-item${ghost?.def.id === def.id ? ' angehoben' : ''}`}
                  aria-pressed={armed === def.id}
                  title={`${def.label}${def.norm ? ` — ${def.norm}` : ''}`}
                  onPointerDown={(e) => onPointerDown(e, def)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerCancel}
                  onContextMenu={(e) => e.preventDefault()}
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

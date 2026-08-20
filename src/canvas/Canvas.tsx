import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { requireSymbol } from '../catalog'
import { FONT } from '../format'
import { contentBounds, useStore } from '../state/store'
import type { RltNode } from '../state/types'
import { themeDark, themeLight } from '../theme'
import { canvasApi } from './api'
import {
  dist, findPort, nodeBounds, polylinePath, portPoint, rectsIntersect, routeOrthogonal, snap,
  type Pt, type Rect,
} from './geometry'
import { EdgeLine, Schematic, edgePoints, nodeLabelLage } from './Schematic'
import { findSnap, nearestPort } from './snapping'

type Gesture =
  | { kind: 'none' }
  | { kind: 'pan'; startClient: Pt; startVp: Pt }
  | { kind: 'drag'; ids: string[]; startWorld: Pt; orig: Record<string, Pt>; moved: boolean }
  | { kind: 'label'; id: string; isEdge: boolean; startWorld: Pt; orig: Pt }
  | { kind: 'connect'; from: { node: string; port: string }; cursor: Pt }
  | { kind: 'marquee'; start: Pt; cur: Pt }
  | { kind: 'resize'; id: string; startWorld: Pt; orig: { w: number; h: number } }
  | { kind: 'edgeoffset'; id: string; startWorld: Pt; startOffset: number; horizontal: boolean }

const MIN_ZOOM = 0.15
const MAX_ZOOM = 4
const PORT_HIT = 15

export function Canvas() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })

  const doc = useStore((s) => s.doc)
  const selection = useStore((s) => s.selection)
  const viewport = useStore((s) => s.viewport)
  const tool = useStore((s) => s.tool)
  const settings = useStore((s) => s.settings)
  const armed = useStore((s) => s.armed)

  const theme = settings.theme === 'dunkel' ? themeDark : themeLight
  const renderOpts = useMemo(() => ({ theme, farbcode: settings.farbcode, labels: true }), [theme, settings.farbcode])

  const gesture = useRef<Gesture>({ kind: 'none' })
  const pointers = useRef(new Map<number, Pt>())
  const pinch = useRef<{ d0: number; c0: Pt; vp0: { x: number; y: number; zoom: number } } | null>(null)
  const [, forceRender] = useState(0)
  const rerender = useCallback(() => forceRender((v) => v + 1), [])

  // Größe der Zeichenfläche verfolgen und dabei den Bildmittelpunkt halten,
  // damit beim Drehen des Geräts nichts aus dem Bild laeuft.
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let prev = { w: el.clientWidth, h: el.clientHeight }
    const ro = new ResizeObserver(() => {
      const next = { w: el.clientWidth, h: el.clientHeight }
      if (next.w === prev.w && next.h === prev.h) return
      const vp = useStore.getState().viewport
      if (prev.w > 0 && prev.h > 0 && next.w > 0 && next.h > 0) {
        useStore.getState().setViewport({
          x: vp.x - (next.w - prev.w) / 2 / vp.zoom,
          y: vp.y - (next.h - prev.h) / 2 / vp.zoom,
        })
      }
      prev = next
      setSize(next)
    })
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const toWorld = useCallback(
    (clientX: number, clientY: number): Pt => {
      const rect = svgRef.current?.getBoundingClientRect()
      const vp = useStore.getState().viewport
      if (!rect) return { x: 0, y: 0 }
      return { x: (clientX - rect.left) / vp.zoom + vp.x, y: (clientY - rect.top) / vp.zoom + vp.y }
    },
    [],
  )

  const fitToContent = useCallback(() => {
    const b = contentBounds(useStore.getState().doc)
    const el = wrapRef.current
    if (!el) return
    const vw = el.clientWidth
    const vh = el.clientHeight
    if (!b) {
      useStore.getState().setViewport({ x: -vw / 2 + 200, y: -vh / 2 + 120, zoom: 1 })
      return
    }
    const pad = 70
    const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(vw / (b.w + pad * 2), vh / (b.h + pad * 2))))
    useStore.getState().setViewport({
      zoom,
      x: b.x + b.w / 2 - vw / 2 / zoom,
      y: b.y + b.h / 2 - vh / 2 / zoom,
    })
  }, [])

  const zoomBy = useCallback((factor: number) => {
    const el = wrapRef.current
    if (!el) return
    const vp = useStore.getState().viewport
    const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, vp.zoom * factor))
    const cx = el.clientWidth / 2
    const cy = el.clientHeight / 2
    const wx = vp.x + cx / vp.zoom
    const wy = vp.y + cy / vp.zoom
    useStore.getState().setViewport({ zoom, x: wx - cx / zoom, y: wy - cy / zoom })
  }, [])

  useEffect(() => {
    canvasApi.screenToWorld = toWorld
    canvasApi.isInside = (cx, cy) => {
      const rect = svgRef.current?.getBoundingClientRect()
      return !!rect && cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom
    }
    canvasApi.centerWorld = () => {
      const el = wrapRef.current
      const vp = useStore.getState().viewport
      if (!el) return { x: 0, y: 0 }
      return { x: vp.x + el.clientWidth / 2 / vp.zoom, y: vp.y + el.clientHeight / 2 / vp.zoom }
    }
    canvasApi.fitToContent = fitToContent
    canvasApi.zoomBy = zoomBy
    return () => {
      canvasApi.screenToWorld = null
      canvasApi.isInside = null
      canvasApi.centerWorld = null
      canvasApi.fitToContent = null
      canvasApi.zoomBy = null
    }
  }, [toWorld, fitToContent, zoomBy])

  // Tastaturbedienung am Schreibtisch
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      const st = useStore.getState()
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) st.redo()
        else st.undo()
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        st.duplicateSelection()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (st.selection.length) {
          e.preventDefault()
          st.deleteSelection()
        }
      } else if (e.key.toLowerCase() === 'r') {
        st.rotateSelection(e.shiftKey ? -90 : 90)
      } else if (e.key.toLowerCase() === 'h') {
        st.flipSelection()
      } else if (e.key === 'Escape') {
        st.clearSelection()
        st.setArmed(null)
        gesture.current = { kind: 'none' }
        rerender()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rerender])

  const applyPinch = useCallback(() => {
    const pts = Array.from(pointers.current.values())
    if (pts.length < 2 || !pinch.current) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const d = dist(pts[0], pts[1])
    const c: Pt = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
    const { d0, c0, vp0 } = pinch.current
    const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, (vp0.zoom * d) / (d0 || 1)))
    const world0 = { x: (c0.x - rect.left) / vp0.zoom + vp0.x, y: (c0.y - rect.top) / vp0.zoom + vp0.y }
    useStore.getState().setViewport({
      zoom,
      x: world0.x - (c.x - rect.left) / zoom,
      y: world0.y - (c.y - rect.top) / zoom,
    })
  }, [])

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values())
      pinch.current = {
        d0: dist(pts[0], pts[1]),
        c0: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
        vp0: { ...useStore.getState().viewport },
      }
      gesture.current = { kind: 'none' }
      rerender()
      return
    }
    if (pointers.current.size > 2) return

    try {
      svg.setPointerCapture(e.pointerId)
    } catch {
      /* Ohne Zeigerfang funktioniert die Geste weiter, nur nicht über den Rand hinaus. */
    }
    const world = toWorld(e.clientX, e.clientY)
    const st = useStore.getState()
    const el = e.target as Element
    const portEl = el.closest('[data-port]')
    const handleEl = el.closest('[data-handle]')
    const labelEl = el.closest('[data-label]')
    const nodeEl = el.closest('[data-node]')
    const edgeEl = el.closest('[data-edge]')

    if (handleEl) {
      const kind = handleEl.getAttribute('data-handle')
      const id = handleEl.getAttribute('data-id') ?? ''
      if (kind === 'resize') {
        const node = st.doc.nodes.find((n) => n.id === id)
        if (node) {
          st.pushHistory()
          gesture.current = { kind: 'resize', id, startWorld: world, orig: { w: node.w, h: node.h } }
        }
      } else if (kind === 'edge') {
        const edge = st.doc.edges.find((x) => x.id === id)
        const pts = edge ? edgePoints(st.doc, edge) : null
        if (edge && pts) {
          st.pushHistory()
          const a = pts[Math.floor(pts.length / 2) - 1] ?? pts[0]
          const b = pts[Math.floor(pts.length / 2)] ?? pts[pts.length - 1]
          gesture.current = {
            kind: 'edgeoffset',
            id,
            startWorld: world,
            startOffset: edge.offset,
            horizontal: Math.abs(a.y - b.y) > Math.abs(a.x - b.x),
          }
        }
      }
      rerender()
      return
    }

    if (portEl) {
      const node = portEl.getAttribute('data-node') ?? ''
      const port = portEl.getAttribute('data-port') ?? ''
      gesture.current = { kind: 'connect', from: { node, port }, cursor: world }
      rerender()
      return
    }

    if (labelEl) {
      const id = labelEl.getAttribute('data-label') ?? ''
      const isEdge = labelEl.getAttribute('data-kind') === 'edge'
      const item = isEdge ? st.doc.edges.find((x) => x.id === id) : st.doc.nodes.find((x) => x.id === id)
      if (item) {
        st.pushHistory()
        gesture.current = { kind: 'label', id, isEdge, startWorld: world, orig: { x: item.labelDx, y: item.labelDy } }
        rerender()
        return
      }
    }

    if (nodeEl) {
      const id = nodeEl.getAttribute('data-node') ?? ''
      const additive = e.shiftKey || e.metaKey || e.ctrlKey
      let ids = st.selection
      if (additive) {
        st.toggleSelect(id)
        ids = useStore.getState().selection
      } else if (!st.selection.includes(id)) {
        st.select([id])
        ids = [id]
      }
      const dragIds = ids.filter((x) => st.doc.nodes.some((n) => n.id === x))
      const orig: Record<string, Pt> = {}
      for (const nid of dragIds) {
        const n = st.doc.nodes.find((x) => x.id === nid)
        if (n) orig[nid] = { x: n.x, y: n.y }
      }
      st.pushHistory()
      gesture.current = { kind: 'drag', ids: dragIds, startWorld: world, orig, moved: false }
      rerender()
      return
    }

    if (edgeEl) {
      const id = edgeEl.getAttribute('data-edge') ?? ''
      st.select([id], e.shiftKey)
      gesture.current = { kind: 'none' }
      rerender()
      return
    }

    // Leere Fläche
    if (armed) {
      st.addNode(armed, world.x, world.y, { center: true })
      st.setArmed(null)
      gesture.current = { kind: 'none' }
      rerender()
      return
    }
    if (tool === 'lasso' || e.pointerType === 'pen') {
      gesture.current = { kind: 'marquee', start: world, cur: world }
    } else {
      if (!e.shiftKey) st.clearSelection()
      gesture.current = { kind: 'pan', startClient: { x: e.clientX, y: e.clientY }, startVp: { x: viewport.x, y: viewport.y } }
    }
    rerender()
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size >= 2) {
      applyPinch()
      return
    }
    const g = gesture.current
    if (g.kind === 'none') return
    const st = useStore.getState()
    const world = toWorld(e.clientX, e.clientY)

    if (g.kind === 'pan') {
      const vp = useStore.getState().viewport
      st.setViewport({
        x: g.startVp.x - (e.clientX - g.startClient.x) / vp.zoom,
        y: g.startVp.y - (e.clientY - g.startClient.y) / vp.zoom,
      })
      return
    }
    if (g.kind === 'drag') {
      let dx = world.x - g.startWorld.x
      let dy = world.y - g.startWorld.y
      if (settings.fangen) {
        const first = g.ids[0]
        if (first && g.orig[first]) {
          dx = snap(g.orig[first].x + dx, settings.rasterweite) - g.orig[first].x
          dy = snap(g.orig[first].y + dy, settings.rasterweite) - g.orig[first].y
        }
      }
      const positions: Record<string, Pt> = {}
      for (const id of g.ids) {
        const o = g.orig[id]
        if (o) positions[id] = { x: o.x + dx, y: o.y + dy }
      }
      st.setNodePositions(positions)
      gesture.current = { ...g, moved: true }
      return
    }
    if (g.kind === 'label') {
      const dx = world.x - g.startWorld.x
      const dy = world.y - g.startWorld.y
      if (g.isEdge) st.updateEdge(g.id, { labelDx: g.orig.x + dx, labelDy: g.orig.y + dy })
      else st.updateNode(g.id, { labelDx: g.orig.x + dx, labelDy: g.orig.y + dy })
      return
    }
    if (g.kind === 'connect') {
      gesture.current = { ...g, cursor: world }
      rerender()
      return
    }
    if (g.kind === 'marquee') {
      gesture.current = { ...g, cur: world }
      rerender()
      return
    }
    if (g.kind === 'resize') {
      const node = st.doc.nodes.find((n) => n.id === g.id)
      if (!node) return
      const def = requireSymbol(node.type)
      let w = g.orig.w + (world.x - g.startWorld.x)
      let h = g.orig.h + (world.y - g.startWorld.y)
      if (settings.fangen) {
        w = snap(w, settings.rasterweite)
        h = snap(h, settings.rasterweite)
      }
      st.updateNode(g.id, { w: Math.max(def.minW ?? 24, w), h: Math.max(def.minH ?? 24, h) })
      return
    }
    if (g.kind === 'edgeoffset') {
      const delta = g.horizontal ? world.x - g.startWorld.x : world.y - g.startWorld.y
      st.updateEdge(g.id, { offset: g.startOffset + delta })
      return
    }
  }

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    try {
      svgRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* Zeiger war nicht erfasst */
    }
    const g = gesture.current
    const st = useStore.getState()

    if (g.kind === 'drag' && g.moved && settings.strangModus && g.ids.length === 1) {
      const node = st.doc.nodes.find((n) => n.id === g.ids[0])
      if (node) {
        const hit = findSnap(st.doc, node)
        if (hit) {
          st.updateNode(node.id, { x: node.x + hit.dx, y: node.y + hit.dy })
          st.connect(hit.from, hit.to)
        }
      }
    }

    if (g.kind === 'connect') {
      const target = nearestPort(st.doc, g.cursor, PORT_HIT * 2, (nodeId) => nodeId !== g.from.node)
      if (target) st.connect(g.from, { node: target.node, port: target.port })
    }

    if (g.kind === 'marquee') {
      const r: Rect = {
        x: Math.min(g.start.x, g.cur.x),
        y: Math.min(g.start.y, g.cur.y),
        w: Math.abs(g.cur.x - g.start.x),
        h: Math.abs(g.cur.y - g.start.y),
      }
      const ids = st.doc.nodes.filter((n) => rectsIntersect(nodeBounds(n), r)).map((n) => n.id)
      st.select(ids, e.shiftKey)
    }

    gesture.current = { kind: 'none' }
    rerender()
  }

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const vp = useStore.getState().viewport
    if (e.ctrlKey || e.metaKey) {
      const factor = Math.exp(-e.deltaY * 0.01)
      const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, vp.zoom * factor))
      const wx = (e.clientX - rect.left) / vp.zoom + vp.x
      const wy = (e.clientY - rect.top) / vp.zoom + vp.y
      useStore.getState().setViewport({
        zoom,
        x: wx - (e.clientX - rect.left) / zoom,
        y: wy - (e.clientY - rect.top) / zoom,
      })
    } else {
      useStore.getState().setViewport({ x: vp.x + e.deltaX / vp.zoom, y: vp.y + e.deltaY / vp.zoom })
    }
  }

  const selectionSet = useMemo(() => new Set(selection), [selection])
  const gridSize = settings.rasterweite * 4 * viewport.zoom
  const g = gesture.current
  const showAllPorts = tool === 'kanal' || g.kind === 'connect'

  const connectPreview = (() => {
    if (g.kind !== 'connect') return null
    const node = doc.nodes.find((n) => n.id === g.from.node)
    if (!node) return null
    const port = findPort(requireSymbol(node.type), g.from.port)
    if (!port) return null
    const from = portPoint(node, port)
    const target = nearestPort(doc, g.cursor, PORT_HIT * 2, (nodeId) => nodeId !== g.from.node)
    let to = { x: g.cursor.x, y: g.cursor.y, dir: from.dir }
    if (target) {
      const tn = doc.nodes.find((n) => n.id === target.node)
      const tp = tn ? findPort(requireSymbol(tn.type), target.port) : undefined
      if (tn && tp) to = portPoint(tn, tp)
    }
    return { d: polylinePath(routeOrthogonal(from, to, 0)), valid: !!target }
  })()

  return (
    <div ref={wrapRef} className="canvas-wrap">
      <svg
        ref={svgRef}
        className="canvas"
        width={size.w}
        height={size.h}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        style={{ touchAction: 'none', background: theme.bg }}
      >
        <defs>
          <pattern
            id="rlt-grid"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
            x={-viewport.x * viewport.zoom}
            y={-viewport.y * viewport.zoom}
          >
            <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke={theme.grid} strokeWidth={1} />
          </pattern>
        </defs>
        {settings.raster ? <rect width={size.w} height={size.h} fill="url(#rlt-grid)" /> : null}

        <g transform={`scale(${viewport.zoom}) translate(${-viewport.x} ${-viewport.y})`}>
          <g style={{ pointerEvents: 'none' }}>
            <Schematic doc={doc} o={renderOpts} />
          </g>

          <InteractionLayer
            selection={selectionSet}
            showAllPorts={showAllPorts}
            zoom={viewport.zoom}
            themeAccent={theme.accent}
          />

          {connectPreview ? (
            <path
              d={connectPreview.d}
              fill="none"
              stroke={connectPreview.valid ? theme.accent : theme.muted}
              strokeWidth={2.4 / viewport.zoom + 1}
              strokeDasharray={connectPreview.valid ? undefined : '6 4'}
              style={{ pointerEvents: 'none' }}
            />
          ) : null}

          {g.kind === 'marquee' ? (
            <rect
              x={Math.min(g.start.x, g.cur.x)}
              y={Math.min(g.start.y, g.cur.y)}
              width={Math.abs(g.cur.x - g.start.x)}
              height={Math.abs(g.cur.y - g.start.y)}
              fill={theme.accent}
              fillOpacity={0.08}
              stroke={theme.accent}
              strokeWidth={1 / viewport.zoom}
              strokeDasharray={`${4 / viewport.zoom} ${3 / viewport.zoom}`}
              style={{ pointerEvents: 'none' }}
            />
          ) : null}
        </g>
      </svg>

      {armed ? (
        <div className="canvas-hint" role="status">
          {requireSymbol(armed).label} — auf die Fläche tippen zum Platzieren
        </div>
      ) : null}
      {doc.nodes.length === 0 && !armed ? (
        <div className="canvas-empty">
          <p>Noch nichts gezeichnet</p>
          <p className="hint">Symbol in der Palette antippen und dann auf die Fläche tippen — oder direkt herüberziehen.</p>
        </div>
      ) : null}
    </div>
  )
}

/** Trefferflächen, Anschlusspunkte und Auswahlmarkierungen. */
function InteractionLayer({
  selection, showAllPorts, zoom, themeAccent,
}: {
  selection: Set<string>
  showAllPorts: boolean
  zoom: number
  themeAccent: string
}) {
  const doc = useStore((s) => s.doc)
  const background: RltNode[] = []
  const foreground: RltNode[] = []
  for (const nd of doc.nodes) {
    if (requireSymbol(nd.type).layer === 'background') background.push(nd)
    else foreground.push(nd)
  }
  const s = 1 / zoom

  const hitRect = (nd: RltNode) => {
    const b = nodeBounds(nd)
    const def = requireSymbol(nd.type)
    if (def.layer === 'background') {
      // Nur der Rand ist Trefferfläche, damit Komponenten im Raum bedienbar bleiben.
      return (
        <g key={nd.id} data-node={nd.id}>
          <rect
            x={b.x} y={b.y} width={b.w} height={b.h}
            fill="none" stroke="transparent" strokeWidth={16 * s} style={{ cursor: 'move' }}
          />
          <rect x={b.x} y={b.y} width={b.w} height={Math.min(26, b.h)} fill="transparent" style={{ cursor: 'move' }} />
        </g>
      )
    }
    return (
      <rect
        key={nd.id} data-node={nd.id}
        x={b.x} y={b.y} width={b.w} height={b.h}
        fill="transparent" style={{ cursor: 'move' }}
      />
    )
  }

  return (
    <g>
      <g>{background.map(hitRect)}</g>
      <g>
        {doc.edges.map((e) => {
          const pts = edgePoints(doc, e)
          if (!pts) return null
          return (
            <path
              key={e.id} data-edge={e.id}
              d={polylinePath(pts)}
              fill="none" stroke="transparent" strokeWidth={Math.max(14 * s, 8)}
              style={{ cursor: 'pointer' }}
            />
          )
        })}
      </g>
      <g>{foreground.map(hitRect)}</g>

      {/* Auswahlmarkierung */}
      <g style={{ pointerEvents: 'none' }}>
        {doc.nodes.filter((n) => selection.has(n.id)).map((n) => {
          const b = nodeBounds(n)
          const pad = 5 * s
          return (
            <rect
              key={n.id}
              x={b.x - pad} y={b.y - pad} width={b.w + pad * 2} height={b.h + pad * 2}
              fill="none" stroke={themeAccent} strokeWidth={1.5 * s}
              strokeDasharray={`${5 * s} ${3 * s}`} rx={3 * s}
            />
          )
        })}
        {doc.edges.filter((e) => selection.has(e.id)).map((e) => {
          const pts = edgePoints(doc, e)
          if (!pts) return null
          return (
            <path
              key={e.id} d={polylinePath(pts)}
              fill="none" stroke={themeAccent} strokeWidth={6 * s} strokeOpacity={0.28} strokeLinecap="round"
            />
          )
        })}
      </g>

      {/* Griff zum Verschieben des Mittelsegments */}
      <g>
        {doc.edges.filter((e) => selection.has(e.id)).map((e) => {
          const pts = edgePoints(doc, e)
          if (!pts || pts.length < 3) return null
          const i = Math.floor(pts.length / 2)
          const a = pts[i - 1]
          const b = pts[i]
          const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
          return (
            <circle
              key={e.id} data-handle="edge" data-id={e.id}
              cx={mid.x} cy={mid.y} r={7 * s}
              fill="#ffffff" stroke={themeAccent} strokeWidth={1.8 * s}
              style={{ cursor: 'grab' }}
            />
          )
        })}
      </g>

      {/* Griff zum Skalieren */}
      <g>
        {doc.nodes.filter((n) => selection.has(n.id) && requireSymbol(n.type).resizable).map((n) => {
          const b = nodeBounds(n)
          return (
            <rect
              key={n.id} data-handle="resize" data-id={n.id}
              x={b.x + b.w - 7 * s} y={b.y + b.h - 7 * s} width={14 * s} height={14 * s} rx={3 * s}
              fill="#ffffff" stroke={themeAccent} strokeWidth={1.8 * s}
              style={{ cursor: 'nwse-resize' }}
            />
          )
        })}
      </g>

      {/* Anschlusspunkte */}
      <g>
        {doc.nodes.map((n) => {
          const def = requireSymbol(n.type)
          if (!showAllPorts && !selection.has(n.id)) return null
          return def.ports.map((p) => {
            const pw = portPoint(n, p)
            const used = doc.edges.some(
              (e) => (e.a.node === n.id && e.a.port === p.id) || (e.b.node === n.id && e.b.port === p.id),
            )
            return (
              <g key={`${n.id}:${p.id}`} data-node={n.id} data-port={p.id} style={{ cursor: 'crosshair' }}>
                <circle cx={pw.x} cy={pw.y} r={PORT_HIT * s} fill="transparent" />
                <circle
                  cx={pw.x} cy={pw.y} r={4.5 * s}
                  fill={used ? themeAccent : '#ffffff'} stroke={themeAccent} strokeWidth={1.6 * s}
                />
              </g>
            )
          })
        })}
      </g>

      {/* Trefferflächen der Beschriftungen */}
      <g>
        {doc.nodes.map((n) => {
          if (n.hideLabel) return null
          const { box } = nodeLabelLage(n, requireSymbol(n.type))
          return (
            <rect
              key={n.id} data-label={n.id} data-kind="node"
              x={box.x} y={box.y} width={box.w} height={box.h}
              fill="transparent" style={{ cursor: 'move' }}
            />
          )
        })}
      </g>
    </g>
  )
}

/** Vorschau einer Leitung, ausgelagert fuer die Wiederverwendung im Test. */
export { EdgeLine, FONT }

import type { SymbolDef } from '../catalog/types'
import { defaultParams, withComputed } from '../catalog'
import { themeDark, themeLight } from '../theme'

/** Kleine Vorschau eines Symbols fuer Palette und Listen. */
export function SymbolPreview({ def, w = 48, h = 34, dark = false }: { def: SymbolDef; w?: number; h?: number; dark?: boolean }) {
  const theme = dark ? themeDark : themeLight
  const pad = 3
  const vb = `${-pad} ${-pad} ${def.w + pad * 2} ${def.h + pad * 2}`
  const params = withComputed(def, defaultParams(def))
  return (
    <svg className="sympreview" width={w} height={h} viewBox={vb} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g strokeLinejoin="round">
        {def.draw({ w: def.w, h: def.h, tag: `${def.tagPrefix}-01`, p: params, t: theme, mono: false, rot: 0, flip: false })}
      </g>
    </svg>
  )
}

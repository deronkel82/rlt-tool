import type { ParamDef, ParamValue } from './catalog/types'

export const FONT = "'Helvetica Neue', Helvetica, Arial, 'Segoe UI', sans-serif"

const nf = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 3 })

/** Wert eines Parameters als Anzeigetext, leer wenn nichts gepflegt ist. */
export function formatValue(def: ParamDef | undefined, value: ParamValue): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'ja' : 'nein'
  if (typeof value === 'number') {
    const num = nf.format(value)
    return def?.unit ? `${num} ${def.unit}` : num
  }
  const text = String(value)
  if (def?.type === 'number' && def.unit) return `${text} ${def.unit}`
  return text
}

/** Kurzform fuer die Beschriftung am Symbol: "V̇ 5.400 m³/h". */
export function formatShort(def: ParamDef | undefined, value: ParamValue): string {
  const v = formatValue(def, value)
  if (!v) return ''
  const prefix = def?.short !== undefined ? def.short : def?.label ?? ''
  return prefix ? `${prefix} ${v}` : v
}

export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(value)
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

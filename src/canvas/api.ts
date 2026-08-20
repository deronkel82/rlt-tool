import type { Pt } from './geometry'

/**
 * Schnittstelle der Zeichenfläche fuer andere Bedienelemente, etwa um ein aus
 * der Palette gezogenes Symbol an der richtigen Stelle abzulegen.
 */
export const canvasApi: {
  screenToWorld: ((clientX: number, clientY: number) => Pt) | null
  isInside: ((clientX: number, clientY: number) => boolean) | null
  centerWorld: (() => Pt) | null
  fitToContent: (() => void) | null
  /** Vergrößern oder verkleinern um die Bildmitte */
  zoomBy: ((factor: number) => void) | null
} = {
  screenToWorld: null,
  isInside: null,
  centerWorld: null,
  fitToContent: null,
  zoomBy: null,
}

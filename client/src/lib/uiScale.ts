import { useLayoutEffect } from 'react'

// Like a game's UI scale: the interface is drawn once, on a 1600x1000 canvas, and scaled uniformly to
// fit the window. Smaller windows shrink it so pages don't scroll on a laptop; bigger ones (1440p, 4K)
// enlarge it instead of leaving a small column floating in empty space. Phones keep 1 because their
// layout stacks and scrolls anyway.
//
// Published on <html> and applied in nier.css with `zoom`:
//   --ui     the fit scale, MIN_SCALE..MAX_SCALE. The in-app screens use it.
//   --ui-up  the same, but never below 1. The intro screens (boot, title) use it: they size
//            themselves by window width already, so they only need help on windows bigger than the canvas.
export const DESIGN_W = 1600   // keep in step with .n-shell's max-width in nier.css
export const DESIGN_H = 1000
export const MIN_SCALE = 0.62
export const MAX_SCALE = 2
const PHONE_MAX_W = 760        // keep in step with the max-width:760px queries in nier.css

export function uiScale(w: number, h: number): number {
  if (w <= PHONE_MAX_W) return 1
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min(w / DESIGN_W, h / DESIGN_H)))
}

// Call once, at the top of the app, so every stage sees the variables.
export function useUiScale(): void {
  useLayoutEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const ui = uiScale(window.innerWidth, window.innerHeight)
      root.style.setProperty('--ui', ui.toFixed(3))
      root.style.setProperty('--ui-up', Math.max(1, ui).toFixed(3))
    }
    apply()
    window.addEventListener('resize', apply)
    return () => {
      window.removeEventListener('resize', apply)
      root.style.removeProperty('--ui')
      root.style.removeProperty('--ui-up')
    }
  }, [])
}

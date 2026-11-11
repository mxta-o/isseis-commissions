import { useEffect, useRef } from 'react'

export type NavKey = 'up' | 'down' | 'left' | 'right' | 'enter' | 'back'

const KEYS: Record<string, NavKey> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'enter', Escape: 'back',
}

// true while the user is typing somewhere, so keys keep their normal meaning in the field
function isEditing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

// Game-style keyboard navigation for a screen. Skipped while typing in a field or while a
// confirm dialog (role=alertdialog) is open, since that dialog is modal.
//  - arrows are always consumed (so the page doesn't scroll)
//  - Enter / Esc are only consumed when the handler returns true; otherwise they fall through
//    (Esc to App's global "back to menu", Enter to whatever button has focus)
// Listens in the capture phase so a screen can claim Esc before App's window listener sees it.
export function useArrowKeys(onKey: (key: NavKey) => boolean | void, enabled = true): void {
  const handler = useRef(onKey)
  handler.current = onKey

  useEffect(() => {
    if (!enabled) return
    const listener = (e: KeyboardEvent) => {
      const key = KEYS[e.key]
      if (!key || e.altKey || e.ctrlKey || e.metaKey || isEditing(e.target)) return
      if (document.querySelector('[role="alertdialog"]')) return
      const handled = handler.current(key)
      if (key === 'enter' || key === 'back') {
        if (handled !== true) return
        e.stopPropagation()
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', listener, true)
    return () => window.removeEventListener('keydown', listener, true)
  }, [enabled])
}

// step through a list with wrap-around
export function stepIndex(i: number, delta: number, length: number): number {
  return (i + delta + length) % length
}

import { useSyncExternalStore } from 'react'
import { PHONE_MAX_W } from './uiScale'

const QUERY = `(max-width: ${PHONE_MAX_W}px)`

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

// True on a phone-width window, and follows it when the window is resized or the phone is rotated.
// Same breakpoint as the max-width:760px queries in nier.css and the phone case in uiScale.ts.
export function usePhone(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
}

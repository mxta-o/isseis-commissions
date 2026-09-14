// Effect quality tier. 'full' is the intended look; 'lite' drops the effects that cost the
// most GPU time (viewport filters, blurred layers, high particle counts) while keeping the
// composition recognisable. Compare them live with ?fx=full / ?fx=lite.
export type FxTier = 'full' | 'lite'

const STORAGE_KEY = 'fx'

function isTier(v: string | null): v is FxTier {
  return v === 'full' || v === 'lite'
}

export function detectFxTier(): FxTier {
  const param = new URLSearchParams(window.location.search).get(STORAGE_KEY)
  if (isTier(param)) {
    localStorage.setItem(STORAGE_KEY, param)
    return param
  }

  const saved = localStorage.getItem(STORAGE_KEY)
  if (isTier(saved)) return saved

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'lite'

  const cores = navigator.hardwareConcurrency ?? 8
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  return cores <= 4 || memory <= 4 ? 'lite' : 'full'
}

export function getFxTier(): FxTier {
  const attr = document.documentElement.dataset.fx ?? null
  return isTier(attr) ? attr : 'full'
}

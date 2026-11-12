// Commission domain: types, status labels, tiers.

export type Status =
  | 'pending_review'
  | 'awaiting_payment'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type Tier = 'sketch' | 'full' | 'scene'

// All prices are in Canadian dollars. `priceLabel` is the range shown to buyers; `priceCents` is the
// low end of it and is what gets prefilled when Loraine approves a request (she sets the final price
// per request, anywhere in or above the range).
export const CURRENCY = 'CAD'
export const TIERS: { key: Tier; name: string; detail: string; priceLabel: string; priceCents: number }[] = [
  { key: 'sketch', name: 'SKETCH', detail: 'Bust · clean lines + flat tone', priceLabel: '$5–10 CAD', priceCents: 500 },
  { key: 'full', name: 'FULL ILLUSTRATION', detail: 'Full body · fully rendered', priceLabel: '$10–20 CAD', priceCents: 1000 },
  { key: 'scene', name: 'SCENE', detail: '1–2 characters · full background', priceLabel: '$25+ CAD', priceCents: 2500 },
]

export function formatPrice(priceCents: number | null): string {
  if (priceCents == null) return '$ —'
  const dollars = priceCents / 100
  return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`
}

// an actual amount owed, with its currency: "$10 CAD"
export function formatMoney(priceCents: number | null): string {
  return priceCents == null ? formatPrice(null) : `${formatPrice(priceCents)} ${CURRENCY}`
}

// Progress bar on the public status page. Buyers see "ACCEPTED" for awaiting_payment, because
// acceptance and the payment request happen in the same step.
export const FLOW: Status[] = ['pending_review', 'awaiting_payment', 'in_progress', 'completed']
export const FLOW_NAMES = ['UNDER REVIEW', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED']

const ACCENT = '#9a8b4f'

// `label` is the admin wording; `publicLabel` is what buyers see on the status page.
export function statusMeta(s: Status): { label: string; publicLabel: string; color: string } {
  const m: Record<Status, { label: string; publicLabel: string; color: string }> = {
    pending_review: { label: '[ PENDING REVIEW ]', publicLabel: '[ UNDER REVIEW ]', color: '#6e6959' },
    awaiting_payment: { label: '[ AWAITING PAYMENT ]', publicLabel: '[ ACCEPTED — PAYMENT DUE ]', color: ACCENT },
    in_progress: { label: '[ IN PROGRESS ]', publicLabel: '[ IN PROGRESS ]', color: ACCENT },
    completed: { label: '[ COMPLETED ]', publicLabel: '[ COMPLETED ]', color: '#454136' },
    cancelled: { label: '[ CANCELLED ]', publicLabel: '[ CANCELLED ]', color: '#7e2f28' },
  }
  return m[s]
}

export function genGarble(str: string): string {
  const chars = '▮▯■□◇/\\<>#%&@01¦=+*'
  return str.split('').map(c => (c === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)])).join('')
}

export const WILL_DRAW = [
  'Original characters & sonas',
  'Fanart (most series)',
  'Ship art (canon or OC pairings)',
  'Chibi sets, emotes, badges',
  'Tabletop / D&D party portraits',
]
export const WONT_DRAW = [
  'NSFW or suggestive content',
  'Hateful or political imagery',
  'Real people without consent',
  'Heavy mechanical / vehicle focus',
]

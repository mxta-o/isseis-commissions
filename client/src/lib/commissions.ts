// Commission domain: types, sample data, status metadata.
// Swap SAMPLE_COMMISSIONS + local state for the real API in lib/api.ts when wiring the backend.

export type Status =
  | 'pending_review'
  | 'awaiting_payment'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type Commission = {
  id: string
  title: string
  email: string
  status: Status
  date: string
  desc: string
  refs: number
  reason?: string
}

export const FLOW: Status[] = ['pending_review', 'awaiting_payment', 'in_progress', 'completed']
export const FLOW_NAMES = ['PENDING REVIEW', 'AWAITING PAYMENT', 'IN PROGRESS', 'COMPLETED']

const ACCENT = '#9a8b4f'

export function statusMeta(s: Status): { label: string; color: string } {
  const m: Record<Status, { label: string; color: string }> = {
    pending_review: { label: '[ PENDING REVIEW ]', color: '#6e6959' },
    awaiting_payment: { label: '[ AWAITING PAYMENT ]', color: ACCENT },
    in_progress: { label: '[ IN PROGRESS ]', color: ACCENT },
    completed: { label: '[ COMPLETED ]', color: '#454136' },
    cancelled: { label: '[ CANCELLED ]', color: '#7e2f28' },
  }
  return m[s]
}

export function genId(): string {
  const h = () => Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0')
  return `${h()}-${h()}`
}

export function genGarble(str: string): string {
  const chars = '▮▯■□◇/\\<>#%&@01¦=+*'
  return str.split('').map(c => (c === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)])).join('')
}

export const SAMPLE_COMMISSIONS: Commission[] = [
  { id: '7C1A-42F0', title: 'Character portrait — OC “Mika”', email: 'rin.k@example.com', status: 'pending_review', date: '2026-07-18', desc: 'Half-body portrait of my original character Mika in her winter coat. Soft lighting, looking slightly off-camera. References attached for face and palette.', refs: 2 },
  { id: '9E77-08B3', title: 'Chibi couple set (2 figures)', email: 'kay@example.com', status: 'pending_review', date: '2026-07-19', desc: 'Matching chibi pair of me and my partner’s sonas. Simple background, sticker-style outlines.', refs: 1 },
  { id: '2B90-D1C4', title: 'Album cover — dusk rooftop', email: 'vex.audio@example.com', status: 'awaiting_payment', date: '2026-07-17', desc: 'Square-format illustration for an EP cover. Lone figure on a rooftop at dusk, heavy atmosphere.', refs: 2 },
  { id: '5F03-77AA', title: 'Full-body knight redesign', email: 'aro@example.com', status: 'awaiting_payment', date: '2026-07-17', desc: 'Full-body armor redesign of my D&D paladin. Ornate pauldrons, tabard with sigil (ref attached).', refs: 2 },
  { id: 'C4D8-1E96', title: 'Two-character scene — city rain', email: 'mnl@example.com', status: 'in_progress', date: '2026-07-12', desc: 'Two OCs sharing an umbrella at a neon crosswalk. Cinematic low angle, rain haze.', refs: 2 },
  { id: '88AB-3C21', title: 'Portrait — anniversary gift', email: 'tomo@example.com', status: 'completed', date: '2026-07-05', desc: 'Bust portrait, warm palette. A gift for our anniversary.', refs: 1 },
  { id: 'D610-4B77', title: 'Mecha pilot pin-up', email: 'zed@example.com', status: 'cancelled', date: '2026-07-08', desc: 'Pilot leaning on a cockpit ladder, flight suit half-zipped.', refs: 1, reason: 'Payment window expired (24 h). The request may be resubmitted.' },
  { id: '31E9-A0F2', title: 'Commission request', email: 'anon@example.com', status: 'cancelled', date: '2026-07-03', desc: '—', refs: 0, reason: 'Request conflicts with the commission ruleset — see ABOUT / WON’T DRAW.' },
]

export const WILL_DRAW = [
  'Original characters & sonas',
  'Fanart (most series)',
  'Ship art — canon or OC pairings',
  'Chibi sets, emotes, badges',
  'Tabletop / D&D party portraits',
]
export const WONT_DRAW = [
  'NSFW or suggestive content',
  'Hateful or political imagery',
  'Real people without consent',
  'Heavy mechanical / vehicle focus',
]

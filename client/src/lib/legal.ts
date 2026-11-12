// Shared bits for the Terms and Privacy pages.

export const LEGAL_UPDATED = '2026-11-11'

// Set VITE_CONTACT_EMAIL in client/.env to show a contact address; without it the pages point people
// at the artist's Ko-fi page instead.
const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() ?? ''

export const CONTACT_LINE = CONTACT_EMAIL
  ? `email ${CONTACT_EMAIL}`
  : 'message the artist on Ko-fi (ko-fi.com/isseimx)'

// the same line for use at the start of a sentence
export const CONTACT_SENTENCE = CONTACT_LINE.charAt(0).toUpperCase() + CONTACT_LINE.slice(1)

export type LegalSection = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

// Loose shape check only; the server does real validation.
export function looksLikeEmail(s: string): boolean {
  const at = s.indexOf('@')
  return at > 0 && s.lastIndexOf('.') > at + 1 && !s.endsWith('.') && !/\s/.test(s)
}

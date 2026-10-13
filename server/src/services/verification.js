// one-time email codes. only a SHA-256 hash of each code is stored so a leaked table can't be
// replayed, and every code is single email and short lived and limited to a few guesses.
const crypto = require('node:crypto')
const { supabase } = require('../lib/supabase')
const { HttpError } = require('../lib/httpError')

const CODE_TTL_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function check(error) {
  if (error) throw error
}

async function getRow(email) {
  const { data, error } = await supabase
    .from('email_verifications')
    .select('code_hash, expires_at, attempts, sent_at')
    .eq('email', email)
    .maybeSingle()
  check(error)
  return data
}

// creates(or replaces) the pending code for an email and returns the plaintext code so the
// caller can send it. Throws 429 if a code was sent to this email less than a minute ago.
async function issueCode(email, now = new Date()) {
  const existing = await getRow(email)
  if (existing && now - new Date(existing.sent_at) < RESEND_COOLDOWN_MS) {
    throw new HttpError(429, 'A code was just sent. Wait a minute before requesting another.')
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
  const { error } = await supabase.from('email_verifications').upsert({
    email,
    code_hash: hashCode(code),
    expires_at: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
    attempts: 0,
    sent_at: now.toISOString(),
  })
  check(error)
  return code
}

// throws unless code is the current, unexpired code for email. doesnt consume the code and
// call clearCode() once the thing it was guarding has succeeded.
async function verifyCode(email, code, now = new Date()) {
  const row = await getRow(email)
  if (!row || new Date(row.expires_at) <= now) {
    throw new HttpError(400, 'That code has expired or was never sent. Request a new one.')
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    throw new HttpError(429, 'Too many incorrect attempts. Request a new code.')
  }

  // Spend an attempt *before* comparing, with the same compare-and-set trick as status
  // transitions: the update only matches if `attempts` is still what we read. Two guesses
  // racing in parallel can't both use the same attempt, so the 5-guess cap is exact.
  const { data: claimed, error } = await supabase
    .from('email_verifications')
    .update({ attempts: row.attempts + 1 })
    .eq('email', email)
    .eq('attempts', row.attempts)
    .select('email')
    .maybeSingle()
  check(error)
  if (!claimed) {
    throw new HttpError(409, 'Another attempt is in progress. Try again.')
  }

  const expected = Buffer.from(row.code_hash, 'hex')
  const actual = Buffer.from(hashCode(code), 'hex')
  // constant-time compare: response times can't reveal how many leading characters matched
  if (!crypto.timingSafeEqual(expected, actual)) {
    const left = MAX_ATTEMPTS - (row.attempts + 1)
    throw new HttpError(400, left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Incorrect code. Request a new one.')
  }
}

async function clearCode(email) {
  const { error } = await supabase.from('email_verifications').delete().eq('email', email)
  check(error)
}

module.exports = {
  issueCode,
  verifyCode,
  clearCode,
}

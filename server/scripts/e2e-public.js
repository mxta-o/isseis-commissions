// end-to-end check of the public API (verify, submit, status, download) against the real supabase project in my .env
// 1. start the API w/ npm run dev
// 2. run npm run test:e2e (in server/ on another terminal)
//
// it plants a known verification code straight into the database (we can't read the emailed one),
// uses @example.com addresses so no real person gets mail, and deletes everything it created
const crypto = require('node:crypto')
const path = require('node:path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true })
const { createClient } = require('@supabase/supabase-js')

const API = `http://localhost:${process.env.PORT || 4000}/api`
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'commissions'
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const A = 'e2e-a@example.com'
const B = 'e2e-b@example.com'
const C = 'e2e-c@example.com'
const TEST_EMAILS = [A, B, C]
const CODE = '424242'
// 1x1 PNG img lol
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

let failures = 0
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures++
}

// locally nothing sits in front of the API, so with `trust proxy` = 1 the X-Forwarded-For header
// we send decides req.ip. a fresh fake IP per request keeps the rate limiters out of the way,
// except in the one test for the rate limiter specifically
const fakeIp = () => `10.${crypto.randomInt(256)}.${crypto.randomInt(256)}.${crypto.randomInt(1, 255)}`

async function seedCode(email, code = CODE) {
  const { error } = await db.from('email_verifications').upsert({
    email,
    code_hash: crypto.createHash('sha256').update(code).digest('hex'),
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    attempts: 0,
    sent_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  })
  if (error) throw error
}

async function submit(fields, files, idempotencyKey) {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.append(k, v)
  for (const [name, buf, type] of files) form.append('files', new Blob([buf], { type }), name)
  const headers = { 'X-Forwarded-For': fakeIp() }
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
  const res = await fetch(`${API}/commissions`, { method: 'POST', headers, body: form })
  return { status: res.status, body: await res.json(), replayed: res.headers.get('idempotent-replayed') }
}

async function countRows(email) {
  const { count } = await db.from('commissions').select('id', { count: 'exact', head: true }).eq('email', email)
  return count
}

async function cleanup() {
  const { data: rows } = await db.from('commissions').select('id').in('email', TEST_EMAILS)
  for (const { id } of rows ?? []) {
    const { data: objs } = await db.storage.from(BUCKET).list(`${id}/reference`)
    if (objs?.length) await db.storage.from(BUCKET).remove(objs.map(o => `${id}/reference/${o.name}`))
  }
  await db.from('commissions').delete().in('email', TEST_EMAILS)
  await db.from('email_verifications').delete().in('email', TEST_EMAILS)
  await db.from('email_verifications').delete().like('email', 'e2e-rl-%')
}

async function main() {
  const health = await fetch(`${API}/health`).catch(() => null)
  if (!health?.ok) throw new Error(`API isn't running at ${API}. Start it with \`npm run dev\` first.`)

  await cleanup()
  const base = { title: 'E2E portrait', description: 'Automated test request — safe to delete.', tier: 'sketch' }

  console.log('\n— submit + idempotency')
  await seedCode(A)
  const key = crypto.randomUUID()
  const first = await submit({ ...base, email: A, code: CODE }, [['a.png', PNG, 'image/png'], ['b.png', PNG, 'image/png']], key)
  check('valid submit → 201 with a tracking ID', first.status === 201 && !!first.body.trackingId, JSON.stringify(first.body))
  const id = first.body.trackingId

  const again = await submit({ ...base, email: A, code: CODE }, [], key)
  check('same Idempotency-Key → same tracking ID, marked as a replay', again.status === 201 && again.body.trackingId === id && again.replayed === 'true')
  const otherEmail = await submit({ ...base, email: B, code: CODE }, [], key)
  check('same key with a different email → 422', otherEmail.status === 422)
  check('still exactly one row', (await countRows(A)) === 1)

  const { data: files } = await db.from('commission_files').select('storage_path, file_type').eq('commission_id', id)
  check('2 reference file rows recorded', files?.length === 2 && files.every(f => f.file_type === 'reference'))
  const { data: objs } = await db.storage.from(BUCKET).list(`${id}/reference`)
  check('2 files in storage', objs?.length === 2, (objs ?? []).map(o => o.name).join(', '))
  const { data: leftoverCode } = await db.from('email_verifications').select('email').eq('email', A).maybeSingle()
  check('verification code was used up', leftoverCode === null)

  console.log('\n— spam rule')
  await seedCode(A)
  const tooSoon = await submit({ ...base, email: A, code: CODE }, [], crypto.randomUUID())
  check('second request within 30 min → 429', tooSoon.status === 429, tooSoon.body.message)

  console.log('\n— status + download')
  const res = await fetch(`${API}/commissions/${id}`)
  const status = await res.json()
  check('status → pending_review', res.status === 200 && status.status === 'pending_review')
  check('status response contains no email', !JSON.stringify(status).includes('@'), Object.keys(status).join(', '))
  check('no payment details while pending', status.payment === null)
  check('status is never cached', res.headers.get('cache-control') === 'no-store')
  check('uppercase ID still works', (await fetch(`${API}/commissions/${id.toUpperCase()}`)).status === 200)
  check('garbage ID → 404', (await fetch(`${API}/commissions/not-an-id`)).status === 404)
  check('download before completion → 409', (await fetch(`${API}/commissions/${id}/download`)).status === 409)

  console.log('\n— file validation')
  await seedCode(B)
  const fake = await submit({ ...base, email: B, code: CODE }, [['evil.png', Buffer.from('<script>alert(1)</script>'), 'image/png']], crypto.randomUUID())
  check('text file named .png → 400', fake.status === 400, fake.body.message)
  const { data: bRow } = await db.from('email_verifications').select('attempts').eq('email', B).single()
  check('a rejected file does not use up a code attempt', bRow.attempts === 0)
  const gif = await submit({ ...base, email: B, code: CODE }, [['x.gif', Buffer.from('GIF89a'), 'image/gif']], crypto.randomUUID())
  check('GIF → 400', gif.status === 400, gif.body.message)
  const noKey = await submit({ ...base, email: B, code: CODE }, [])
  check('missing Idempotency-Key → 400', noKey.status === 400)

  console.log('\n— wrong codes')
  await seedCode(C)
  const tries = []
  for (let i = 0; i < 6; i++) {
    const r = await submit({ ...base, email: C, code: '000000' }, [], crypto.randomUUID())
    tries.push(`${r.status} ${r.body.message}`)
  }
  check('5 wrong codes → 400, then 429', tries.slice(0, 5).every(t => t.startsWith('400')) && tries[5].startsWith('429'), `\n        ${tries.join('\n        ')}`)
  const lockedOut = await submit({ ...base, email: C, code: CODE }, [], crypto.randomUUID())
  check('even the right code is refused after lockout', lockedOut.status === 429)

  console.log('\n— parallel retries')
  await cleanup()
  await seedCode(A)
  const raceKey = crypto.randomUUID()
  const race = await Promise.all([1, 2, 3].map(() => submit({ ...base, email: A, code: CODE }, [], raceKey)))
  const ids = new Set(race.filter(r => r.status === 201).map(r => r.body.trackingId))
  check('3 simultaneous submits with one key → 1 row', (await countRows(A)) === 1 && ids.size === 1, race.map(r => r.status).join(', '))

  console.log('\n— rate limit on /verify')
  // Resend refuses @example.com in test mode (→ 502), but every call still counts toward the limit.
  const ip = fakeIp()
  const codes = []
  for (let i = 0; i < 6; i++) {
    const r = await fetch(`${API}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
      body: JSON.stringify({ email: `e2e-rl-${i}@example.com` }),
    })
    codes.push(r.status)
  }
  check('6th code request from one IP in 15 min → 429', codes[5] === 429, codes.join(', '))
  const { count: stale } = await db.from('email_verifications').select('email', { count: 'exact', head: true }).like('email', 'e2e-rl-%')
  check('failed sends left no codes behind', stale === 0)

  await cleanup()
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED')
  process.exitCode = failures ? 1 : 0
}

main().catch(async err => {
  console.error(err.message || err)
  await cleanup().catch(() => {})
  process.exit(1)
})

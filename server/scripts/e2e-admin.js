// end-to-end check of the admin API against the real supabase project in server/.env.
// npm run test:e2e:admin
//
// creates two throwaway supabase accounts (an admin and an outsider), starts its own copy of
// the API on port 4100 with the throwaway admin added to ADMIN_EMAILS (.env is untouched),
// walks a commission through its whole life, then deletes every user, row and file it made
const crypto = require('node:crypto')
const path = require('node:path')
const { spawn } = require('node:child_process')
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true })
const { createClient } = require('@supabase/supabase-js')

const PORT = 4100
const API = `http://localhost:${PORT}/api`
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'commissions'
const ADMIN = { email: 'e2e-admin@example.com', password: crypto.randomUUID() }
const OUTSIDER = { email: 'e2e-outsider@example.com', password: crypto.randomUUID() }
const BUYER = 'e2e-buyer@example.com'
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

let failures = 0
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures++
}

// setup / teardown vv

async function deleteTestUsers() {
  const { data } = await db.auth.admin.listUsers()
  for (const u of data?.users ?? []) {
    if ([ADMIN.email, OUTSIDER.email].includes(u.email)) await db.auth.admin.deleteUser(u.id)
  }
}

async function tokenFor({ email, password }) {
  const { error: createError } = await db.auth.admin.createUser({ email, password, email_confirm: true })
  if (createError) throw createError
  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await anon.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.session.access_token
}

async function startServer() {
  const adminEmails = `${process.env.ADMIN_EMAILS || ''},${ADMIN.email}`
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), ADMIN_EMAILS: adminEmails },
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  for (let i = 0; i < 50; i++) {
    const ok = await fetch(`${API}/health`).then(r => r.ok, () => false)
    if (ok) return child
    await new Promise(r => setTimeout(r, 100))
  }
  child.kill()
  throw new Error('test API did not start')
}

// inserts a commission straight into the DB (the public flow has its own e2e test)
async function seedCommission(fields = {}) {
  const { data, error } = await db
    .from('commissions')
    .insert({
      idempotency_key: crypto.randomUUID(),
      email: BUYER,
      title: 'E2E admin test',
      description: 'Automated test commission — safe to delete.',
      tier: 'full',
      ...fields,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function seedReferenceFile(id) {
  const storagePath = `${id}/reference/1.png`
  const { error } = await db.storage.from(BUCKET).upload(storagePath, PNG, { contentType: 'image/png' })
  if (error) throw error
  await db.from('commission_files').insert({ commission_id: id, storage_path: storagePath, file_type: 'reference' })
}

async function cleanup() {
  const { data: rows } = await db.from('commissions').select('id').eq('email', BUYER)
  for (const { id } of rows ?? []) {
    for (const folder of ['reference', 'final']) {
      const { data: objs } = await db.storage.from(BUCKET).list(`${id}/${folder}`)
      if (objs?.length) await db.storage.from(BUCKET).remove(objs.map(o => `${id}/${folder}/${o.name}`))
    }
  }
  await db.from('commissions').delete().eq('email', BUYER)
  await deleteTestUsers()
}

// request helpers vv

function api(token) {
  const call = async (method, url, body) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    let payload
    if (body instanceof FormData) payload = body
    else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }
    const res = await fetch(`${API}${url}`, { method, headers, body: payload })
    const json = await res.json().catch(() => ({}))
    return { status: res.status, body: json }
  }
  return {
    get: url => call('GET', url),
    patch: (url, body) => call('PATCH', url, body ?? {}),
    del: url => call('DELETE', url),
    upload: (url, files) => {
      const form = new FormData()
      for (const [name, buf, type] of files) form.append('files', new Blob([buf], { type }), name)
      return call('POST', url, form)
    },
  }
}

// tests vv

async function main() {
  await cleanup()
  const adminToken = await tokenFor(ADMIN)
  const outsiderToken = await tokenFor(OUTSIDER)
  const server = await startServer()
  try {
    await run(api(adminToken), api(outsiderToken), api(null))
  } finally {
    server.kill()
  }
}

async function run(admin, outsider, anonymous) {
  console.log('\n— access control')
  check('no token → 401', (await anonymous.get('/admin/commissions')).status === 401)
  check('logged in but not on ADMIN_EMAILS → 403', (await outsider.get('/admin/commissions')).status === 403)
  check('admin → 200', (await admin.get('/admin/commissions')).status === 200)

  const id = await seedCommission()
  await seedReferenceFile(id)
  const c = `/admin/commissions/${id}`

  console.log('\n— queue + detail')
  const list = await admin.get('/admin/commissions')
  const row = list.body.commissions.find(x => x.id === id)
  check('new commission is in the list with its email and file count', row?.status === 'pending_review' && row.email === BUYER && row.fileCount === 1)
  check('list row carries the payment ref', row?.ref === id.replaceAll('-', '').slice(0, 8).toUpperCase())
  const detail = await admin.get(c)
  const refUrl = detail.body.files?.reference?.[0]?.url
  check('detail includes a signed URL for the reference image', !!refUrl)
  const img = refUrl ? await fetch(refUrl) : null
  check('that URL actually serves the image', img?.status === 200 && Buffer.from(await img.arrayBuffer()).equals(PNG))
  check('garbage ID → 404', (await admin.get('/admin/commissions/not-an-id')).status === 404)

  console.log('\n— wrong-order actions are refused')
  check('mark paid before approval → 409', (await admin.patch(`${c}/mark-paid`)).status === 409)
  check('complete before approval → 409', (await admin.patch(`${c}/complete`)).status === 409)
  check('final upload before payment → 409', (await admin.upload(`${c}/files`, [['f.png', PNG, 'image/png']])).status === 409)

  console.log('\n— approve')
  check('price below Ko-fi minimum → 400', (await admin.patch(`${c}/approve`, { priceCents: 400 })).status === 400)
  check('missing price → 400', (await admin.patch(`${c}/approve`, {})).status === 400)
  const before = Date.now()
  const approved = await admin.patch(`${c}/approve`, { priceCents: 2500 })
  const deadlineMs = new Date(approved.body.paymentDeadline).getTime() - before
  check('approve → awaiting_payment with price', approved.status === 200 && approved.body.status === 'awaiting_payment' && approved.body.priceCents === 2500)
  check('deadline is ~24 h out', Math.abs(deadlineMs - 24 * 3600 * 1000) < 60 * 1000)
  check('approving again → 409 (no second email)', (await admin.patch(`${c}/approve`, { priceCents: 2500 })).status === 409)
  const pub = await fetch(`${API}/commissions/${id}`).then(r => r.json())
  check('public status shows price, REF and Ko-fi link', pub.payment?.priceCents === 2500 && pub.payment.ref === approved.body.ref && !!pub.payment.kofiUrl)
  check('expire before the window closes → 409', (await admin.patch(`${c}/expire`)).status === 409)

  console.log('\n— mark paid + final files')
  const paid = await admin.patch(`${c}/mark-paid`)
  check('mark paid → in_progress with paidAt', paid.status === 200 && paid.body.status === 'in_progress' && !!paid.body.paidAt)
  check('complete with no final files → 409', (await admin.patch(`${c}/complete`)).status === 409)
  check('fake image as final → 400', (await admin.upload(`${c}/files`, [['f.png', Buffer.from('nope'), 'image/png']])).status === 400)
  const up1 = await admin.upload(`${c}/files`, [['art.png', PNG, 'image/png']])
  const up2 = await admin.upload(`${c}/files`, [['art2.png', PNG, 'image/png']])
  check('two uploads → 1.png then 2.png', up2.body.files?.final?.map(f => f.name).join(',') === '1.png,2.png', up2.body.files?.final?.map(f => f.name).join(','))
  const refId = up2.body.files?.reference?.[0]?.id
  check('reference images can\'t be deleted through the final-file endpoint', (await admin.del(`${c}/files/${refId}`)).status === 404)
  const firstFinal = up1.body.files.final[0].id
  const afterDelete = await admin.del(`${c}/files/${firstFinal}`)
  check('delete a final file', afterDelete.status === 200 && afterDelete.body.files.final.length === 1)
  const up3 = await admin.upload(`${c}/files`, [['art3.png', PNG, 'image/png']])
  check('next upload continues numbering (3.png, no clash)', up3.body.files?.final?.map(f => f.name).join(',') === '2.png,3.png', up3.body.files?.final?.map(f => f.name).join(','))

  console.log('\n— complete + download')
  const done = await admin.patch(`${c}/complete`)
  check('complete → completed', done.status === 200 && done.body.status === 'completed')
  check('final uploads closed after completion → 409', (await admin.upload(`${c}/files`, [['x.png', PNG, 'image/png']])).status === 409)
  const dl = await fetch(`${API}/commissions/${id}/download`).then(r => r.json())
  check('public download lists both finals', dl.files?.length === 2, dl.files?.map(f => f.name).join(','))
  const file = dl.files?.[0] ? await fetch(dl.files[0].url) : null
  check('download link serves the file', file?.status === 200 && Buffer.from(await file.arrayBuffer()).equals(PNG))

  console.log('\n— reject')
  const r = `/admin/commissions/${await seedCommission()}`
  check('reject without reason → 400', (await admin.patch(`${r}/reject`, { reason: '   ' })).status === 400)
  const rejected = await admin.patch(`${r}/reject`, { reason: 'Conflicts with the ruleset.' })
  check('reject → cancelled with reason', rejected.body.status === 'cancelled' && rejected.body.cancellationReason === 'Conflicts with the ruleset.')
  check('cancelled can\'t be approved → 409', (await admin.patch(`${r}/approve`, { priceCents: 2500 })).status === 409)

  console.log('\n— expire after the window')
  const lateId = await seedCommission({
    status: 'awaiting_payment',
    price_cents: 2500,
    payment_deadline: new Date(Date.now() - 60 * 1000).toISOString(),
  })
  const lateRow = (await admin.get('/admin/commissions')).body.commissions.find(x => x.id === lateId)
  check('list flags it as overdue', lateRow?.overdue === true)
  const expired = await admin.patch(`/admin/commissions/${lateId}/expire`)
  check('expire → cancelled with the payment-window reason', expired.body.status === 'cancelled' && /Payment window expired/.test(expired.body.cancellationReason))

  console.log('\n— two admins click approve at once')
  const raceId = await seedCommission()
  const race = await Promise.all([1, 2].map(() => admin.patch(`/admin/commissions/${raceId}/approve`, { priceCents: 3000 })))
  check('exactly one wins, the other gets 409', race.map(x => x.status).sort().join(',') === '200,409', race.map(x => x.status).join(','))
}

main()
  .catch(err => { console.error(err.message || err); failures++ })
  .finally(async () => {
    await cleanup().catch(e => console.error('cleanup failed:', e.message))
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED')
    process.exitCode = failures ? 1 : 0
  })

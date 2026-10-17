// Public API. anyone can call these
const express = require('express')
const { z } = require('zod')
const { env } = require('../config/env')
const { HttpError } = require('../lib/httpError')
const { parse, parseCommissionId } = require('../lib/validate')
const { sniffImageType } = require('../lib/imageType')
const { verifyLimiter, submitLimiter } = require('../middleware/rateLimit')
const { referenceUpload } = require('../middleware/upload')
const { STATUS } = require('../domain/transitions')
const { paymentRef } = require('../domain/payment')
const commissions = require('../services/commissions')
const storage = require('../services/storage')
const verification = require('../services/verification')
const mail = require('../services/email')

const publicRouter = express.Router()

const SUBMIT_COOLDOWN_MS = 30 * 60 * 1000
const DOWNLOAD_URL_TTL_SECONDS = 60 * 60

// validation v

const emailField = z
  .string({ error: 'Email is required.' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Enter a valid email address.' }))

const verifySchema = z.object({ email: emailField })

const submitSchema = z.object({
  title: z.string({ error: 'Title is required.' }).trim()
    .min(1, { error: 'Title is required.' })
    .max(100, { error: 'Title must be 100 characters or fewer.' }),
  description: z.string({ error: 'Description is required.' }).trim()
    .min(1, { error: 'Description is required.' })
    .max(750, { error: 'Description must be 750 characters or fewer.' }),
  tier: z.enum(['sketch', 'full', 'scene'], { error: 'Choose a commission type.' }),
  email: emailField,
  code: z.string({ error: 'Enter the 6-digit code.' }).trim().regex(/^\d{6}$/, { error: 'Enter the 6-digit code.' }),
})

const idempotencyKeySchema = z.uuid({ error: 'Missing or invalid Idempotency-Key header.' })

// helper funcs v

// spam rule: one request per email every 30 minutes, checked against existing rows
async function ensureNoRecentRequest(email, now = new Date()) {
  const recent = await commissions.findRecentByEmail(email, new Date(now.getTime() - SUBMIT_COOLDOWN_MS))
  if (recent) {
    const waitMs = new Date(recent.created_at).getTime() + SUBMIT_COOLDOWN_MS - now.getTime()
    const minutes = Math.max(1, Math.ceil(waitMs / 60000))
    throw new HttpError(429, `You can send one request every 30 minutes. Try again in ${minutes} min.`)
  }
}

// a retried submit (w the same Idempotency-Key) gets the original response back
function replay(res, existing, email) {
  if (existing.email !== email) {
    throw new HttpError(422, 'This form was already submitted with a different email. Reload the page to start a new request.')
  }
  res.set('Idempotent-Replayed', 'true')
  return res.status(201).json({ trackingId: existing.id })
}

function toPublicStatus(c) {
  const awaitingPayment = c.status === STATUS.AWAITING_PAYMENT
  return {
    id: c.id,
    title: c.title,
    status: c.status,
    updatedAt: c.updated_at,
    cancellationReason: c.cancellation_reason,
    payment: awaitingPayment
      ? { priceCents: c.price_cents, deadline: c.payment_deadline, ref: paymentRef(c.id), kofiUrl: env.kofiUrl }
      : null,
  }
}

// routes v

// step 1 of the form: email a one-time code
publicRouter.post('/verify', verifyLimiter, async (req, res) => {
  const { email } = parse(verifySchema, req.body ?? {})
  // fail before they wait for an email if they couldn't submit anyway
  await ensureNoRecentRequest(email)

  const code = await verification.issueCode(email)
  try {
    await mail.sendVerificationCode(email, code)
  } catch (err) {
    // nothing was delivered so dont leave a code (and its resend cooldown) behind
    await verification.clearCode(email)
    throw err
  }
  res.status(202).json({ message: 'Verification code sent.' })
})

// step 2: submit the request with the code. multipart: up to 5 files
publicRouter.post('/commissions', submitLimiter, referenceUpload, async (req, res) => {
  const idempotencyKey = parse(idempotencyKeySchema, req.get('Idempotency-Key'))
  const input = parse(submitSchema, req.body ?? {})

  // retry of a request that already succeeded? return the same tracking ID
  const existing = await commissions.findByIdempotencyKey(idempotencyKey)
  if (existing) return replay(res, existing, input.email)

  // check every file's real type before spending a code attempt or touching storage
  const files = (req.files ?? []).map(f => {
    const type = sniffImageType(f.buffer)
    if (!type) throw new HttpError(400, `"${f.originalname}" isn't a valid JPG, PNG or WebP image.`)
    return { buffer: f.buffer, ...type }
  })

  await ensureNoRecentRequest(input.email)
  await verification.verifyCode(input.email, input.code)

  // create the row. if a parallel retry with the same key inserted first, the unique
  // constraint stops us and we return its result instead of creating a duplicate.
  const { commission, duplicate } = await commissions.insertCommission({
    idempotency_key: idempotencyKey,
    email: input.email,
    title: input.title,
    description: input.description,
    tier: input.tier,
  })
  if (duplicate) return replay(res, await commissions.findByIdempotencyKey(idempotencyKey), input.email)

  // store the reference files. if anything fails, undo the row too, so there's never a
  // commission whose files silently went missing
  let paths = []
  try {
    paths = await storage.uploadFiles(commission.id, 'reference', files)
    await commissions.insertFiles(commission.id, paths, 'reference')
  } catch (err) {
    await storage.removeFiles(paths)
    await commissions.deleteCommission(commission.id).catch(e => console.error('Rollback failed:', e))
    throw err
  }

  // the commission exists now. nothing below may fail the request.
  await verification.clearCode(input.email).catch(e => console.error('Clearing code failed:', e))
  await Promise.all([mail.sendTrackingId(commission), mail.notifyNewCommission(commission, files.length)])

  res.status(201).json({ trackingId: commission.id })
})

publicRouter.get('/commissions/:id', async (req, res) => {
  const id = parseCommissionId(req.params.id)
  const commission = await commissions.getPublicCommission(id)
  if (!commission) throw new HttpError(404, 'No commission found for that tracking ID.')

  res.set('Cache-Control', 'no-store')
  res.json(toPublicStatus(commission))
})

// fresh signed links to the finished art, minted on each click so emailed links never expire
publicRouter.get('/commissions/:id/download', async (req, res) => {
  const id = parseCommissionId(req.params.id)
  const commission = await commissions.getPublicCommission(id)
  if (!commission) throw new HttpError(404, 'No commission found for that tracking ID.')
  if (commission.status !== STATUS.COMPLETED) throw new HttpError(409, 'The finished files aren\'t ready yet.')

  const paths = await commissions.listFilePaths(id, 'final')
  const links = await storage.signedUrls(paths, DOWNLOAD_URL_TTL_SECONDS, { download: true })

  res.set('Cache-Control', 'no-store')
  res.json({
    files: links.map(({ path, url }) => ({ name: path.split('/').pop(), url })),
    expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS,
  })
})

module.exports = {
  publicRouter,
}

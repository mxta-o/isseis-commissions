// admin API. every route here runs behind requireAdmin (valid supabase login + ADMIN_EMAILS).
// status changes all go through planTransition + applyTransition so the rules live in one place
// and a stale or double click gets a 409 instead of applying twice.
const express = require('express')
const { z } = require('zod')
const { HttpError } = require('../lib/httpError')
const { parse, parseCommissionId } = require('../lib/validate')
const { sniffImageType } = require('../lib/imageType')
const { requireAdmin } = require('../middleware/requireAdmin')
const { finalUpload } = require('../middleware/upload')
const { STATUS, planTransition, isOverdue } = require('../domain/transitions')
const { paymentRef } = require('../domain/payment')
const commissions = require('../services/commissions')
const storage = require('../services/storage')
const mail = require('../services/email')

const adminRouter = express.Router()
adminRouter.use(requireAdmin)

// long enough to look through a commission, short enough that a copied link goes stale
const FILE_URL_TTL_SECONDS = 60 * 60

const VERBS = {
  approve: 'approved',
  reject: 'rejected',
  markPaid: 'marked paid',
  expire: 'expired',
  complete: 'completed',
}

// helpers vv

function toAdminCommission(c, now = new Date()) {
  return {
    id: c.id,
    ref: paymentRef(c.id),
    email: c.email,
    title: c.title,
    description: c.description,
    tier: c.tier,
    status: c.status,
    priceCents: c.price_cents,
    paymentDeadline: c.payment_deadline,
    paidAt: c.paid_at,
    cancellationReason: c.cancellation_reason,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    overdue: isOverdue(c, now),
  }
}

async function loadCommission(rawId) {
  const id = parseCommissionId(rawId)
  const commission = await commissions.getCommission(id)
  if (!commission) throw new HttpError(404, 'No commission found with that ID.')
  return commission
}

// plan the change, then apply it only if the row is still where we expect. if it isn't, say why.
async function transition(rawId, action, input) {
  const id = parseCommissionId(rawId)
  const { from, patch } = planTransition(action, input)
  const updated = await commissions.applyTransition(id, from, patch)
  if (updated) return updated

  const current = await commissions.getCommission(id)
  if (!current) throw new HttpError(404, 'No commission found with that ID.')
  throw new HttpError(
    409,
    `This commission is ${current.status.replaceAll('_', ' ')}, so it can't be ${VERBS[action]}. Refresh to see the latest.`,
  )
}

async function filesWithUrls(commissionId) {
  const rows = await commissions.listFiles(commissionId)
  const links = await storage.signedUrls(rows.map(r => r.storage_path), FILE_URL_TTL_SECONDS)
  const urlByPath = new Map(links.map(l => [l.path, l.url]))
  const toFile = r => ({ id: r.id, name: r.storage_path.split('/').pop(), url: urlByPath.get(r.storage_path) ?? null, uploadedAt: r.uploaded_at })
  return {
    reference: rows.filter(r => r.file_type === 'reference').map(toFile),
    final: rows.filter(r => r.file_type === 'final').map(toFile),
  }
}

// final files are named 1.png, 2.png, … ; continue after the highest number already used so a
// later batch (or one after a delete) never collides with an existing name
function nextFileNumber(paths) {
  const numbers = paths.map(p => Number(/\/(\d+)\.\w+$/.exec(p)?.[1] ?? 0))
  return Math.max(0, ...numbers) + 1
}

function requireStatus(commission, status, message) {
  if (commission.status !== status) throw new HttpError(409, message)
}

// read vv

adminRouter.get('/commissions', async (req, res) => {
  const rows = await commissions.listCommissions()
  const now = new Date()
  res.set('Cache-Control', 'no-store')
  res.json({
    commissions: rows.map(r => ({ ...toAdminCommission(r, now), fileCount: r.commission_files?.[0]?.count ?? 0 })),
  })
})

adminRouter.get('/commissions/:id', async (req, res) => {
  const commission = await loadCommission(req.params.id)
  res.set('Cache-Control', 'no-store')
  res.json({ ...toAdminCommission(commission), files: await filesWithUrls(commission.id) })
})

// status changes vv

const approveSchema = z.object({
  priceCents: z.number({ error: 'Enter a price.' }).int({ error: 'Price must be in whole cents.' }),
})
const rejectSchema = z.object({
  reason: z.string({ error: 'A rejection reason is required.' }),
})

adminRouter.patch('/commissions/:id/approve', async (req, res) => {
  const { priceCents } = parse(approveSchema, req.body ?? {})
  const updated = await transition(req.params.id, 'approve', { priceCents })
  await mail.sendApproved(updated)
  res.json(toAdminCommission(updated))
})

adminRouter.patch('/commissions/:id/reject', async (req, res) => {
  const { reason } = parse(rejectSchema, req.body ?? {})
  const updated = await transition(req.params.id, 'reject', { reason })
  await mail.sendRejected(updated)
  res.json(toAdminCommission(updated))
})

adminRouter.patch('/commissions/:id/mark-paid', async (req, res) => {
  const updated = await transition(req.params.id, 'markPaid')
  await mail.sendPaymentConfirmed(updated)
  res.json(toAdminCommission(updated))
})

// only once the 24 h window has actually passed, so a slip of the mouse can't cancel someone
// who still has time to pay
adminRouter.patch('/commissions/:id/expire', async (req, res) => {
  const commission = await loadCommission(req.params.id)
  if (commission.status === STATUS.AWAITING_PAYMENT && !isOverdue(commission)) {
    throw new HttpError(409, 'The payment window hasn\'t closed yet.')
  }
  const updated = await transition(commission.id, 'expire')
  await mail.sendExpired(updated)
  res.json(toAdminCommission(updated))
})

adminRouter.patch('/commissions/:id/complete', async (req, res) => {
  const commission = await loadCommission(req.params.id)
  const finals = await commissions.listFilePaths(commission.id, 'final')
  if (commission.status === STATUS.IN_PROGRESS && finals.length === 0) {
    throw new HttpError(409, 'Upload the finished art before marking this complete.')
  }
  const updated = await transition(commission.id, 'complete')
  await mail.sendCompleted(updated)
  res.json(toAdminCommission(updated))
})

// final files vv

adminRouter.post('/commissions/:id/files', finalUpload, async (req, res) => {
  const commission = await loadCommission(req.params.id)
  requireStatus(commission, STATUS.IN_PROGRESS, 'Final files can only be added while a commission is in progress.')

  const files = (req.files ?? []).map(f => {
    const type = sniffImageType(f.buffer)
    if (!type) throw new HttpError(400, `"${f.originalname}" isn't a valid JPG, PNG or WebP image.`)
    return { buffer: f.buffer, ...type }
  })
  if (!files.length) throw new HttpError(400, 'Choose at least one file to upload.')

  const existing = await commissions.listFilePaths(commission.id, 'final')
  const paths = await storage.uploadFiles(commission.id, 'final', files, { startAt: nextFileNumber(existing) })
  try {
    await commissions.insertFiles(commission.id, paths, 'final')
  } catch (err) {
    await storage.removeFiles(paths)
    throw err
  }

  res.status(201).json({ files: await filesWithUrls(commission.id) })
})

adminRouter.delete('/commissions/:id/files/:fileId', async (req, res) => {
  const commission = await loadCommission(req.params.id)
  requireStatus(commission, STATUS.IN_PROGRESS, 'Final files can only be removed while a commission is in progress.')
  const fileId = z.uuid().safeParse(req.params.fileId)
  if (!fileId.success) throw new HttpError(404, 'File not found.')

  const removed = await commissions.deleteFile(commission.id, fileId.data, 'final')
  if (!removed) throw new HttpError(404, 'File not found.')
  await storage.removeFiles([removed.storage_path])

  res.json({ files: await filesWithUrls(commission.id) })
})

module.exports = {
  adminRouter,
}

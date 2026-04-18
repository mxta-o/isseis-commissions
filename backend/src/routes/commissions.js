const express = require('express')
const multer = require('multer')
const { z } = require('zod')
const { env } = require('../config/env')
const { requireAdmin } = require('../middleware/requireAdmin')
const { getResendClient } = require('../lib/resend')
const {
  STATUS,
  createCommission,
  getCommissionByTrackingId,
  updateCommissionStatus,
} = require('../services/commissionService')

const commissionRouter = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
})

const createCommissionSchema = z.object({
  email: z.string().email(),
  description: z.string().min(1).max(750),
})

const updateStatusSchema = z.object({
  status: z.enum([STATUS.APPROVED, STATUS.REJECTED, STATUS.IN_PROGRESS, STATUS.COMPLETED]),
  rejectionReason: z.string().max(500).optional(),
})

commissionRouter.post('/', upload.array('files', 5), async (req, res) => {
  const parsed = createCommissionSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request payload.',
      issues: parsed.error.issues,
    })
  }

  try {
    const commission = await createCommission({
      email: parsed.data.email,
      description: parsed.data.description,
      files: req.files || [],
      storageBucket: env.supabaseStorageBucket,
    })

    const resend = getResendClient()
    if (resend && env.resendFromEmail) {
      await resend.emails.send({
        from: env.resendFromEmail,
        to: parsed.data.email,
        subject: `Commission request received (${commission.trackingId})`,
        text: `Thanks for your request. Your tracking ID is ${commission.trackingId}.`,
      })
    }

    return res.status(201).json({
      trackingId: commission.trackingId,
      status: commission.status,
      message: 'Commission request submitted.',
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Could not create commission request.',
      error: error.message,
    })
  }
})

commissionRouter.get('/:trackingId', async (req, res) => {
  try {
    const commission = await getCommissionByTrackingId(req.params.trackingId)

    if (!commission) {
      return res.status(404).json({ message: 'Tracking ID not found.' })
    }

    return res.status(200).json(commission)
  } catch (error) {
    return res.status(500).json({
      message: 'Could not fetch commission status.',
      error: error.message,
    })
  }
})

commissionRouter.patch('/:trackingId/status', requireAdmin, async (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid status payload.',
      issues: parsed.error.issues,
    })
  }

  if (parsed.data.status === STATUS.REJECTED && !parsed.data.rejectionReason) {
    return res.status(400).json({
      message: 'rejectionReason is required for rejected commissions.',
    })
  }

  try {
    const updated = await updateCommissionStatus({
      trackingId: req.params.trackingId,
      status: parsed.data.status,
      rejectionReason: parsed.data.rejectionReason,
    })

    if (!updated) {
      return res.status(404).json({ message: 'Tracking ID not found.' })
    }

    return res.status(200).json(updated)
  } catch (error) {
    return res.status(500).json({
      message: 'Could not update commission status.',
      error: error.message,
    })
  }
})

module.exports = {
  commissionRouter,
}

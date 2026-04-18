const { getSupabaseAdmin } = require('../lib/supabase')

const commissions = new Map()

const STATUS = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
}

function buildTrackingId() {
  const entropy = Math.random().toString(36).slice(2, 9).toUpperCase()
  return `COM-${entropy}`
}

async function uploadFilesToSupabase(trackingId, files, bucketName) {
  const supabase = getSupabaseAdmin()

  if (!supabase || !files.length) {
    return []
  }

  const uploadedFiles = []

  for (const file of files) {
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`
    const filePath = `${trackingId}/${fileName}`

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, { contentType: file.mimetype })

    if (!error) {
      uploadedFiles.push({
        fileName: file.originalname,
        storagePath: filePath,
        mimeType: file.mimetype,
        size: file.size,
      })
    }
  }

  return uploadedFiles
}

async function createCommission({ email, description, files, storageBucket }) {
  const trackingId = buildTrackingId()
  const uploadedFiles = await uploadFilesToSupabase(trackingId, files, storageBucket)

  const commission = {
    trackingId,
    email,
    description,
    status: STATUS.PENDING_REVIEW,
    rejectionReason: null,
    files: uploadedFiles,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  commissions.set(trackingId, commission)

  const supabase = getSupabaseAdmin()
  if (supabase) {
    await supabase.from('commissions').insert({
      tracking_id: trackingId,
      customer_email: email,
      description,
      status: commission.status,
      metadata: { files: uploadedFiles },
    })
  }

  return commission
}

async function getCommissionByTrackingId(trackingId) {
  if (commissions.has(trackingId)) {
    return commissions.get(trackingId)
  }

  const supabase = getSupabaseAdmin()

  if (!supabase) {
    return null
  }

  const { data } = await supabase
    .from('commissions')
    .select('tracking_id,status,updated_at,rejection_reason')
    .eq('tracking_id', trackingId)
    .maybeSingle()

  if (!data) {
    return null
  }

  return {
    trackingId: data.tracking_id,
    status: data.status,
    updatedAt: data.updated_at,
    rejectionReason: data.rejection_reason,
  }
}

async function updateCommissionStatus({ trackingId, status, rejectionReason }) {
  const existing = await getCommissionByTrackingId(trackingId)

  if (!existing) {
    return null
  }

  const updated = {
    ...existing,
    status,
    rejectionReason: rejectionReason || null,
    updatedAt: new Date().toISOString(),
  }

  commissions.set(trackingId, updated)

  const supabase = getSupabaseAdmin()
  if (supabase) {
    await supabase
      .from('commissions')
      .update({
        status,
        rejection_reason: updated.rejectionReason,
        updated_at: updated.updatedAt,
      })
      .eq('tracking_id', trackingId)
  }

  return updated
}

module.exports = {
  STATUS,
  createCommission,
  getCommissionByTrackingId,
  updateCommissionStatus,
}

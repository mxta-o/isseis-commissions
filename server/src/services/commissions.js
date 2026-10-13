// data access for the commissions + commission_files tables
const { supabase } = require('../lib/supabase')

const UNIQUE_VIOLATION = '23505'

// columns safe to show anyone holding the tracking ID. deliberately excluding the email
const PUBLIC_COLUMNS = 'id, title, status, price_cents, payment_deadline, cancellation_reason, updated_at'

function check(error) {
  if (error) throw error
}

async function findByIdempotencyKey(idempotencyKey) {
  const { data, error } = await supabase
    .from('commissions')
    .select('id, email')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  check(error)
  return data
}

// newest commission for an email created after `since`, for the 1 per 30-mins rule
async function findRecentByEmail(email, since) {
  const { data, error } = await supabase
    .from('commissions')
    .select('id, created_at')
    .eq('email', email)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  check(error)
  return data
}

// returns { commission } on success, or { duplicate: true } if another request with the same
// idempotency key won the race to insert first
async function insertCommission(fields) {
  const { data, error } = await supabase
    .from('commissions')
    .insert(fields)
    .select('id, email, title, tier, created_at')
    .single()
  if (error?.code === UNIQUE_VIOLATION && error.message.includes('idempotency_key')) {
    return { duplicate: true }
  }
  check(error)
  return { commission: data }
}

async function deleteCommission(id) {
  const { error } = await supabase.from('commissions').delete().eq('id', id)
  check(error)
}

async function insertFiles(commissionId, storagePaths, fileType) {
  if (!storagePaths.length) return
  const rows = storagePaths.map(storage_path => ({ commission_id: commissionId, storage_path, file_type: fileType }))
  const { error } = await supabase.from('commission_files').insert(rows)
  check(error)
}

async function getPublicCommission(id) {
  const { data, error } = await supabase.from('commissions').select(PUBLIC_COLUMNS).eq('id', id).maybeSingle()
  check(error)
  return data
}

async function listFilePaths(commissionId, fileType) {
  const { data, error } = await supabase
    .from('commission_files')
    .select('storage_path')
    .eq('commission_id', commissionId)
    .eq('file_type', fileType)
    .order('uploaded_at')
  check(error)
  return data.map(row => row.storage_path)
}

module.exports = {
  findByIdempotencyKey,
  findRecentByEmail,
  insertCommission,
  deleteCommission,
  insertFiles,
  getPublicCommission,
  listFilePaths,
}

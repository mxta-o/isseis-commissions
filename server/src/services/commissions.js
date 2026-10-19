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

// admin vv

const ADMIN_COLUMNS =
  'id, email, title, description, tier, status, price_cents, payment_deadline, paid_at, cancellation_reason, created_at, updated_at'

// newest first. capped so the console stays fast. the commission site won't get near this anytime soon so itll be fine
async function listCommissions(limit = 500) {
  const { data, error } = await supabase
    .from('commissions')
    .select(`${ADMIN_COLUMNS}, commission_files(count)`)
    .order('created_at', { ascending: false })
    .limit(limit)
  check(error)
  return data
}

async function getCommission(id) {
  const { data, error } = await supabase.from('commissions').select(ADMIN_COLUMNS).eq('id', id).maybeSingle()
  check(error)
  return data
}

// only updates the row if it's still in `from`.
// returns the updated row or null if the row is gone or someone already moved it
async function applyTransition(id, from, patch) {
  const { data, error } = await supabase
    .from('commissions')
    .update(patch)
    .eq('id', id)
    .eq('status', from)
    .select(ADMIN_COLUMNS)
    .maybeSingle()
  check(error)
  return data
}

async function listFiles(commissionId) {
  const { data, error } = await supabase
    .from('commission_files')
    .select('id, storage_path, file_type, uploaded_at')
    .eq('commission_id', commissionId)
    .order('uploaded_at')
    .order('storage_path')
  check(error)
  return data
}

// the file_type filter is part of the delete itself so the ref img can never be removed through this even if its id is passed in
async function deleteFile(commissionId, fileId, fileType) {
  const { data, error } = await supabase
    .from('commission_files')
    .delete()
    .eq('id', fileId)
    .eq('commission_id', commissionId)
    .eq('file_type', fileType)
    .select('storage_path, file_type')
    .maybeSingle()
  check(error)
  return data
}

module.exports = {
  listCommissions,
  getCommission,
  applyTransition,
  listFiles,
  deleteFile,
  findByIdempotencyKey,
  findRecentByEmail,
  insertCommission,
  deleteCommission,
  insertFiles,
  getPublicCommission,
  listFilePaths,
}

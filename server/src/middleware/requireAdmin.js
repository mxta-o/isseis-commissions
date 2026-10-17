const { supabase } = require('../lib/supabase')
const { env } = require('../config/env')
const { HttpError } = require('../lib/httpError')

// guards every /api/admin route. the client logs in with supabase auth and sends the access
// token as `Authorization: Bearer <token>`. supabase confirms the token is real and unexpired,
// then the email has to be on ADMIN_EMAILS.
//
// 401 = we don't know who you are (missing/expired token). 403 = we know, and the answer is no.
async function requireAdmin(req, _res, next) {
  const header = req.get('Authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
  if (!token) throw new HttpError(401, 'Sign in to use the admin console.')

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) throw new HttpError(401, 'Your session has expired. Sign in again.')

  const email = (data.user.email || '').toLowerCase()
  if (!env.adminEmails.includes(email)) throw new HttpError(403, 'This account doesn\'t have admin access.')

  req.admin = { id: data.user.id, email }
  next()
}

module.exports = {
  requireAdmin,
}

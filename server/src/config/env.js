const dotenv = require('dotenv')

dotenv.config({ quiet: true })

function required(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. See server/.env.example.`)
  }
  return value
}

// the server must hold the secret key since it bypasses rls. Pasting the public anon key
// here instead is an easy mistake that otherwise only shows up as rls errors on every write
function serviceRoleKey() {
  const key = required('SUPABASE_SERVICE_ROLE_KEY')
  let role = null
  try {
    role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role
  } catch {
    // NOT a JWT: newer projects use sb_secret_… / sb_publishable_… keys
  }
  if (role === 'anon' || key.startsWith('sb_publishable_')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY holds the public anon key. Use the service_role (secret) key from Project Settings → API Keys.')
  }
  return key
}

const nodeEnv = process.env.NODE_ENV || 'development'

// where the site lives. In production there is no sensible default: a localhost fallback would
// block the real site with CORS and put localhost links in customers' emails, so refuse to start.
// Anywhere else the local dev server is assumed, with a warning so the fallback is never silent.
function siteUrl(name, fallback) {
  const value = process.env[name]
  if (value) return value
  if (nodeEnv === 'production') {
    throw new Error(`Missing required environment variable ${name} in production. See server/.env.example.`)
  }
  console.warn(`${name} is not set; using ${fallback} (fine for local dev, not for production).`)
  return fallback
}

// fail on startup rather than on the first request that needs a missing value
const clientUrl = siteUrl('CLIENT_URL', 'http://localhost:3001')
const env = {
  nodeEnv,
  port: Number(process.env.PORT || 4000),
  clientUrl,
  publicSiteUrl: (process.env.PUBLIC_SITE_URL || clientUrl).replace(/\/$/, ''),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: serviceRoleKey(),
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'commissions',
  resendApiKey: required('RESEND_API_KEY'),
  resendFromEmail: required('RESEND_FROM_EMAIL'),
  notifyEmail: process.env.NOTIFY_EMAIL || '',
  // signups are disabled in supabase, but this list is the second lock: a valid login isn't
  // enough on its own, the email has to be on it too
  adminEmails: required('ADMIN_EMAILS').split(',').map(e => e.trim().toLowerCase()).filter(Boolean),
  kofiUrl: process.env.KOFI_URL || 'https://ko-fi.com/isseimx',
}

module.exports = {
  env,
}

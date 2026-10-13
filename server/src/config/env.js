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

// fail on startup rather than on the first request that needs a missing value
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3001',
  publicSiteUrl: (process.env.PUBLIC_SITE_URL || process.env.CLIENT_URL || 'http://localhost:3001').replace(/\/$/, ''),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: serviceRoleKey(),
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'commissions',
  resendApiKey: required('RESEND_API_KEY'),
  resendFromEmail: required('RESEND_FROM_EMAIL'),
  notifyEmail: process.env.NOTIFY_EMAIL || '',
  kofiUrl: process.env.KOFI_URL || 'https://ko-fi.com/isseimx',
}

module.exports = {
  env,
}

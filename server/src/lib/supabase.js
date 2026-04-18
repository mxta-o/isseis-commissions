const { createClient } = require('@supabase/supabase-js')
const { env } = require('../config/env')

let supabaseAdmin = null

if (env.supabaseUrl && env.supabaseServiceRoleKey) {
  supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function getSupabaseAdmin() {
  return supabaseAdmin
}

module.exports = {
  getSupabaseAdmin,
}

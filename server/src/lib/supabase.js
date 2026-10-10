const { createClient } = require('@supabase/supabase-js')
const { env } = require('../config/env')

// Service-role client: bypasses RLS, so it must only ever run on the server.
const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

module.exports = {
  supabase,
}

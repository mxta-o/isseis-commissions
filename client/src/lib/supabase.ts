import { createClient } from '@supabase/supabase-js'

// auth only: the browser never reads the database directly (RLS blocks the anon key anyway).
// it logs loraine in, keeps her session fresh, and hands the access token to our API.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? '',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
)

export async function accessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

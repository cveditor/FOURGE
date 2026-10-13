import { createClient } from '@supabase/supabase-js'

let cachedClient: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (cachedClient) return cachedClient

  const url = process.env.SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY

  if (!url || !secret) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY')
  }

  cachedClient = createClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  return cachedClient
}

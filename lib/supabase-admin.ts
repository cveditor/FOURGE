import { createClient } from '@supabase/supabase-js'

function createAdminClient(url: string, secret: string) {
  return createClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

type AdminClient = ReturnType<typeof createAdminClient>
let cachedClient: AdminClient | null = null

export function getSupabaseAdmin(): AdminClient {
  if (cachedClient) return cachedClient

  const url = process.env.SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY

  if (!url || !secret) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY')
  }

  cachedClient = createAdminClient(url, secret)
  return cachedClient
}

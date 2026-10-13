import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { hashPrivateToken } from '@/lib/tokens'

export const runtime = 'nodejs'
const BUCKET = 'fourge-player-photos'
const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

async function loadPlayer(token: string) {
  const supabase = getSupabaseAdmin()
  const { data: player, error } = await supabase.from('fourge_players').select('id, crew_id, role_code, photo_path, token_hash').eq('token_hash', hashPrivateToken(token)).single()
  if (error || !player) return null
  return { supabase, player }
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  const loaded = await loadPlayer(token)
  if (!loaded) return NextResponse.json({ error: 'Invalid player link.' }, { status: 404 })
  const { supabase, player } = loaded
  const { data: crew } = await supabase.from('fourge_crews').select('locale').eq('id', player.crew_id).single()
  const isIt = crew?.locale === 'it-IT'
  if (!player.role_code) return NextResponse.json({ error: isIt ? 'Scegli il ruolo prima di caricare la foto.' : 'Claim your role before uploading a photo.' }, { status: 409 })

  const form = await request.formData(); const file = form.get('photo'); const consent = form.get('consent') === 'true'
  if (!(file instanceof File)) return NextResponse.json({ error: isIt ? 'Scegli prima una foto.' : 'Choose a photo first.' }, { status: 400 })
  if (!consent) return NextResponse.json({ error: isIt ? 'È necessario autorizzare l’uso della foto.' : 'Photo consent is required.' }, { status: 400 })
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: isIt ? 'Usa una foto JPG, PNG o WEBP.' : 'Use a JPG, PNG or WEBP photo.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: isIt ? 'La foto deve essere più piccola di 8 MB.' : 'Photo must be smaller than 8 MB.' }, { status: 400 })

  const path = `${player.crew_id}/${player.id}/portrait`
  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, { upsert: true, contentType: file.type, cacheControl: '3600' })
  if (uploadError) { console.error(uploadError); return NextResponse.json({ error: isIt ? 'Non è stato possibile caricare la foto. Controlla il bucket Storage privato.' : 'Could not upload photo. Check the private Storage bucket.' }, { status: 500 }) }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase.from('fourge_players').update({ photo_path: path, photo_consent_at: now, photo_deleted_at: null }).eq('id', player.id)
  if (updateError) return NextResponse.json({ error: isIt ? 'Foto caricata, ma non è stato possibile aggiornare il giocatore.' : 'Photo uploaded, but player setup could not be updated.' }, { status: 500 })
  await supabase.from('fourge_analytics_events').insert({ event_name: 'photo_uploaded', crew_id: player.crew_id, player_id: player.id })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { hashPrivateToken, joinTokenForCrew, playerTokenForSlot } from '@/lib/tokens'

export const runtime = 'nodejs'

type JoinPlayerRow = {
  slot: number
  display_name: string | null
  state: string
  role_code: string | null
  is_creator: boolean
}

type SlotRow = { slot: number; state: string }

async function loadCrew(code: string, token: string) {
  const supabase = getSupabaseAdmin()
  const { data: crew, error } = await supabase
    .from('fourge_crews')
    .select('id, public_code, status, expires_at, drop_id, locale')
    .eq('public_code', code.toUpperCase())
    .single()

  if (error || !crew) return null
  if (joinTokenForCrew(crew.id) !== token) return null
  return { supabase, crew }
}

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params
  const token = new URL(request.url).searchParams.get('token') || ''
  const loaded = await loadCrew(code, token)

  if (!loaded) {
    return NextResponse.json({ error: 'Crew invite is invalid.' }, { status: 404 })
  }

  const { supabase, crew } = loaded
  const [{ data: players }, { data: drop }] = await Promise.all([
    supabase
      .from('fourge_players')
      .select('slot, display_name, state, role_code, is_creator')
      .eq('crew_id', crew.id)
      .order('slot'),
    supabase.from('fourge_drops').select('title').eq('id', crew.drop_id).single(),
  ])

  const joinedPlayers = (players || []) as JoinPlayerRow[]

  return NextResponse.json({
    crew: {
      code: crew.public_code,
      status: crew.status,
      dropTitle: drop?.title || 'THE HEIST',
      expiresAt: crew.expires_at,
      locale: crew.locale === 'it-IT' ? 'it-IT' : 'en-US',
    },
    players: joinedPlayers,
    progress: joinedPlayers.filter((player) => player.state !== 'invited').length,
    full: joinedPlayers.filter((player) => player.state !== 'invited').length >= 4,
  })
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params
  const token = new URL(request.url).searchParams.get('token') || ''
  const loaded = await loadCrew(code, token)

  if (!loaded) {
    return NextResponse.json({ error: 'Crew invite is invalid.' }, { status: 404 })
  }

  const { supabase, crew } = loaded
  const isIt = crew.locale === 'it-IT'
  const body = await request.json().catch(() => ({}))
  const displayName = String(body.name || '').trim()

  if (!displayName || displayName.length > 30) {
    return NextResponse.json({ error: isIt ? 'Inserisci un nome tra 1 e 30 caratteri.' : 'Enter a name between 1 and 30 characters.' }, { status: 400 })
  }

  const { data: existingPlayers } = await supabase
    .from('fourge_players')
    .select('slot, state')
    .eq('crew_id', crew.id)
    .order('slot')

  const occupied = new Set(((existingPlayers || []) as SlotRow[]).map((player) => player.slot))

  for (const slot of [2, 3, 4]) {
    if (occupied.has(slot)) continue

    const playerToken = playerTokenForSlot(crew.id, slot)
    const { data: player, error } = await supabase
      .from('fourge_players')
      .insert({
        crew_id: crew.id,
        slot,
        display_name: displayName,
        token_hash: hashPrivateToken(playerToken),
        is_creator: false,
        state: 'joined',
        joined_at: new Date().toISOString(),
      })
      .select('id, slot')
      .single()

    if (!error && player) {
      await supabase.from('fourge_analytics_events').insert({
        event_name: 'shared_invite_joined',
        crew_id: crew.id,
        player_id: player.id,
        properties: { slot, invite_mode: 'shared_link' },
      })

      return NextResponse.json({
        ok: true,
        slot,
        playerToken,
      })
    }

    if (error?.code !== '23505') {
      console.error(error)
      return NextResponse.json({ error: isIt ? 'Non è stato possibile entrare nella crew.' : 'Could not join crew.' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: isIt ? 'Questa crew è già completa.' : 'This crew is already full.' }, { status: 409 })
}

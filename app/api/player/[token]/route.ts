import { NextResponse } from 'next/server'
import { finalizeAttemptIfReady } from '@/lib/finalize-attempt'
import { getSiteUrl } from '@/lib/site'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { creatorTokenForCrew, hashPrivateToken } from '@/lib/tokens'

export const runtime = 'nodejs'

type PlayerStatusRow = { slot: number; display_name: string | null; state: string; role_code: string | null; photo_path: string | null; is_creator: boolean }
type RoleRow = { code: string; label: string; sort_order: number }
type OptionRow = { option_code: string; label_it: string; label_en: string; description_it: string | null; description_en: string | null }

async function loadPlayer(token: string) {
  const supabase = getSupabaseAdmin()
  const tokenHash = hashPrivateToken(token)
  const { data: player, error } = await supabase.from('fourge_players').select('id, crew_id, slot, display_name, state, role_code, photo_path, token_hash, is_creator').eq('token_hash', tokenHash).single()
  if (error || !player) return null
  return { supabase, player }
}

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  const loaded = await loadPlayer(token)
  if (!loaded) return NextResponse.json({ error: 'Invalid player link.' }, { status: 404 })

  const { supabase, player } = loaded
  const [{ data: crew }, { data: players }, { data: roles }, { data: attempt }] = await Promise.all([
    supabase.from('fourge_crews').select('public_code, status, drop_id, locale').eq('id', player.crew_id).single(),
    supabase.from('fourge_players').select('slot, display_name, state, role_code, photo_path, is_creator').eq('crew_id', player.crew_id).order('slot'),
    supabase.from('fourge_roles').select('code, label, sort_order').eq('active', true).order('sort_order'),
    supabase.from('fourge_attempts').select('id, status, ending_id').eq('crew_id', player.crew_id).order('attempt_no', { ascending: false }).limit(1).maybeSingle(),
  ])

  const locale = crew?.locale === 'it-IT' ? 'it-IT' : 'en-US'
  const isIt = locale === 'it-IT'
  const { data: drop } = crew ? await supabase.from('fourge_drops').select('title').eq('id', crew.drop_id).single() : { data: null }
  const playerRows = (players || []) as PlayerStatusRow[]
  const roleRows = ((roles || []) as RoleRow[]).map((role) => {
    const owner = playerRows.find((candidate) => candidate.role_code === role.code)
    return { code: role.code, label: role.label, taken: Boolean(owner), takenBy: owner?.display_name || null, mine: player.role_code === role.code }
  })

  let mission: null | { question: string; options: Array<{ code: string; label: string; description: string | null }> } = null
  if (crew && player.role_code) {
    const [{ data: rolePrompt }, { data: options }] = await Promise.all([
      supabase.from('fourge_drop_roles').select('question_it, question_en').eq('drop_id', crew.drop_id).eq('role_code', player.role_code).single(),
      supabase.from('fourge_drop_options').select('option_code, label_it, label_en, description_it, description_en').eq('drop_id', crew.drop_id).eq('role_code', player.role_code).order('option_code'),
    ])
    mission = {
      question: (isIt ? rolePrompt?.question_it : rolePrompt?.question_en) || (isIt ? 'Fai la tua scelta segreta.' : 'Make your secret choice.'),
      options: ((options || []) as OptionRow[]).map((option) => ({ code: option.option_code, label: isIt ? option.label_it : option.label_en, description: isIt ? option.description_it : option.description_en })),
    }
  }

  let choiceLocked = false
  if (attempt?.id) {
    const { data: choice } = await supabase.from('fourge_attempt_choices').select('id').eq('attempt_id', attempt.id).eq('player_id', player.id).maybeSingle()
    choiceLocked = Boolean(choice)
  }

  const readyCount = playerRows.filter((candidate) => candidate.state === 'complete').length
  const memberCount = playerRows.length

  return NextResponse.json({
    me: { slot: player.slot, name: player.display_name, state: player.state, role: player.role_code, photoReady: Boolean(player.photo_path), choiceLocked, isCreator: player.is_creator },
    crew: { code: crew?.public_code, status: crew?.status, dropTitle: drop?.title || 'THE HEIST', locale, memberCount, readyCount, full: memberCount >= 4, outcomeReady: attempt?.status === 'ready' },
    players: playerRows, roles: roleRows, mission,
    creatorRoomUrl: player.is_creator && crew?.public_code ? `${getSiteUrl()}/crew/${crew.public_code}?token=${creatorTokenForCrew(player.crew_id)}` : null,
  })
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  const loaded = await loadPlayer(token)
  if (!loaded) return NextResponse.json({ error: 'Invalid player link.' }, { status: 404 })
  const { supabase, player } = loaded
  const body = await request.json().catch(() => ({}))
  const { data: localeCrew } = await supabase.from('fourge_crews').select('locale').eq('id', player.crew_id).single()
  const isIt = localeCrew?.locale === 'it-IT'

  if (player.state === 'invited' && body.name) {
    const displayName = String(body.name || '').trim()
    if (!displayName || displayName.length > 30) return NextResponse.json({ error: isIt ? 'Inserisci un nome tra 1 e 30 caratteri.' : 'Enter a name between 1 and 30 characters.' }, { status: 400 })
    const { error } = await supabase.from('fourge_players').update({ display_name: displayName, state: 'joined', joined_at: new Date().toISOString() }).eq('id', player.id)
    if (error) return NextResponse.json({ error: isIt ? 'Non è stato possibile entrare nella crew.' : 'Could not join the crew.' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.role) {
    const roleCode = String(body.role || '').trim().toLowerCase()
    if (player.role_code) {
      if (player.role_code === roleCode) return NextResponse.json({ ok: true })
      return NextResponse.json({ error: isIt ? 'Il tuo ruolo è già bloccato.' : 'Your role is already locked.' }, { status: 409 })
    }
    const { data: crew } = await supabase.from('fourge_crews').select('drop_id').eq('id', player.crew_id).single()
    if (!crew) return NextResponse.json({ error: isIt ? 'Crew non trovata.' : 'Crew not found.' }, { status: 404 })
    const { data: validRole } = await supabase.from('fourge_drop_roles').select('role_code').eq('drop_id', crew.drop_id).eq('role_code', roleCode).maybeSingle()
    if (!validRole) return NextResponse.json({ error: isIt ? 'Quel ruolo non è disponibile in questo Drop.' : 'That role is not available in this Drop.' }, { status: 400 })

    const { error } = await supabase.from('fourge_players').update({ role_code: roleCode, state: 'role_claimed', role_claimed_at: new Date().toISOString() }).eq('id', player.id).is('role_code', null)
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: isIt ? 'Quel ruolo è appena stato scelto da un altro giocatore. Scegline un altro.' : 'Another player just claimed that role. Choose another one.' }, { status: 409 })
      console.error(error); return NextResponse.json({ error: isIt ? 'Non è stato possibile bloccare il ruolo.' : 'Could not lock the role.' }, { status: 500 })
    }
    await supabase.from('fourge_analytics_events').insert({ event_name: 'role_claimed', crew_id: player.crew_id, player_id: player.id, properties: { role: roleCode } })
    return NextResponse.json({ ok: true })
  }

  if (body.choice) {
    const optionCode = String(body.choice || '').trim().toUpperCase()
    if (!player.role_code || !player.photo_path) return NextResponse.json({ error: isIt ? 'Completa ruolo e foto prima di fare la scelta.' : 'Complete your role and photo before making a choice.' }, { status: 409 })
    const { data: crew } = await supabase.from('fourge_crews').select('drop_id').eq('id', player.crew_id).single()
    if (!crew) return NextResponse.json({ error: isIt ? 'Crew non trovata.' : 'Crew not found.' }, { status: 404 })
    const { data: validOption } = await supabase.from('fourge_drop_options').select('option_code').eq('drop_id', crew.drop_id).eq('role_code', player.role_code).eq('option_code', optionCode).maybeSingle()
    if (!validOption) return NextResponse.json({ error: isIt ? 'Quella scelta non è valida per il tuo ruolo.' : 'That choice is not valid for your role.' }, { status: 400 })
    const { data: attempt } = await supabase.from('fourge_attempts').select('id, status').eq('crew_id', player.crew_id).eq('status', 'collecting').maybeSingle()
    if (!attempt) return NextResponse.json({ error: isIt ? 'Questo tentativo è già bloccato.' : 'This attempt is already locked.' }, { status: 409 })
    const { error: choiceError } = await supabase.from('fourge_attempt_choices').insert({ attempt_id: attempt.id, player_id: player.id, role_code: player.role_code, option_code: optionCode })
    if (choiceError) {
      if (choiceError.code === '23505') return NextResponse.json({ error: isIt ? 'La tua scelta segreta è già bloccata.' : 'Your secret choice is already locked.' }, { status: 409 })
      console.error(choiceError); return NextResponse.json({ error: isIt ? 'Non è stato possibile bloccare la scelta.' : 'Could not lock the choice.' }, { status: 500 })
    }
    const now = new Date().toISOString()
    await supabase.from('fourge_players').update({ state: 'complete', completed_at: now }).eq('id', player.id)
    await supabase.from('fourge_crews').update({ last_activity_at: now }).eq('id', player.crew_id)
    await supabase.from('fourge_analytics_events').insert({ event_name: 'choice_locked', crew_id: player.crew_id, player_id: player.id, attempt_id: attempt.id, properties: { role: player.role_code } })
    await finalizeAttemptIfReady(player.crew_id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: isIt ? 'Nessun aggiornamento da salvare.' : 'No update to save.' }, { status: 400 })
}

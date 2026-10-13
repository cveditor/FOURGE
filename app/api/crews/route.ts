import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { createPublicCode } from '@/lib/codes'
import { getSiteUrl } from '@/lib/site'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  creatorTokenForCrew,
  hashPrivateToken,
  joinTokenForCrew,
  playerTokenForSlot,
} from '@/lib/tokens'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const creatorName = String(body.creatorName || '').trim()
    const locale = body.locale === 'it-IT' ? 'it-IT' : 'en-US'
    const isIt = locale === 'it-IT'

    if (!creatorName || creatorName.length > 30) {
      return NextResponse.json({ error: isIt ? 'Inserisci un nome valido.' : 'Enter a valid creator name.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: drop, error: dropError } = await supabase
      .from('fourge_drops')
      .select('id, slug, title')
      .eq('slug', 'the-heist')
      .single()

    if (dropError || !drop) {
      return NextResponse.json({ error: 'THE HEIST drop is not installed in Supabase.' }, { status: 500 })
    }

    const crewId = randomUUID()
    let publicCode = createPublicCode()

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data } = await supabase
        .from('fourge_crews')
        .select('id')
        .eq('public_code', publicCode)
        .maybeSingle()
      if (!data) break
      publicCode = createPublicCode()
    }

    const creatorToken = creatorTokenForCrew(crewId)
    const creatorPlayerToken = playerTokenForSlot(crewId, 1)
    const sharedJoinToken = joinTokenForCrew(crewId)

    const { error: crewError } = await supabase.from('fourge_crews').insert({
      id: crewId,
      drop_id: drop.id,
      public_code: publicCode,
      creator_token_hash: hashPrivateToken(creatorToken),
      locale,
      status: 'collecting',
    })

    if (crewError) throw crewError

    const { error: playerError } = await supabase.from('fourge_players').insert({
      crew_id: crewId,
      slot: 1,
      display_name: creatorName,
      token_hash: hashPrivateToken(creatorPlayerToken),
      is_creator: true,
      state: 'joined',
      joined_at: new Date().toISOString(),
    })

    if (playerError) {
      await supabase.from('fourge_crews').delete().eq('id', crewId)
      throw playerError
    }

    const { error: attemptError } = await supabase.from('fourge_attempts').insert({
      crew_id: crewId,
      attempt_no: 1,
      status: 'collecting',
    })

    if (attemptError) {
      await supabase.from('fourge_crews').delete().eq('id', crewId)
      throw attemptError
    }

    await supabase.from('fourge_analytics_events').insert({
      event_name: 'crew_created',
      crew_id: crewId,
      properties: { drop: drop.slug, invite_mode: 'shared_link', locale },
    })

    const siteUrl = getSiteUrl()

    return NextResponse.json({
      crewCode: publicCode,
      creatorToken,
      creatorPlayerToken,
      creatorPlayUrl: `${siteUrl}/join/${creatorPlayerToken}`,
      creatorRoomUrl: `${siteUrl}/crew/${publicCode}?token=${creatorToken}`,
      sharedJoinUrl: `${siteUrl}/crew/${publicCode}/join?token=${sharedJoinToken}`,
    })
  } catch (cause) {
    console.error(cause)
    return NextResponse.json({ error: 'Could not create the crew.' }, { status: 500 })
  }
}

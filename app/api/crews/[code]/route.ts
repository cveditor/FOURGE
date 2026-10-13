import { NextResponse } from 'next/server'
import { getSiteUrl } from '@/lib/site'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  creatorTokenForCrew,
  hashPrivateToken,
  joinTokenForCrew,
  playerTokenForSlot,
} from '@/lib/tokens'

export const runtime = 'nodejs'

type CrewPlayerRow = {
  slot: number
  display_name: string | null
  state: string
  role_code: string | null
  is_creator: boolean
}

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params
    const token = new URL(request.url).searchParams.get('token') || ''
    const supabase = getSupabaseAdmin()

    const { data: crew, error } = await supabase
      .from('fourge_crews')
      .select('id, public_code, creator_token_hash, status, expires_at, locale, drop_id')
      .eq('public_code', code.toUpperCase())
      .single()

    if (error || !crew || hashPrivateToken(token) !== crew.creator_token_hash) {
      return NextResponse.json({ error: 'Private crew link is invalid.' }, { status: 401 })
    }

    const expectedCreatorToken = creatorTokenForCrew(crew.id)
    if (expectedCreatorToken !== token) {
      return NextResponse.json({ error: 'Private crew link is invalid.' }, { status: 401 })
    }

    const [{ data: players }, { data: drop }] = await Promise.all([
      supabase
        .from('fourge_players')
        .select('slot, display_name, state, role_code, is_creator')
        .eq('crew_id', crew.id)
        .order('slot'),
      supabase.from('fourge_drops').select('title, slug').eq('id', crew.drop_id).single(),
    ])

    const siteUrl = getSiteUrl()
    const playerRows = (players || []) as CrewPlayerRow[]

    return NextResponse.json({
      crew: {
        code: crew.public_code,
        status: crew.status,
        expiresAt: crew.expires_at,
        dropTitle: drop?.title || 'THE HEIST',
        locale: crew.locale === 'it-IT' ? 'it-IT' : 'en-US',
      },
      players: playerRows,
      progress: playerRows.filter((player) => player.state === 'complete').length,
      memberCount: playerRows.length,
      readyCount: playerRows.filter((player) => player.state === 'complete').length,
      full: playerRows.length >= 4,
      sharedJoinUrl: `${siteUrl}/crew/${crew.public_code}/join?token=${joinTokenForCrew(crew.id)}`,
      creatorPlayUrl: `${siteUrl}/join/${playerTokenForSlot(crew.id, 1)}`,
    })
  } catch (cause) {
    console.error(cause)
    return NextResponse.json({ error: 'Could not load crew.' }, { status: 500 })
  }
}

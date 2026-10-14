import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { creatorTokenForCrew, hashPrivateToken } from '@/lib/tokens'
import { percentileAgainst, scoreCombination, type OptionWeightRow } from '@/lib/fourge-score'
import { getEndingLongDescription } from '@/lib/ending-copy'

export const runtime = 'nodejs'

const ROLE_ORDER = ['architect', 'driver', 'diplomat', 'maverick'] as const
const ROLE_LABELS: Record<string, string> = {
  architect: 'THE ARCHITECT', driver: 'THE DRIVER', diplomat: 'THE DIPLOMAT', maverick: 'THE MAVERICK',
}

type PlayerRow = { id: string; slot: number; display_name: string | null; role_code: string | null; photo_path: string | null; token_hash: string; is_creator: boolean }
type EndingLite = { id: string; rarity: string }
type MapLite = { combination: string; ending_id: string }

function rarityLabel(rarity: string) {
  return rarity === 'common' ? 'COMMON' : rarity === 'rare' ? 'RARE' : rarity === 'epic' ? 'EPIC' : rarity === 'legendary' ? 'LEGENDARY' : rarity === 'secret' ? 'SECRET' : rarity.toUpperCase()
}

function percentValueFromCount(count: number) { return (count / 256) * 100 }
function formatPercent(value: number) {
  if (value < 1) return `${value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}%`
  if (value < 10) return `${value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}%`
  return `${value.toFixed(1).replace(/\.0$/, '')}%`
}

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params
    const token = new URL(request.url).searchParams.get('token') || ''
    const supabase = getSupabaseAdmin()

    const { data: crew, error: crewError } = await supabase.from('fourge_crews').select('id, public_code, creator_token_hash, status, drop_id, locale').eq('public_code', code.toUpperCase()).single()
    if (crewError || !crew) return NextResponse.json({ error: 'Crew not found.' }, { status: 404 })

    const tokenHash = hashPrivateToken(token)
    const creatorValid = tokenHash === crew.creator_token_hash && creatorTokenForCrew(crew.id) === token
    let playerValid = false
    if (!creatorValid && token) {
      const { data: matchingPlayer } = await supabase.from('fourge_players').select('id').eq('crew_id', crew.id).eq('token_hash', tokenHash).maybeSingle()
      playerValid = Boolean(matchingPlayer)
    }
    if (!creatorValid && !playerValid) return NextResponse.json({ error: 'Invalid Reveal link.' }, { status: 401 })

    const [{ data: attempt }, { data: drop }, { data: players }, { count: discoveryCount }, { data: options }, { data: allEndings }, { data: routeMap }] = await Promise.all([
      supabase.from('fourge_attempts').select('id, status, combination, ending_id, attempt_no').eq('crew_id', crew.id).in('status', ['ready', 'revealed']).order('attempt_no', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('fourge_drops').select('sequence_no, title, slug').eq('id', crew.drop_id).single(),
      supabase.from('fourge_players').select('id, slot, display_name, role_code, photo_path, token_hash, is_creator').eq('crew_id', crew.id).order('slot'),
      supabase.from('fourge_crew_discoveries').select('*', { count: 'exact', head: true }).eq('crew_id', crew.id),
      supabase.from('fourge_drop_options').select('role_code, option_code, weights').eq('drop_id', crew.drop_id),
      supabase.from('fourge_endings').select('id, rarity').eq('drop_id', crew.drop_id),
      supabase.from('fourge_ending_map').select('combination, ending_id').eq('drop_id', crew.drop_id),
    ])

    if (!attempt?.ending_id || !attempt.combination) return NextResponse.json({ error: 'The ending is not ready yet.' }, { status: 409 })

    const [{ data: ending }, { data: endingMap }] = await Promise.all([
      supabase.from('fourge_endings').select('id, code, name_en, rarity, theoretical_count, description_en, description_it, is_secret, display_order, card_preset_key').eq('id', attempt.ending_id).single(),
      supabase.from('fourge_ending_map').select('story_en, story_it').eq('drop_id', crew.drop_id).eq('combination', attempt.combination).maybeSingle(),
    ])
    if (!ending) return NextResponse.json({ error: 'Ending not found.' }, { status: 404 })

    const optionRows = (options || []) as OptionWeightRow[]
    const endingRows = (allEndings || []) as EndingLite[]
    const routeRows = (routeMap || []) as MapLite[]
    const rarityByEnding = new Map(endingRows.map((item) => [item.id, item.rarity]))
    const currentScore = scoreCombination(attempt.combination, ending.rarity, optionRows).score
    const theoreticalScores = routeRows.map((route) => {
      const rarity = rarityByEnding.get(route.ending_id)
      return rarity ? scoreCombination(route.combination, rarity, optionRows).score : null
    }).filter((score): score is number => score !== null)

    const routeBeatPercent = percentileAgainst(currentScore, theoreticalScores)
    const betterRoutes = theoreticalScores.filter((score) => score > currentScore).length
    const theoreticalTopPercent = theoreticalScores.length ? ((betterRoutes + 1) / theoreticalScores.length) * 100 : 100
    const endingProbabilityValue = percentValueFromCount(ending.theoretical_count)
    const endingRarerThan = Math.max(0, 100 - endingProbabilityValue)

    const rows = (players || []) as PlayerRow[]
    const signedByPath = new Map<string, string>()
    const photoPaths = rows.map((player) => player.photo_path).filter((path): path is string => Boolean(path))
    if (photoPaths.length) {
      const { data: signed } = await supabase.storage.from('fourge-player-photos').createSignedUrls(photoPaths, 60 * 30)
      for (const item of signed || []) if (item.path && item.signedUrl) signedByPath.set(item.path, item.signedUrl)
    }

    const orderedPlayers = [...rows].sort((a, b) => ROLE_ORDER.indexOf((a.role_code || '') as (typeof ROLE_ORDER)[number]) - ROLE_ORDER.indexOf((b.role_code || '') as (typeof ROLE_ORDER)[number]))

    let aiCard: { status: string; masterUrl: string | null; storyUrl: string | null } = { status: 'not_generated', masterUrl: null, storyUrl: null }
    const { data: generatedScene } = await supabase
      .from('fourge_generated_cards')
      .select('status, output_path')
      .eq('attempt_id', attempt.id)
      .eq('preset_version', 'ai-wildcard-v0-prelaunch2')
      .maybeSingle()
    if (generatedScene) {
      aiCard.status = generatedScene.status
      if (generatedScene.status === 'ready' && generatedScene.output_path) {
        const storyPath = `${crew.id}/${attempt.id}/wild-card-story-prelaunch2.png`
        const [{ data: signedMaster }, { data: signedStory }] = await Promise.all([
          supabase.storage.from('fourge-generated-scenes').createSignedUrl(generatedScene.output_path, 60 * 60),
          supabase.storage.from('fourge-generated-scenes').createSignedUrl(storyPath, 60 * 60),
        ])
        aiCard.masterUrl = signedMaster?.signedUrl || null
        aiCard.storyUrl = signedStory?.signedUrl || null
      }
    }

    const isIt = crew.locale === 'it-IT'

    return NextResponse.json({
      crew: { code: crew.public_code, locale: crew.locale === 'it-IT' ? 'it-IT' : 'en-US' },
      drop: { sequence: drop?.sequence_no || 1, title: drop?.title || 'THE HEIST' },
      ending: {
        code: ending.code, name: ending.name_en, rarity: ending.rarity, rarityLabel: rarityLabel(ending.rarity),
        description: getEndingLongDescription(ending.code, isIt ? 'it-IT' : 'en-US'), theoreticalCount: ending.theoretical_count,
        probability: formatPercent(endingProbabilityValue), rarerThan: formatPercent(endingRarerThan), displayOrder: ending.display_order,
        isSecret: ending.is_secret, presetKey: ending.card_preset_key,
      },
      competition: { score: currentScore, routeBeatPercent: formatPercent(routeBeatPercent), theoreticalTopPercent: formatPercent(theoreticalTopPercent) },
      collection: { discovered: discoveryCount || 1, total: 16 },
      aiCard,
      players: orderedPlayers.map((player) => ({ slot: player.slot, name: player.display_name || `Player ${player.slot}`, role: player.role_code || 'unknown', roleLabel: ROLE_LABELS[player.role_code || ''] || (player.role_code || 'ROLE').toUpperCase(), photoUrl: player.photo_path ? signedByPath.get(player.photo_path) || null : null })),
    })
  } catch (cause) {
    console.error(cause)
    return NextResponse.json({ error: 'Could not load Reveal.' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import OpenAI, { toFile } from 'openai'
import sharp from 'sharp'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { creatorTokenForCrew, hashPrivateToken } from '@/lib/tokens'
import {
  buildCompositionGuideSvg,
  buildWildcardReferencePrompt,
  getEndingTagline,
  getEndingVisualPreset,
} from '@/lib/wildcard-scene-prompt'
import { masterGraphicsSvg, renderMasterTextSvg } from '@/lib/wildcard-overlay'
import { getEndingShortDescription } from '@/lib/ending-copy'

export const runtime = 'nodejs'
export const maxDuration = 120

const PHOTO_BUCKET = 'fourge-player-photos'
const OUTPUT_BUCKET = 'fourge-generated-scenes'
const PRESET_VERSION = 'ai-wildcard-v0-prelaunch2'
const ROLE_ORDER = ['architect', 'driver', 'diplomat', 'maverick'] as const

// OpenAI renders the AI source in a supported portrait size.
// FOURGE then extracts the central 4:5 safe area and builds the shareable master.
const AI_WIDTH = 1024
const AI_HEIGHT = 1536

const MASTER_WIDTH = 1088
const MASTER_HEIGHT = 1360

// Exact 9:16 wrapper for Stories. The 4:5 master sits inside without cropping.
const STORY_WIDTH = 1152
const STORY_HEIGHT = 2048

const MASTER_CARD_NAME = 'wild-card-master-prelaunch2.png'
const STORY_CARD_NAME = 'wild-card-story-prelaunch2.png'
const RAW_SCENE_NAME = 'wild-card-scene-prelaunch2.png'

type PlayerRow = {
  id: string
  display_name: string | null
  role_code: string | null
  photo_path: string | null
  token_hash: string
}

function chanceFromCount(count: number) {
  const value = (Number(count || 0) / 256) * 100
  if (value < 10) return `${value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}%`
  return `${value.toFixed(1).replace(/\.0$/, '')}%`
}

function storyBackdropSvg() {
  return Buffer.from(`
    <svg width="${STORY_WIDTH}" height="${STORY_HEIGHT}" viewBox="0 0 ${STORY_WIDTH} ${STORY_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="50%" cy="48%" r="48%">
          <stop offset="0" stop-color="#9a6bff" stop-opacity="0.15"/>
          <stop offset="1" stop-color="#09070d" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="#08060b" fill-opacity="0.56"/>
      <rect width="100%" height="100%" fill="url(#glow)"/>
      <rect x="78" y="388" width="996" height="1272" rx="30" fill="#000000" fill-opacity="0.28"/>
    </svg>`)
}

async function makeStoryWrapper(masterCard: Buffer) {
  const background = await sharp(masterCard)
    .resize(STORY_WIDTH, STORY_HEIGHT, { fit: 'cover', position: 'centre' })
    .blur(30)
    .modulate({ brightness: 0.36, saturation: 0.72 })
    .png()
    .toBuffer()

  const card = await sharp(masterCard)
    .resize(960, 1200, { fit: 'fill' })
    .png()
    .toBuffer()

  return sharp(background)
    .composite([
      { input: storyBackdropSvg(), top: 0, left: 0 },
      { input: card, top: 424, left: 96 },
    ])
    .png()
    .toBuffer()
}

async function authorizeCrewToken(crewId: string, creatorHash: string, token: string) {
  const supabase = getSupabaseAdmin()
  const tokenHash = hashPrivateToken(token)
  const creatorValid = tokenHash === creatorHash && creatorTokenForCrew(crewId) === token
  if (creatorValid) return true
  const { data } = await supabase.from('fourge_players').select('id').eq('crew_id', crewId).eq('token_hash', tokenHash).maybeSingle()
  return Boolean(data)
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  let attemptId = ''
  try {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'OPENAI_API_KEY is missing from .env.local.' }, { status: 500 })

    const { code } = await context.params
    const requestUrl = new URL(request.url)
    const token = requestUrl.searchParams.get('token') || ''
    const regenerate = requestUrl.searchParams.get('regenerate') === '1'
    const supabase = getSupabaseAdmin()

    const { data: crew, error: crewError } = await supabase
      .from('fourge_crews')
      .select('id, public_code, creator_token_hash, drop_id')
      .eq('public_code', code.toUpperCase())
      .single()

    if (crewError || !crew) return NextResponse.json({ error: 'Crew not found.' }, { status: 404 })
    if (!(await authorizeCrewToken(crew.id, crew.creator_token_hash, token))) return NextResponse.json({ error: 'Invalid Wild Card link.' }, { status: 401 })

    const { data: attempt } = await supabase
      .from('fourge_attempts')
      .select('id, ending_id, combination, status')
      .eq('crew_id', crew.id)
      .in('status', ['ready', 'revealed'])
      .order('attempt_no', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!attempt?.id || !attempt.ending_id) return NextResponse.json({ error: 'The ending is not ready yet.' }, { status: 409 })
    attemptId = attempt.id

    const masterPath = `${crew.id}/${attempt.id}/${MASTER_CARD_NAME}`
    const storyPath = `${crew.id}/${attempt.id}/${STORY_CARD_NAME}`

    const { data: cached } = await supabase
      .from('fourge_generated_cards')
      .select('id, status, output_path')
      .eq('attempt_id', attempt.id)
      .eq('preset_version', PRESET_VERSION)
      .maybeSingle()

    if (!regenerate && cached?.status === 'ready' && cached.output_path) {
      const [{ data: masterSigned }, { data: storySigned }] = await Promise.all([
        supabase.storage.from(OUTPUT_BUCKET).createSignedUrl(cached.output_path, 60 * 60),
        supabase.storage.from(OUTPUT_BUCKET).createSignedUrl(storyPath, 60 * 60),
      ])
      return NextResponse.json({ ok: true, cached: true, status: 'ready', masterUrl: masterSigned?.signedUrl || null, storyUrl: storySigned?.signedUrl || null })
    }

    if (cached?.status === 'generating') {
      return NextResponse.json({ ok: true, status: 'generating' }, { status: 202 })
    }

    const now = new Date().toISOString()
    let lockAcquired = false
    if (cached?.id) {
      const { data: claimed } = await supabase.from('fourge_generated_cards')
        .update({ status: 'generating', started_at: now, completed_at: null, error_message: null })
        .eq('id', cached.id)
        .neq('status', 'generating')
        .select('id')
        .maybeSingle()
      lockAcquired = Boolean(claimed?.id)
    } else {
      const { data: inserted, error: insertError } = await supabase.from('fourge_generated_cards').insert({
        crew_id: crew.id, attempt_id: attempt.id, preset_version: PRESET_VERSION, status: 'generating', started_at: now, completed_at: null, error_message: null,
      }).select('id').maybeSingle()
      if (insertError?.code === '23505') return NextResponse.json({ ok: true, status: 'generating' }, { status: 202 })
      if (insertError) throw insertError
      lockAcquired = Boolean(inserted?.id)
    }

    if (!lockAcquired) return NextResponse.json({ ok: true, status: 'generating' }, { status: 202 })

    const [{ data: ending }, { data: players }] = await Promise.all([
      supabase.from('fourge_endings').select('code, name_en, rarity, theoretical_count').eq('id', attempt.ending_id).single(),
      supabase.from('fourge_players').select('id, display_name, role_code, photo_path, token_hash').eq('crew_id', crew.id),
    ])

    if (!ending) return NextResponse.json({ error: 'Ending not found.' }, { status: 404 })

    const rows = (players || []) as PlayerRow[]
    if (rows.length !== 4 || rows.some((player) => !player.role_code || !player.photo_path)) {
      return NextResponse.json({ error: 'All four players need a role and photo before generating the AI Wild Card.' }, { status: 409 })
    }

    const ordered = [...rows].sort((a, b) => ROLE_ORDER.indexOf((a.role_code || '') as (typeof ROLE_ORDER)[number]) - ROLE_ORDER.indexOf((b.role_code || '') as (typeof ROLE_ORDER)[number]))

    // Normalize every player photo into a real PNG before sending it to OpenAI.
    // This avoids extension/MIME mismatches from browser uploads and strips odd EXIF/container data.
    const identityFiles = await Promise.all(ordered.map(async (player, index) => {
      const path = player.photo_path as string
      const { data: blob, error } = await supabase.storage.from(PHOTO_BUCKET).download(path)
      if (error || !blob) throw new Error(`Could not load reference photo ${index + 1}.`)
      const source = Buffer.from(await blob.arrayBuffer())
      const normalized = await sharp(source)
        .rotate()
        .resize({ width: 1536, height: 1536, fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer()
      return toFile(normalized, `identity-${index + 1}.png`, { type: 'image/png' })
    }))

    // IMPORTANT: buildCompositionGuideSvg returns SVG bytes.
    // In the previous V0 we only *named* those bytes .png, which made the Images API reject
    // the fifth reference as `invalid_image_file`. Rasterize it first so it is a genuine PNG.
    const compositionGuideSvg = buildCompositionGuideSvg(ending.code, AI_WIDTH, AI_HEIGHT)
    const compositionGuidePng = await sharp(compositionGuideSvg).png().toBuffer()
    const guideFile = await toFile(compositionGuidePng, 'composition-guide.png', { type: 'image/png' })
    const referenceFiles = [...identityFiles, guideFile]

    const prompt = buildWildcardReferencePrompt({
      endingCode: ending.code,
      endingName: ending.name_en,
      rarity: ending.rarity,
      crew: ordered.map((player) => ({
        name: player.display_name || 'Crew member',
        role: player.role_code || 'crew',
      })),
    })

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const result = await openai.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-sunburst',
      image: referenceFiles,
      prompt,
      size: `${AI_WIDTH}x${AI_HEIGHT}`,
      quality: 'high',
      output_format: 'png',
    })

    const base64 = result.data?.[0]?.b64_json
    if (!base64) throw new Error('OpenAI returned no image data.')

    const rawScene = Buffer.from(base64, 'base64')

    // OpenAI returns a portrait image (normally 1024x1536, 2:3). The master is 4:5.
    // Use ONE Sharp resize operation with fit:'cover' and centre positioning.
    // This safely crops only the excess top/bottom area and avoids invalid extract regions,
    // even if the decoded source dimensions differ slightly from what we requested.
    const sourceMeta = await sharp(rawScene).metadata()
    if (!sourceMeta.width || !sourceMeta.height) {
      throw new Error('Generated AI scene has invalid dimensions.')
    }

    const normalizedScene = await sharp(rawScene)
      .rotate()
      .resize(MASTER_WIDTH, MASTER_HEIGHT, {
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: false,
      })
      .png()
      .toBuffer()

    const [graphicsOverlay, textOverlay] = await Promise.all([
      Promise.resolve(masterGraphicsSvg(ending.rarity)),
      renderMasterTextSvg({
        endingName: ending.name_en,
        rarity: ending.rarity,
        chance: chanceFromCount(ending.theoretical_count),
        tagline: getEndingShortDescription(ending.code) || getEndingTagline(ending.code),
      }),
    ])

    const masterCard = await sharp(normalizedScene)
      .composite([
        { input: graphicsOverlay, top: 0, left: 0 },
        { input: textOverlay, top: 0, left: 0 },
      ])
      .png()
      .toBuffer()

    const storyCard = await makeStoryWrapper(masterCard)
    const rawPath = `${crew.id}/${attempt.id}/${RAW_SCENE_NAME}`

    const [{ error: rawError }, { error: masterError }, { error: storyError }] = await Promise.all([
      supabase.storage.from(OUTPUT_BUCKET).upload(rawPath, normalizedScene, { contentType: 'image/png', upsert: true }),
      supabase.storage.from(OUTPUT_BUCKET).upload(masterPath, masterCard, { contentType: 'image/png', upsert: true }),
      supabase.storage.from(OUTPUT_BUCKET).upload(storyPath, storyCard, { contentType: 'image/png', upsert: true }),
    ])

    if (rawError) throw rawError
    if (masterError) throw masterError
    if (storyError) throw storyError

    await supabase.from('fourge_generated_cards').upsert({
      crew_id: crew.id,
      attempt_id: attempt.id,
      preset_version: PRESET_VERSION,
      status: 'ready',
      output_path: masterPath,
      completed_at: new Date().toISOString(),
      error_message: null,
    }, { onConflict: 'attempt_id,preset_version' })

    const preset = getEndingVisualPreset(ending.code)
    await supabase.from('fourge_analytics_events').insert({
      event_name: 'ai_wildcard_prelaunch2_generated',
      crew_id: crew.id,
      attempt_id: attempt.id,
      properties: {
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-sunburst',
        regenerated: regenerate,
        family: preset.family,
        ai_requested_size: `${AI_WIDTH}x${AI_HEIGHT}`,
        ai_actual_size: `${sourceMeta.width}x${sourceMeta.height}`, 
        master_size: `${MASTER_WIDTH}x${MASTER_HEIGHT}`,
        story_size: `${STORY_WIDTH}x${STORY_HEIGHT}`,
      },
    })

    const [{ data: masterSigned }, { data: storySigned }] = await Promise.all([
      supabase.storage.from(OUTPUT_BUCKET).createSignedUrl(masterPath, 60 * 60),
      supabase.storage.from(OUTPUT_BUCKET).createSignedUrl(storyPath, 60 * 60),
    ])

    return NextResponse.json({
      ok: true,
      cached: false,
      status: 'ready',
      family: preset.family,
      masterUrl: masterSigned?.signedUrl || null,
      storyUrl: storySigned?.signedUrl || null,
    })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Could not generate the AI Wild Card.'
    console.error('FOURGE final V0 Wild Card generation failed:', cause)
    if (attemptId) {
      const supabase = getSupabaseAdmin()
      await supabase.from('fourge_generated_cards')
        .update({ status: 'failed', error_message: message.slice(0, 1000), completed_at: new Date().toISOString() })
        .eq('attempt_id', attemptId)
        .eq('preset_version', PRESET_VERSION)
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

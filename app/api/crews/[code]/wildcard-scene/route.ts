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

export const runtime = 'nodejs'
export const maxDuration = 120

const PHOTO_BUCKET = 'fourge-player-photos'
const OUTPUT_BUCKET = 'fourge-generated-scenes'
const PRESET_VERSION = 'ai-wildcard-v0-final-fix2'
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

const MASTER_CARD_NAME = 'wild-card-master-v0-fix2.png'
const STORY_CARD_NAME = 'wild-card-story-v0-fix2.png'
const RAW_SCENE_NAME = 'wild-card-scene-v0-fix2.png'

type PlayerRow = {
  id: string
  display_name: string | null
  role_code: string | null
  photo_path: string | null
  token_hash: string
}

function mimeFromPath(path: string) {
  const lower = path.toLowerCase()
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.png')) return 'image/png'
  return 'image/jpeg'
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char] || char))
}

function rarityColor(rarity: string) {
  if (rarity === 'rare') return '#5EA1FF'
  if (rarity === 'epic') return '#A66BFF'
  if (rarity === 'legendary') return '#E8BF59'
  if (rarity === 'secret') return '#F2F3FF'
  return '#A9B0B7'
}

function titleLines(title: string) {
  const words = title.toUpperCase().split(/\s+/).filter(Boolean)
  if (title.length <= 17 || words.length === 1) return [title.toUpperCase()]
  let first = ''
  let second = ''
  for (const word of words) {
    if (!second && `${first} ${word}`.trim().length <= 17) first = `${first} ${word}`.trim()
    else second = `${second} ${word}`.trim()
  }
  return second ? [first, second] : [first]
}

function wrapTagline(value: string, max = 52) {
  const words = value.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = `${current} ${word}`.trim()
    if (candidate.length > max && current) {
      lines.push(current)
      current = word
    } else current = candidate
  }
  if (current) lines.push(current)
  return lines.slice(0, 2)
}

function masterOverlaySvg(endingCode: string, endingName: string, rarity: string) {
  const color = rarityColor(rarity)
  const title = titleLines(endingName)
  const tagline = wrapTagline(getEndingTagline(endingCode))
  const titleFont = title.length > 1 ? 78 : endingName.length > 18 ? 76 : 92
  const titleStart = title.length > 1 ? 1090 : 1150
  const titleLine2 = title[1]
    ? `<text x="64" y="${titleStart + 82}" class="title">${escapeXml(title[1])}</text>`
    : ''
  const taglineStart = title.length > 1 ? 1240 : 1236
  const taglineSecond = tagline[1]
    ? `<text x="64" y="${taglineStart + 32}" class="tagline">${escapeXml(tagline[1])}</text>`
    : ''

  return Buffer.from(`
  <svg width="${MASTER_WIDTH}" height="${MASTER_HEIGHT}" viewBox="0 0 ${MASTER_WIDTH} ${MASTER_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#040308" stop-opacity="0.74"/>
        <stop offset="1" stop-color="#040308" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bottomShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#050409" stop-opacity="0"/>
        <stop offset="0.36" stop-color="#050409" stop-opacity="0.26"/>
        <stop offset="1" stop-color="#050409" stop-opacity="0.96"/>
      </linearGradient>
      <filter id="titleShadow" x="-20%" y="-20%" width="140%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="blur"/>
        <feOffset dy="6" result="off"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.68"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <style>
        .brand{font-family:Arial,Helvetica,sans-serif;font-size:29px;font-weight:900;letter-spacing:7px;fill:#ffffff}
        .meta{font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;letter-spacing:4px;fill:#d9d4df}
        .rarity{font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:900;letter-spacing:4px;fill:${color}}
        .title{font-family:Arial,Helvetica,sans-serif;font-size:${titleFont}px;font-weight:900;letter-spacing:-3px;fill:#ffffff}
        .tagline{font-family:Georgia,'Times New Roman',serif;font-size:24px;font-style:italic;fill:#d9d4df}
        .micro{font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;fill:#8f8995}
      </style>
    </defs>

    <rect width="${MASTER_WIDTH}" height="330" fill="url(#topShade)"/>
    <rect y="760" width="${MASTER_WIDTH}" height="600" fill="url(#bottomShade)"/>
    <rect x="10" y="10" width="${MASTER_WIDTH - 20}" height="${MASTER_HEIGHT - 20}" rx="18" fill="none" stroke="${color}" stroke-width="8"/>

    <g text-anchor="middle">
      <text x="${MASTER_WIDTH / 2}" y="66" class="brand">FOURGE<tspan fill="#9A6BFF">.</tspan></text>
      <text x="${MASTER_WIDTH / 2}" y="96" class="meta">DROP #01 · THE HEIST</text>
    </g>

    <g transform="translate(64,1000)">
      <rect width="230" height="48" rx="24" fill="#07060B" fill-opacity="0.78" stroke="${color}" stroke-opacity="0.72"/>
      <circle cx="25" cy="24" r="5.5" fill="${color}"/>
      <text x="45" y="31" class="rarity">${escapeXml(rarity.toUpperCase())}</text>
    </g>

    <g filter="url(#titleShadow)">
      <text x="64" y="${titleStart}" class="title">${escapeXml(title[0])}</text>
      ${titleLine2}
    </g>

    <text x="64" y="${taglineStart}" class="tagline">${escapeXml(tagline[0] || '')}</text>
    ${taglineSecond}
    <text x="64" y="1322" class="micro">4 FRIENDS · 4 SECRET CHOICES · 1 OUTCOME</text>
  </svg>`)
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
      return NextResponse.json({ ok: true, cached: true, masterUrl: masterSigned?.signedUrl || null, storyUrl: storySigned?.signedUrl || null })
    }

    if (cached?.status === 'generating') return NextResponse.json({ error: 'This Wild Card is already being generated.' }, { status: 409 })

    const [{ data: ending }, { data: players }] = await Promise.all([
      supabase.from('fourge_endings').select('code, name_en, rarity').eq('id', attempt.ending_id).single(),
      supabase.from('fourge_players').select('id, display_name, role_code, photo_path, token_hash').eq('crew_id', crew.id),
    ])

    if (!ending) return NextResponse.json({ error: 'Ending not found.' }, { status: 404 })

    const rows = (players || []) as PlayerRow[]
    if (rows.length !== 4 || rows.some((player) => !player.role_code || !player.photo_path)) {
      return NextResponse.json({ error: 'All four players need a role and photo before generating the AI Wild Card.' }, { status: 409 })
    }

    const ordered = [...rows].sort((a, b) => ROLE_ORDER.indexOf((a.role_code || '') as (typeof ROLE_ORDER)[number]) - ROLE_ORDER.indexOf((b.role_code || '') as (typeof ROLE_ORDER)[number]))

    await supabase.from('fourge_generated_cards').upsert({
      crew_id: crew.id,
      attempt_id: attempt.id,
      preset_version: PRESET_VERSION,
      status: 'generating',
      started_at: new Date().toISOString(),
      completed_at: null,
      error_message: null,
    }, { onConflict: 'attempt_id,preset_version' })

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

    const masterCard = await sharp(normalizedScene)
      .composite([{ input: masterOverlaySvg(ending.code, ending.name_en, ending.rarity), top: 0, left: 0 }])
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
      event_name: 'ai_wildcard_v0_generated',
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

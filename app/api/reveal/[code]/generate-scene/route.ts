import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildWildcardScenePrompt } from '@/lib/wildcard-scene-prompt'
import { generateWildcardSceneImage } from '@/lib/generate-wildcard-scene'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY')
  }

  return createClient(url, key)
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = getSupabaseAdmin()
    const crewCode = params.code

    // 1) Crew
    const { data: crew, error: crewError } = await supabase
      .from('fourge_crews')
      .select('id, public_code')
      .eq('public_code', crewCode)
      .single()

    if (crewError || !crew) {
      return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    }

    // 2) Latest attempt with ending
    const { data: attempt, error: attemptError } = await supabase
      .from('fourge_attempts')
      .select('id, attempt_no, ending_id, status')
      .eq('crew_id', crew.id)
      .not('ending_id', 'is', null)
      .order('attempt_no', { ascending: false })
      .limit(1)
      .single()

    if (attemptError || !attempt?.ending_id) {
      return NextResponse.json({ error: 'No resolved ending found yet' }, { status: 400 })
    }

    // 3) Ending
    const { data: ending, error: endingError } = await supabase
      .from('fourge_endings')
      .select('id, code, name_en, rarity, description_en, theoretical_count')
      .eq('id', attempt.ending_id)
      .single()

    if (endingError || !ending) {
      return NextResponse.json({ error: 'Ending not found' }, { status: 404 })
    }

    // 4) Players
    const { data: players, error: playersError } = await supabase
      .from('fourge_players')
      .select('slot, display_name, role_code, photo_path')
      .eq('crew_id', crew.id)
      .order('slot', { ascending: true })

    if (playersError || !players || players.length < 4) {
      return NextResponse.json({ error: 'Crew is incomplete' }, { status: 400 })
    }

    const names = players.map((p) => p.display_name || `Player ${p.slot}`)
    const roles = players.map((p) => p.role_code || 'unknown')

    // 5) Reuse existing if already generated
    const presetVersion = 'ai-scene-v1'

    const { data: existingRow } = await supabase
      .from('fourge_generated_cards')
      .select('id, status, output_path')
      .eq('attempt_id', attempt.id)
      .eq('preset_version', presetVersion)
      .maybeSingle()

    if (existingRow?.status === 'ready' && existingRow.output_path) {
      const { data: signed } = await supabase.storage
        .from('fourge-generated-scenes')
        .createSignedUrl(existingRow.output_path, 60 * 60)

      return NextResponse.json({
        ok: true,
        cached: true,
        sceneUrl: signed?.signedUrl ?? null,
        ending,
      })
    }

    // 6) Mark generating
    if (existingRow?.id) {
      await supabase
        .from('fourge_generated_cards')
        .update({
          status: 'generating',
          started_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', existingRow.id)
    } else {
      await supabase
        .from('fourge_generated_cards')
        .insert({
          crew_id: crew.id,
          attempt_id: attempt.id,
          status: 'generating',
          preset_version: presetVersion,
          started_at: new Date().toISOString(),
        })
    }

    // 7) Build prompt
    const prompt = buildWildcardScenePrompt({
      endingCode: ending.code,
      endingName: ending.name_en,
      rarity: ending.rarity,
      names,
      roles,
    })

    // 8) Generate image
    const imageBuffer = await generateWildcardSceneImage(prompt)

    // 9) Upload to storage
    const path = `${crew.id}/${attempt.id}/scene-v1.png`

    const { error: uploadError } = await supabase.storage
      .from('fourge-generated-scenes')
      .upload(path, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      throw uploadError
    }

    // 10) Save DB
    const { data: readyRow } = await supabase
      .from('fourge_generated_cards')
      .update({
        status: 'ready',
        output_path: path,
        completed_at: new Date().toISOString(),
      })
      .eq('attempt_id', attempt.id)
      .eq('preset_version', presetVersion)
      .select('id')
      .single()

    const { data: signed } = await supabase.storage
      .from('fourge-generated-scenes')
      .createSignedUrl(path, 60 * 60)

    return NextResponse.json({
      ok: true,
      cached: false,
      sceneUrl: signed?.signedUrl ?? null,
      ending,
      rowId: readyRow?.id ?? null,
    })
  } catch (error: any) {
    console.error('generate-scene error', error)

    return NextResponse.json(
      {
        error: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
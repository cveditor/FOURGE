import { getSupabaseAdmin } from '@/lib/supabase-admin'

const ROLE_ORDER = ['architect', 'driver', 'diplomat', 'maverick'] as const

export async function finalizeAttemptIfReady(crewId: string) {
  const supabase = getSupabaseAdmin()

  const { data: attempt, error: attemptError } = await supabase
    .from('fourge_attempts')
    .select('id, status')
    .eq('crew_id', crewId)
    .eq('status', 'collecting')
    .maybeSingle()

  if (attemptError || !attempt) return null

  const { data: choices, error: choiceError } = await supabase
    .from('fourge_attempt_choices')
    .select('role_code, option_code')
    .eq('attempt_id', attempt.id)

  if (choiceError || !choices || choices.length < 4) return null

  const byRole = new Map(choices.map((choice) => [choice.role_code, choice.option_code]))
  const combination = ROLE_ORDER.map((role) => byRole.get(role) || '').join('')
  if (combination.length !== 4) return null

  const { data: crew } = await supabase
    .from('fourge_crews')
    .select('drop_id')
    .eq('id', crewId)
    .single()

  if (!crew) return null

  const { data: endingMap } = await supabase
    .from('fourge_ending_map')
    .select('ending_id')
    .eq('drop_id', crew.drop_id)
    .eq('combination', combination)
    .single()

  if (!endingMap) return null

  const now = new Date().toISOString()

  await supabase
    .from('fourge_attempts')
    .update({
      status: 'ready',
      combination,
      ending_id: endingMap.ending_id,
      ready_at: now,
    })
    .eq('id', attempt.id)
    .eq('status', 'collecting')

  await supabase
    .from('fourge_crews')
    .update({ status: 'ready', last_activity_at: now })
    .eq('id', crewId)

  await supabase.from('fourge_crew_discoveries').upsert(
    {
      crew_id: crewId,
      ending_id: endingMap.ending_id,
      first_attempt_id: attempt.id,
      discovered_at: now,
    },
    { onConflict: 'crew_id,ending_id', ignoreDuplicates: true },
  )

  return { combination, endingId: endingMap.ending_id }
}

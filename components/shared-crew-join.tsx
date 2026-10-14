'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SupportedLocale } from '@/lib/locale'
import { ROLE_STORIES } from '@/lib/game-copy'

type Payload = {
  crew: { code: string; status: string; dropTitle: string; expiresAt: string; locale: SupportedLocale }
  players: Array<{ slot: number; display_name: string | null; state: string; role_code: string | null; is_creator: boolean }>
  progress: number
  full: boolean
}

const COPY = {
  'it-IT': {
    invalid: 'Invito Crew non valido', invalidName: 'Scrivi il nome con cui la crew deve riconoscerti.', joinFailure: 'Non è stato possibile entrare nella crew',
    loading: 'APERTURA INVITO…', recruited: <>SEI STATO<br /><em>RECLUTATO.</em></>, mission: 'LA MISSIONE',
    missionStrong: 'Stai entrando in un colpo a quattro persone. Una parte del piano adesso dipende da te.',
    missionBody: 'Ognuno sceglie un ruolo diverso e prende una sola decisione segreta. Le quattro decisioni vengono combinate in uno dei 256 finali possibili. Nessuno vede le scelte degli altri prima del risultato.',
    ruleOne: '1. SCEGLI IL TUO RUOLO', ruleTwo: '2. PRENDI UNA SCELTA SEGRETA', ruleThree: '3. SCOPRITE UN SOLO FINALE INSIEME',
    full: 'CREW COMPLETA', spot: 'POSTO', spots: 'POSTI', freeS: 'LIBERO', freeP: 'LIBERI', yourName: 'IL TUO NOME', placeholder: 'es. Marco', enter: 'ENTRA NELLA CREW', entering: 'ENTRANDO…',
    fullBanner: 'QUESTA CREW È COMPLETA · 4/4', inside: 'CHI È GIÀ DENTRO', joined: 'ENTRATO ✓', player: 'Giocatore', open: 'Posto libero', waiting: 'IN ATTESA',
  },
  'en-US': {
    invalid: 'Invalid Crew invite', invalidName: 'Enter the name your crew should know you by.', joinFailure: 'Could not join the crew',
    loading: 'OPENING INVITE…', recruited: <>YOU HAVE BEEN<br /><em>RECRUITED.</em></>, mission: 'THE MISSION',
    missionStrong: 'You are joining a four-person heist. One part of the plan now depends on you.',
    missionBody: 'Everyone claims a different role and makes one secret decision. The four decisions combine into one of 256 possible outcomes. Nobody sees the others’ choices before the result.',
    ruleOne: '1. CLAIM YOUR ROLE', ruleTwo: '2. MAKE ONE SECRET CHOICE', ruleThree: '3. REVEAL ONE SHARED OUTCOME',
    full: 'CREW FULL', spot: 'SPOT', spots: 'SPOTS', freeS: 'OPEN', freeP: 'OPEN', yourName: 'YOUR NAME', placeholder: 'e.g. Marco', enter: 'ENTER THE CREW', entering: 'ENTERING…',
    fullBanner: 'THIS CREW IS FULL · 4/4', inside: 'WHO IS ALREADY IN', joined: 'JOINED ✓', player: 'Player', open: 'Open spot', waiting: 'WAITING',
  },
} as const

export function SharedCrewJoin({ code, token }: { code: string; token: string }) {
  const router = useRouter()
  const [data, setData] = useState<Payload | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const locale: SupportedLocale = data?.crew.locale === 'it-IT' ? 'it-IT' : 'en-US'
  const t = COPY[locale]
  const roleStories = ROLE_STORIES[locale]

  const load = useCallback(async () => {
    const response = await fetch(`/api/crews/${code}/join?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Invalid Crew invite')
    setData(payload)
  }, [code, token])

  useEffect(() => {
    const remembered = window.localStorage.getItem(`fourge:${code}:playerToken`)
    if (remembered) { router.replace(`/join/${remembered}`); return }
    load().catch((cause) => setError(cause instanceof Error ? cause.message : 'Invalid Crew invite'))
    const timer = window.setInterval(() => load().catch(() => undefined), 3000)
    return () => window.clearInterval(timer)
  }, [code, load, router])

  async function join(event: FormEvent) {
    event.preventDefault(); setError('')
    const cleanName = name.trim()
    if (!cleanName || cleanName.length > 30) { setError(t.invalidName); return }
    setJoining(true)
    try {
      const response = await fetch(`/api/crews/${code}/join?token=${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: cleanName }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || t.joinFailure)
      window.localStorage.setItem(`fourge:${code}:playerToken`, payload.playerToken)
      router.replace(`/join/${payload.playerToken}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.joinFailure); setJoining(false); load().catch(() => undefined)
    }
  }

  if (error && !data) return <div className="room-error">{error}</div>
  if (!data) return <div className="room-loading">OPENING INVITE…</div>

  const remaining = Math.max(0, 4 - data.progress)
  return <div className="join-panel">
    <div className="eyebrow">CREW {data.crew.code} · DROP #01 · THE HEIST</div><h1>{t.recruited}</h1>
    <div className="story-brief invite-story"><small>{t.mission}</small><strong>{t.missionStrong}</strong><p>{t.missionBody}</p></div>
    <div className="invite-rules"><span>{t.ruleOne}</span><span>{t.ruleTwo}</span><span>{t.ruleThree}</span></div>
    <div className="shared-progress"><strong>{data.progress}/4</strong><span>{data.full ? t.full : `${remaining} ${remaining === 1 ? t.spot : t.spots} ${remaining === 1 ? t.freeS : t.freeP}`}</span></div>
    {!data.full ? <form className="join-name-form" onSubmit={join}><label><small>{t.yourName}</small><input autoFocus maxLength={30} autoComplete="name" placeholder={t.placeholder} value={name} onChange={(event) => setName(event.target.value)} /></label>{error ? <div className="form-error">{error}</div> : null}<button className="primary-button" type="submit" disabled={joining}>{joining ? t.entering : t.enter} <span>↗</span></button></form> : <div className="joined-banner">{t.fullBanner}</div>}
    <div className="join-waiting"><div className="form-header"><span>{t.inside}</span><strong>{data.progress} / 4</strong></div>
      {data.players.map((player) => <div className="join-player" key={player.slot}><span>{player.display_name || `${t.player} ${player.slot}`}</span><b>{player.role_code ? roleStories[player.role_code]?.label || player.role_code.toUpperCase() : t.joined}</b></div>)}
      {Array.from({ length: Math.max(0, 4 - data.players.length) }).map((_, index) => <div className="join-player open-slot" key={`open-${index}`}><span>{t.open}</span><b>{t.waiting}</b></div>)}
    </div>
  </div>
}

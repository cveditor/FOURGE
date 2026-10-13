'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { PLAYER_COPY, ROLE_STORIES } from '@/lib/game-copy'
import type { SupportedLocale } from '@/lib/locale'

type Role = { code: string; label: string; taken: boolean; takenBy: string | null; mine: boolean }
type Mission = { question: string; options: Array<{ code: string; label: string; description: string | null }> }
type Payload = {
  me: { slot: number; name: string | null; state: string; role: string | null; photoReady: boolean; choiceLocked: boolean; isCreator: boolean }
  crew: { code: string; status: string; dropTitle: string; locale: SupportedLocale; memberCount: number; readyCount: number; full: boolean; outcomeReady: boolean }
  players: Array<{ slot: number; display_name: string | null; state: string; role_code: string | null; photo_path: string | null; is_creator: boolean }>
  roles: Role[]
  mission: Mission | null
  creatorRoomUrl: string | null
}

export function PlayerEntry({ token }: { token: string }) {
  const [data, setData] = useState<Payload | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [working, setWorking] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [consent, setConsent] = useState(false)

  const locale: SupportedLocale = data?.crew.locale === 'it-IT' ? 'it-IT' : 'en-US'
  const t = PLAYER_COPY[locale]
  const roleStories = ROLE_STORIES[locale]

  const load = useCallback(async () => {
    const response = await fetch(`/api/player/${encodeURIComponent(token)}`, { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Invalid player session')
    setData(payload)
  }, [token])

  useEffect(() => {
    load().catch((cause) => setError(cause instanceof Error ? cause.message : 'Invalid player session'))
    const timer = window.setInterval(() => load().catch(() => undefined), 2500)
    return () => window.clearInterval(timer)
  }, [load])

  useEffect(() => {
    if (!photo) { setPhotoPreview(''); return }
    const url = URL.createObjectURL(photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const roleStory = useMemo(() => data?.me.role ? roleStories[data.me.role] || null : null, [data?.me.role, roleStories])
  const roleLabel = roleStory?.label || data?.me.role || ''

  async function legacyJoin(event: FormEvent) {
    event.preventDefault(); setError('')
    const cleanName = name.trim()
    if (!cleanName) { setError(t.invalidName); return }
    setWorking('join')
    const response = await fetch(`/api/player/${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: cleanName }) })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) setError(payload.error || t.joinFailure)
    await load(); setWorking('')
  }

  async function claimRole(role: string) {
    setError(''); setWorking(role)
    const response = await fetch(`/api/player/${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) setError(payload.error || t.roleFailure)
    await load(); setWorking('')
  }

  async function uploadPhoto(event: FormEvent) {
    event.preventDefault(); setError('')
    if (!photo) { setError(t.photoRequired); return }
    if (!consent) { setError(t.consentRequired); return }
    setWorking('photo')
    const form = new FormData(); form.append('photo', photo); form.append('consent', 'true')
    const response = await fetch(`/api/player/${encodeURIComponent(token)}/photo`, { method: 'POST', body: form })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) setError(payload.error || t.photoFailure)
    await load(); setWorking('')
  }

  async function lockChoice(choice: string) {
    setError(''); setWorking(`choice-${choice}`)
    const response = await fetch(`/api/player/${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ choice }) })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) { setError(payload.error || t.choiceFailure); setWorking(''); return }
    await load(); setWorking('')
    if (data?.me.isCreator && data.creatorRoomUrl) window.location.href = data.creatorRoomUrl
  }

  if (error && !data) return <div className="room-error">{error}</div>
  if (!data) return <div className="room-loading">OPENING SESSION…</div>

  const entered = data.me.state !== 'invited'

  if (!entered) {
    return <div className="join-panel">
      <div className="eyebrow">{t.privateSession} · CREW {data.crew.code}</div>
      <h1>{t.who}</h1><p>{t.intro}</p>
      <form className="join-name-form" onSubmit={legacyJoin}>
        <label><small>{t.yourName}</small><input autoFocus maxLength={30} value={name} onChange={(event) => setName(event.target.value)} /></label>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary-button" type="submit" disabled={working === 'join'}>{working === 'join' ? t.joining : t.join} <span>↗</span></button>
      </form>
    </div>
  }

  if (!data.me.role) {
    return <div className="join-panel role-panel">
      <div className="setup-step">{t.phaseRole}</div><div className="eyebrow">CREW {data.crew.code} · DROP #01 · THE HEIST</div><h1>{t.heistStart}</h1>
      <div className="story-brief general-story"><small>{t.storyPlace}</small><strong>{t.storyStrong}</strong><p>{t.storyBody}</p></div>
      <div className="choice-instruction"><small>{t.nowYou}</small><strong>{t.roleInstruction}</strong><span>{t.roleHint}</span></div>
      {error ? <div className="form-error role-error">{error}</div> : null}
      <div className="role-grid narrative-role-grid">
        {data.roles.map((role) => {
          const disabled = role.taken && !role.mine
          const story = roleStories[role.code]
          return <button className={`role-card narrative-role-card ${disabled ? 'taken' : ''}`} disabled={disabled || Boolean(working)} key={role.code} onClick={() => claimRole(role.code)}>
            <small>{role.taken ? t.taken : t.available}</small><strong>{story?.label || role.label.toUpperCase()}</strong><p>{story?.short}</p>
            <span>{disabled ? `${t.takenBy} ${role.takenBy || t.member}` : working === role.code ? t.locking : t.lock}</span>
          </button>
        })}
      </div>
      <div className="secret-warning">{t.noCompare}</div>
    </div>
  }

  if (!data.me.photoReady) {
    return <div className="join-panel setup-panel">
      <div className="setup-step">{t.phasePhoto}</div><div className="eyebrow">{roleLabel} · {t.identity}</div><h1>{t.photoTitle}</h1><p>{t.photoIntro}</p>
      <form onSubmit={uploadPhoto} className="photo-form">
        <label className={`photo-drop ${photoPreview ? 'has-photo' : ''}`}>
          {photoPreview ? <img src={photoPreview} alt={t.photoAlt} /> : <div><strong>＋</strong><span>{t.choosePhoto}</span><small>{t.photoFormats}</small></div>}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
        </label>
        <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{t.consent}</span></label>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary-button full-button" type="submit" disabled={working === 'photo'}>{working === 'photo' ? t.uploading : t.confirmPhoto} <span>↗</span></button>
      </form>
    </div>
  }

  if (!data.me.choiceLocked && data.mission) {
    return <div className="join-panel choice-panel">
      <div className="setup-step">{t.phaseChoice}</div><div className="eyebrow">{roleLabel} · THE HEIST</div><h1>{roleStory?.headline || t.fallbackMoment}</h1>
      <div className="story-brief role-story"><small>{t.briefing}</small><p>{roleStory?.briefing}</p><strong>{roleStory?.objective}</strong></div>
      <div className="mission-block"><small>{t.situation}</small><p className="mission-question">{data.mission.question}</p><span>{t.choiceHint}</span></div>
      {error ? <div className="form-error">{error}</div> : null}
      <div className="choice-grid narrative-choice-grid">
        {data.mission.options.map((option) => <button key={option.code} className="choice-card narrative-choice-card" disabled={Boolean(working)} onClick={() => lockChoice(option.code)}><b>{option.code}</b><strong>{option.label}</strong><span>{option.description}</span><small>{working === `choice-${option.code}` ? t.locking : t.chooseMove}</small></button>)}
      </div><div className="secret-warning">{t.secret}</div>
    </div>
  }

  return <div className="join-panel ready-panel">
    <div className="setup-step">{t.ready}</div><div className="eyebrow">CREW {data.crew.code} · THE HEIST</div><h1>{t.moveLocked}</h1>
    <div className="ready-identity"><small>{roleLabel}</small><strong>{data.me.name}</strong><span>{t.photoChoiceDone}</span></div>
    <div className="waiting-progress"><strong>{data.crew.readyCount}/4</strong><span>{t.playersReady}</span></div><p className="ready-story-note">{t.readyNote}</p>
    {data.me.isCreator && data.creatorRoomUrl ? <a className="primary-button full-button" href={data.creatorRoomUrl}>{t.enterRoom} <span>↗</span></a> : null}
    <div className="join-waiting role-waiting"><div className="form-header"><span>{t.crewStatus}</span><strong>{data.crew.memberCount}/4 {t.present}</strong></div>
      {data.players.map((player) => <div className="join-player" key={player.slot}><span>{player.display_name || `${t.player} ${player.slot}`}</span><b>{player.state === 'complete' ? t.ready : t.preparing}</b></div>)}
      {Array.from({ length: Math.max(0, 4 - data.crew.memberCount) }).map((_, index) => <div className="join-player open-slot" key={`waiting-${index}`}><span>{t.waitingSpot}</span><b>{t.waiting}</b></div>)}
    </div>
    {data.crew.outcomeReady ? <div className="outcome-ready-wrap"><div className="outcome-ready-banner">{t.outcomeReady}</div><a className="primary-button full-button" href={`/crew/${data.crew.code}/reveal?token=${encodeURIComponent(token)}`}>{t.reveal} <span>↗</span></a></div> : null}
  </div>
}

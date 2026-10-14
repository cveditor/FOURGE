'use client'

import { useCallback, useEffect, useState } from 'react'
import type { SupportedLocale } from '@/lib/locale'
import { ROLE_STORIES } from '@/lib/game-copy'

type Player = { slot: number; display_name: string | null; state: string; role_code: string | null; is_creator: boolean }
type RoomData = {
  crew: { code: string; status: string; dropTitle: string; expiresAt: string; locale: SupportedLocale }
  players: Player[]; progress: number; memberCount: number; readyCount: number; full: boolean; sharedJoinUrl: string; creatorPlayUrl: string
}

const COPY = {
  'it-IT': {
    error: 'Non è stato possibile caricare la crew', loading: 'APERTURA WAITING ROOM…', active: 'ROOM ATTIVA', ready: 'PRONTI', share: 'CONDIVIDI CREW', shared: 'CONDIVISO ✓', copied: 'LINK COPIATO ✓',
    fullClosed: 'CREW COMPLETA · INVITI CHIUSI', open: 'LA TUA CREW È APERTA', fullStrong: 'Tutti e quattro i posti sono occupati.', openStrong: 'Invita tre amici con un solo link.',
    fullBody: 'Il pulsante di condivisione è bloccato. Aspetta che tutti completino la propria parte del colpo.', openBody: 'Mandalo nel vostro gruppo. Ognuno entrerà con nome, ruolo, foto e una scelta segreta.',
    fullButton: 'CREW COMPLETA ✓', copy: 'COPIA LINK', locked: 'BLOCCATO', members: 'MEMBRI', missionReady: 'MISSIONE PRONTA', ending: 'FINALE', blocked: 'BLOCCATO',
    youCreator: 'TU · CREATOR', player: 'GIOCATORE', playerName: 'Player', readyState: '✓ PRONTO', preparing: '◌ IN PREPARAZIONE', roleChoice: 'SCELTA RUOLO', openSpot: 'POSTO LIBERO', waitingFriend: 'In attesa di un amico…', waiting: '○ IN ATTESA',
    outcome: '4 SCELTE SEGRETE BLOCCATE · FINALE PRONTO', reveal: 'RIVELA IL FINALE', secretTitle: 'NESSUNO VEDE LE SCELTE DEGLI ALTRI.', secretBody: 'Il finale si sblocca solo quando tutti e quattro i giocatori sono pronti.',
    shareText: 'Entra nella mia crew FOURGE. 4 amici. 4 scelte segrete. 1 finale.',
    choicesLocked: 'SCELTE BLOCCATE', waitingForCrew: 'LA CREW STA PRENDENDO FORMA', waitingForOne: 'MANCA SOLO UNA MOSSA', allLocked: 'TUTTE LE MOSSE SONO BLOCCATE',
    waitingExplain: 'Ogni giocatore completa la propria scelta in segreto. Quando arriviamo a 4/4, il finale della crew si sblocca per tutti.',
    oneLeftExplain: 'Un solo membro deve ancora bloccare la sua scelta. Subito dopo il finale sarà pronto per tutta la crew.',
    allLockedExplain: 'Il colpo è deciso. Il risultato appartiene a tutta la crew.',
  },
  'en-US': {
    error: 'Could not load crew', loading: 'OPENING WAITING ROOM…', active: 'ROOM ACTIVE', ready: 'READY', share: 'SHARE CREW', shared: 'SHARED ✓', copied: 'LINK COPIED ✓',
    fullClosed: 'CREW FULL · INVITES CLOSED', open: 'YOUR CREW IS OPEN', fullStrong: 'All four spots are taken.', openStrong: 'Invite three friends with one link.',
    fullBody: 'Sharing is now locked. Wait for everyone to complete their part of the heist.', openBody: 'Send it to your group. Each person enters with a name, role, photo and one secret choice.',
    fullButton: 'CREW FULL ✓', copy: 'COPY LINK', locked: 'LOCKED', members: 'MEMBERS', missionReady: 'MISSION READY', ending: 'ENDING', blocked: 'LOCKED',
    youCreator: 'YOU · CREATOR', player: 'PLAYER', playerName: 'Player', readyState: '✓ READY', preparing: '◌ SETTING UP', roleChoice: 'CHOOSE ROLE', openSpot: 'OPEN SPOT', waitingFriend: 'Waiting for a friend…', waiting: '○ WAITING',
    outcome: '4 SECRET CHOICES LOCKED · ENDING READY', reveal: 'REVEAL THE ENDING', secretTitle: 'NOBODY SEES THE OTHERS’ CHOICES.', secretBody: 'The ending unlocks only when all four players are ready.',
    shareText: 'Join my FOURGE crew. 4 friends. 4 secret choices. 1 outcome.',
    choicesLocked: 'CHOICES LOCKED', waitingForCrew: 'THE CREW IS TAKING SHAPE', waitingForOne: 'ONE MOVE LEFT', allLocked: 'ALL MOVES ARE LOCKED',
    waitingExplain: 'Each player completes one secret choice. When the crew reaches 4/4, the ending unlocks for everyone.',
    oneLeftExplain: 'Only one crew member still has to lock their move. Then the ending will be ready for the whole crew.',
    allLockedExplain: 'The heist is decided. The outcome belongs to the whole crew.',
  },
} as const

export function CrewRoom({ code, token }: { code: string; token: string }) {
  const [data, setData] = useState<RoomData | null>(null)
  const [error, setError] = useState('')
  const locale: SupportedLocale = data?.crew.locale === 'it-IT' ? 'it-IT' : 'en-US'
  const t = COPY[locale]
  const roleStories = ROLE_STORIES[locale]
  const [shareState, setShareState] = useState('')

  const load = useCallback(async () => {
    const response = await fetch(`/api/crews/${code}?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Could not load crew')
    setData(payload)
  }, [code, token])

  useEffect(() => {
    load().catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load crew'))
    const timer = window.setInterval(() => load().catch(() => undefined), 2500)
    return () => window.clearInterval(timer)
  }, [load])

  useEffect(() => { if (!shareState && data) setShareState(COPY[data.crew.locale === 'it-IT' ? 'it-IT' : 'en-US'].share) }, [data, shareState])

  useEffect(() => {
    if (!data || data.crew.status !== 'ready') return
    const timer = window.setTimeout(() => {
      window.location.replace(`/crew/${code}/reveal?token=${encodeURIComponent(token)}`)
    }, 900)
    return () => window.clearTimeout(timer)
  }, [data, code, token])

  async function shareCrew() {
    if (!data || data.full) return
    try {
      if (navigator.share) { await navigator.share({ title: `FOURGE · ${data.crew.dropTitle}`, text: t.shareText, url: data.sharedJoinUrl }); setShareState(t.shared) }
      else { await navigator.clipboard.writeText(data.sharedJoinUrl); setShareState(t.copied) }
    } catch { return }
    window.setTimeout(() => setShareState(t.share), 1600)
  }

  async function copyLink() {
    if (!data || data.full) return
    await navigator.clipboard.writeText(data.sharedJoinUrl); setShareState(t.copied); window.setTimeout(() => setShareState(t.share), 1600)
  }

  if (error) return <div className="room-error">{error}</div>
  if (!data) return <div className="room-loading">OPENING CREW ROOM…</div>
  const emptySlots = Math.max(0, 4 - data.players.length)

  return <div className="room-panel">
    <div className="room-topline"><span>CREW / {data.crew.code}</span><span className="pulse-label"><i /> {t.active}</span></div>
    <div className="room-heading"><div><small>DROP #01</small><h1>{data.crew.dropTitle}</h1></div><div className="progress-orb"><strong>{data.readyCount}</strong><span>/4 {t.ready}</span></div></div>
    <div className="progress-track"><span style={{ width: `${(data.readyCount / 4) * 100}%` }} /></div>

    <div className={`room-live-status ${data.readyCount === 4 ? 'is-ready' : data.readyCount === 3 ? 'is-close' : ''}`}>
      <small>{data.readyCount === 4 ? t.allLocked : data.readyCount === 3 ? t.waitingForOne : t.waitingForCrew}</small>
      <strong><b>{data.readyCount}</b><span>/4</span> {t.choicesLocked}</strong>
      <p>{data.readyCount === 4 ? t.allLockedExplain : data.readyCount === 3 ? t.oneLeftExplain : t.waitingExplain}</p>
    </div>

    <div className={`shared-invite-box ${data.full ? 'share-locked' : ''}`}><div><small>{data.full ? t.fullClosed : t.open}</small><strong>{data.full ? t.fullStrong : t.openStrong}</strong><p>{data.full ? t.fullBody : t.openBody}</p></div>
      <div className="share-actions"><button className="primary-button share-main" onClick={shareCrew} disabled={data.full}>{data.full ? t.fullButton : (shareState || t.share)} <span>{data.full ? '■' : '↗'}</span></button><button className="copy-link-button" onClick={copyLink} disabled={data.full}>{data.full ? t.locked : t.copy}</button></div>
    </div>

    <div className="room-status-strip"><div><small>{t.members}</small><strong>{data.memberCount}/4</strong></div><div><small>{t.missionReady}</small><strong>{data.readyCount}/4</strong></div><div><small>{t.ending}</small><strong>{data.crew.status === 'ready' ? 'READY' : t.blocked}</strong></div></div>
    <div className="player-list">
      {data.players.map((player) => { const displayName = player.display_name || `${t.playerName} ${player.slot}`; const complete = player.state === 'complete'; return <div className={`room-player ${complete ? 'joined' : 'setting-up'}`} key={player.slot}><div className="avatar-letter">{displayName.slice(0, 1).toUpperCase()}</div><div className="room-player-name"><small>{player.is_creator ? t.youCreator : `${t.player} 0${player.slot}`}</small><strong>{displayName}</strong></div><div className="player-state">{complete ? t.readyState : t.preparing}</div><div className={`role-pill ${player.role_code ? 'claimed' : ''}`}>{player.role_code ? roleStories[player.role_code]?.label || player.role_code.toUpperCase() : t.roleChoice}</div></div> })}
      {Array.from({ length: emptySlots }).map((_, index) => <div className="room-player open-room-slot" key={`open-${index}`}><div className="avatar-letter">?</div><div className="room-player-name"><small>{t.openSpot}</small><strong>{t.waitingFriend}</strong></div><div className="player-state">{t.waiting}</div><div className="role-pill">—</div></div>)}
    </div>
    {data.crew.status === 'ready' ? <div className="outcome-ready-wrap"><div className="outcome-ready-banner">{t.outcome}</div><a className="primary-button reveal-room-button" href={`/crew/${code}/reveal?token=${encodeURIComponent(token)}`}>{t.reveal} <span>↗</span></a></div> : <div className="room-footer-note"><span>◇</span><p><strong>{t.secretTitle}</strong><br />{t.secretBody}</p></div>}
  </div>
}

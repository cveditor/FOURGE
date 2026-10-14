'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SupportedLocale } from '@/lib/locale'

type RevealData = {
  crew: { code: string; locale: SupportedLocale }
  drop: { sequence: number; title: string }
  ending: {
    code: string
    name: string
    rarity: string
    rarityLabel: string
    description: string
    theoreticalCount: number
    probability: string
    rarerThan: string
    displayOrder: number
    isSecret: boolean
    presetKey: string
  }
  competition: { score: number; routeBeatPercent: string; theoreticalTopPercent: string }
  collection: { discovered: number; total: number }
  aiCard: { status: string; masterUrl: string | null; storyUrl: string | null }
  players: Array<{ slot: number; name: string; role: string; roleLabel: string; photoUrl: string | null }>
}

const COPY = {
  'it-IT': {
    loading: 'CALCOLO DEL FINALE...',
    outcomeEyebrow: 'IL FINALE DELLA VOSTRA CREW',
    outcomeIntro: 'Le quattro scelte segrete sono state combinate. Questo è ciò che è successo al vostro colpo.',
    chanceLabel: 'SOLO', chanceSuffix: 'DI POSSIBILITA', chanceExplain: 'delle 256 combinazioni possibili porta a questo finale.',
    sharedResult: 'Questo risultato appartiene a tutti e quattro i membri della crew.',
    creating: 'STIAMO CREANDO LA VOSTRA WILD CARD...', creatingBody: 'Una sola Wild Card viene generata per tutta la crew. Appena è pronta comparirà qui per tutti.',
    failed: 'La Wild Card AI non è stata generata.', retry: 'RIPROVA',
    share: 'CONDIVIDI NELLE STORIE', save: 'SALVA WILD CARD', regenerate: 'RIGENERA IMMAGINE', challenge: 'SFIDA UN’ALTRA CREW',
    shareFallback: 'Il browser non supporta la condivisione diretta del file: la Story è stata scaricata.',
    cardLabel: 'LA VOSTRA WILD CARD', collection: 'ENDING SBLOCCATI',
    chanceNote: 'Percentuale teorica calcolata sulle 256 combinazioni possibili.',
  },
  'en-US': {
    loading: 'CALCULATING ENDING...',
    outcomeEyebrow: 'YOUR CREW\'S OUTCOME',
    outcomeIntro: 'The four secret choices have been combined. This is what happened to your heist.',
    chanceLabel: 'ONLY', chanceSuffix: 'CHANCE', chanceExplain: 'of the 256 possible combinations leads to this outcome.',
    sharedResult: 'This outcome belongs to all four members of the crew.',
    creating: 'FORGING YOUR WILD CARD...', creatingBody: 'Only one Wild Card is generated for the whole crew. As soon as it is ready, everyone sees the same result here.',
    failed: 'The AI Wild Card could not be generated.', retry: 'TRY AGAIN',
    share: 'SHARE TO STORIES', save: 'SAVE WILD CARD', regenerate: 'REGENERATE IMAGE', challenge: 'CHALLENGE ANOTHER CREW',
    shareFallback: 'Direct file sharing is not supported by this browser, so the Story image was downloaded instead.',
    cardLabel: 'YOUR WILD CARD', collection: 'ENDINGS UNLOCKED',
    chanceNote: 'Theoretical chance based on all 256 possible combinations.',
  },
} as const

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'ending'
}

export function RevealExperience({ code, token }: { code: string; token: string }) {
  const [data, setData] = useState<RevealData | null>(null)
  const [error, setError] = useState('')
  const [masterUrl, setMasterUrl] = useState('')
  const [storyUrl, setStoryUrl] = useState('')
  const [aiWorking, setAiWorking] = useState(false)
  const [aiError, setAiError] = useState('')
  const [notice, setNotice] = useState('')
  const autoStarted = useRef(false)

  const locale: SupportedLocale = data?.crew.locale === 'it-IT' ? 'it-IT' : 'en-US'
  const t = COPY[locale]

  const load = useCallback(async () => {
    const response = await fetch(`/api/crews/${code}/reveal?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Reveal unavailable')
    setData(payload)
    if (payload.aiCard?.masterUrl) setMasterUrl(payload.aiCard.masterUrl)
    if (payload.aiCard?.storyUrl) setStoryUrl(payload.aiCard.storyUrl)
    if (payload.aiCard?.status === 'ready') setAiWorking(false)
    if (payload.aiCard?.status === 'generating') setAiWorking(true)
    return payload as RevealData
  }, [code, token])

  useEffect(() => {
    load().catch((cause) => setError(cause instanceof Error ? cause.message : 'Reveal unavailable'))
  }, [load])

  const dropIndex = useMemo(() => String(data?.drop.sequence || 1).padStart(2, '0'), [data])

  const generateAiCard = useCallback(async (regenerate = false) => {
    setAiError('')
    setNotice('')
    setAiWorking(true)
    try {
      const response = await fetch(`/api/crews/${code}/wildcard-scene?token=${encodeURIComponent(token)}${regenerate ? '&regenerate=1' : ''}`, { method: 'POST' })
      const payload = await response.json().catch(() => ({}))

      if (response.status === 202 || payload.status === 'generating') {
        setAiWorking(true)
        return
      }
      if (!response.ok) throw new Error(payload.error || 'Could not generate AI Wild Card.')
      if (!payload.masterUrl) {
        setAiWorking(true)
        return
      }
      setMasterUrl(payload.masterUrl)
      setStoryUrl(payload.storyUrl || payload.masterUrl)
      setAiWorking(false)
      await load()
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : 'Could not generate AI Wild Card.')
      setAiWorking(false)
    }
  }, [code, token, load])

  useEffect(() => {
    if (!data || masterUrl || autoStarted.current) return
    if (data.aiCard.status === 'generating') {
      setAiWorking(true)
      return
    }
    autoStarted.current = true
    generateAiCard(false)
  }, [data, masterUrl, generateAiCard])

  useEffect(() => {
    if (!data || masterUrl || !(aiWorking || data.aiCard.status === 'generating')) return
    const timer = window.setInterval(() => {
      load().catch(() => undefined)
    }, 2500)
    return () => window.clearInterval(timer)
  }, [data, masterUrl, aiWorking, load])

  async function getImageFile(url: string, suffix: string) {
    if (!url || !data) throw new Error('Wild Card unavailable')
    const response = await fetch(url)
    if (!response.ok) throw new Error('Could not load Wild Card file')
    const blob = await response.blob()
    return new File([blob], `fourge-${safeFileName(data.ending.name)}-${suffix}.png`, { type: blob.type || 'image/png' })
  }

  async function downloadUrl(url: string, suffix: string) {
    const file = await getImageFile(url, suffix)
    const objectUrl = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = file.name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1200)
  }

  async function downloadCard() {
    try { await downloadUrl(masterUrl, 'wild-card') }
    catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Could not save Wild Card.') }
  }

  async function shareCard() {
    if (!data) return
    setNotice('')
    try {
      const shareUrl = storyUrl || masterUrl
      const file = await getImageFile(shareUrl, 'story')
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `FOURGE - ${data.ending.name}` })
        return
      }
      await downloadUrl(shareUrl, 'story')
      setNotice(t.shareFallback)
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      setNotice(cause instanceof Error ? cause.message : 'Could not share Wild Card.')
    }
  }

  async function challengeCrew() {
    if (!data) return
    const text = locale === 'it-IT'
      ? `La mia crew ha ottenuto ${data.ending.name} su FOURGE - THE HEIST. Solo ${data.ending.probability} di possibilita. Riuscite a fare meglio?`
      : `My crew forged ${data.ending.name} on FOURGE - THE HEIST. Only ${data.ending.probability} chance. Can your crew beat it?`
    const url = `${window.location.origin}/create`
    try {
      if (navigator.share) await navigator.share({ title: 'FOURGE - CHALLENGE', text, url })
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`)
        setNotice(locale === 'it-IT' ? 'LINK SFIDA COPIATO' : 'CHALLENGE LINK COPIED')
      }
    } catch { /* user cancelled */ }
  }

  if (error) return <div className="room-error reveal-error">{error}</div>
  if (!data) return <div className="reveal-loading"><span>FOURGE.</span><strong>{t.loading}</strong></div>

  return <section className="reveal-stage reveal-stage-final reveal-stage-prelaunch">
    <div className="result-mark" aria-label="FOURGE"><span>FOURGE</span><b>.</b></div>

    <section className="outcome-hero">
      <div className="eyebrow">CREW {data.crew.code} - DROP #{dropIndex}</div>
      <small>{t.outcomeEyebrow}</small>
      <h1>{data.ending.name}</h1>
      <div className={`ending-rarity-line rarity-${data.ending.rarity}`}><i />{data.ending.rarityLabel} ENDING</div>
      <p className="outcome-intro">{t.outcomeIntro}</p>
      <p className="outcome-story">{data.ending.description}</p>

      <div className={`chance-hero rarity-${data.ending.rarity}`}>
        <span>{t.chanceLabel}</span>
        <strong>{data.ending.probability}</strong>
        <b>{t.chanceSuffix}</b>
        <small>{t.chanceExplain}</small>
      </div>
      <p className="shared-outcome-note">{t.sharedResult}</p>
    </section>

    <div className="result-overline"><span>{t.cardLabel}</span><i /><span>DROP #{dropIndex}</span></div>

    <div className={`story-card-shell master-card-shell rarity-${data.ending.rarity}`}>
      {masterUrl ? (
        <img className="story-card-image" src={masterUrl} alt={`FOURGE ${data.ending.name} Wild Card`} />
      ) : (
        <div className="story-card-generating">
          <div className="forge-orbit"><span /><i /><b /></div>
          <strong>{aiWorking ? t.creating : t.failed}</strong>
          <p>{aiWorking ? t.creatingBody : aiError}</p>
          {!aiWorking ? <button className="secondary-button" onClick={() => { autoStarted.current = true; generateAiCard(false) }}>{t.retry}</button> : null}
        </div>
      )}
    </div>

    {masterUrl ? <div className="story-actions master-story-actions">
      <button className="primary-button story-share" onClick={shareCard}>{t.share}<span>↗</span></button>
      <button className="secondary-button" onClick={downloadCard}>{t.save}</button>
    </div> : null}
    {notice ? <div className="share-notice">{notice}</div> : null}

    <section className="result-details result-details-v0 result-details-simple">
      <div className="result-details-head">
        <div><small>{t.collection}</small><strong>{data.collection.discovered}/{data.collection.total}</strong></div>
      </div>

      <div className="crew-signature">
        {data.players.map((player) => <span key={player.slot}><b>{player.name}</b><small>{player.roleLabel.replace('THE ', '')}</small></span>)}
      </div>
      <p className="route-note">{t.chanceNote}</p>
    </section>

    <div className="post-reveal-actions">
      <button className="secondary-button" disabled={aiWorking} onClick={() => { autoStarted.current = true; generateAiCard(true) }}>{aiWorking ? t.creating : t.regenerate}</button>
      <button className="secondary-button" onClick={challengeCrew}>{t.challenge}</button>
    </div>
  </section>
}

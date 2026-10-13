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
    loading: 'CALCOLO DEL FINALE…', kicker: '4 MOSSE SEGRETE · 1 SOLO FINALE',
    title: <>IL COLPO<br /><em>È FINITO.</em></>,
    intro: 'Le quattro decisioni sono state combinate. Il finale è pronto e nessuna scelta individuale verrà mostrata.',
    reveal: 'RIVELA IL FINALE', hidden: 'IL RISULTATO DIVENTA UNA WILD CARD AI DA CONDIVIDERE',
    creating: 'STIAMO CREANDO LA VOSTRA WILD CARD…', creatingBody: 'FOURGE sta trasformando le quattro foto e il vostro finale in un poster cinematografico.',
    failed: 'La Wild Card AI non è stata generata.', retry: 'RIPROVA',
    score: 'FOURGE SCORE', rarer: 'PIÙ RARA DEL', routes: 'ROUTE CHE PORTANO QUI', outcome: 'ESITO DEL COLPO',
    share: 'CONDIVIDI NELLE STORIE', save: 'SALVA WILD CARD', regenerate: 'RIGENERA IMMAGINE', challenge: 'SFIDA UN’ALTRA CREW',
    shareFallback: 'Il browser non supporta la condivisione diretta del file: la Story è stata scaricata.',
    cardLabel: 'LA VOSTRA WILD CARD', collection: 'ENDING SBLOCCATI', routeNote: 'Statistiche calcolate sulle 256 combinazioni possibili. Nessun ranking live.',
  },
  'en-US': {
    loading: 'CALCULATING ENDING…', kicker: '4 SECRET MOVES · 1 OUTCOME',
    title: <>THE HEIST<br /><em>IS OVER.</em></>,
    intro: 'The four decisions have been combined. Your ending is ready and no individual choice will be revealed.',
    reveal: 'REVEAL THE ENDING', hidden: 'YOUR RESULT BECOMES A SHAREABLE AI WILD CARD',
    creating: 'FORGING YOUR WILD CARD…', creatingBody: 'FOURGE is turning the four crew photos and your ending into one cinematic poster.',
    failed: 'The AI Wild Card could not be generated.', retry: 'TRY AGAIN',
    score: 'FOURGE SCORE', rarer: 'RARER THAN', routes: 'ROUTES LEADING HERE', outcome: 'HEIST OUTCOME',
    share: 'SHARE TO STORIES', save: 'SAVE WILD CARD', regenerate: 'REGENERATE IMAGE', challenge: 'CHALLENGE ANOTHER CREW',
    shareFallback: 'Direct file sharing is not supported by this browser, so the Story image was downloaded instead.',
    cardLabel: 'YOUR WILD CARD', collection: 'ENDINGS UNLOCKED', routeNote: 'Stats are calculated against all 256 possible routes. No live ranking.',
  },
} as const

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'ending'
}

export function RevealExperience({ code, token }: { code: string; token: string }) {
  const [data, setData] = useState<RevealData | null>(null)
  const [error, setError] = useState('')
  const [revealed, setRevealed] = useState(false)
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
      if (!response.ok) throw new Error(payload.error || 'Could not generate AI Wild Card.')
      if (!payload.masterUrl) throw new Error('The AI Wild Card was generated but no image URL was returned.')
      setMasterUrl(payload.masterUrl)
      setStoryUrl(payload.storyUrl || payload.masterUrl)
      await load()
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : 'Could not generate AI Wild Card.')
    } finally {
      setAiWorking(false)
    }
  }, [code, token, load])

  useEffect(() => {
    if (!revealed || !data || masterUrl || aiWorking || autoStarted.current) return
    autoStarted.current = true
    generateAiCard(false)
  }, [revealed, data, masterUrl, aiWorking, generateAiCard])

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
    try {
      await downloadUrl(masterUrl, 'wild-card')
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Could not save Wild Card.')
    }
  }

  async function shareCard() {
    if (!data) return
    setNotice('')
    try {
      const shareUrl = storyUrl || masterUrl
      const file = await getImageFile(shareUrl, 'story')
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `FOURGE · ${data.ending.name}` })
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
      ? `La mia crew ha ottenuto ${data.ending.name} su FOURGE · THE HEIST. Riuscite a trovare una route più rara?`
      : `My crew forged ${data.ending.name} on FOURGE · THE HEIST. Can your crew find a rarer route?`
    const url = `${window.location.origin}/create`
    try {
      if (navigator.share) await navigator.share({ title: 'FOURGE · CHALLENGE', text, url })
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`)
        setNotice(locale === 'it-IT' ? 'LINK SFIDA COPIATO ✓' : 'CHALLENGE LINK COPIED ✓')
      }
    } catch { /* user cancelled */ }
  }

  if (error) return <div className="room-error reveal-error">{error}</div>
  if (!data) return <div className="reveal-loading"><span>FOURGE.</span><strong>{t.loading}</strong></div>

  if (!revealed) {
    return <section className="reveal-gate reveal-gate-final">
      <div className="eyebrow">CREW {data.crew.code} · DROP #{dropIndex}</div>
      <span className="reveal-kicker">{t.kicker}</span>
      <h1>{t.title}</h1>
      <p>{t.intro}</p>
      <button className="primary-button reveal-now" onClick={() => setRevealed(true)}>{t.reveal}<span>↗</span></button>
      <small>{t.hidden}</small>
    </section>
  }

  return <section className="reveal-stage reveal-stage-final">
    <div className="result-mark" aria-label="FOURGE"><span>FOURGE</span><b>.</b></div>
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

    <section className="result-details result-details-v0">
      <div className="result-details-head">
        <div><small>{t.collection}</small><strong>{data.collection.discovered}/{data.collection.total}</strong></div>
        <div className={`rarity-pill rarity-${data.ending.rarity}`}><i />{data.ending.rarityLabel} · {data.ending.probability}</div>
      </div>

      <div className="result-metrics result-metrics-v0">
        <article><small>{t.score}</small><strong>{data.competition.score.toLocaleString('en-US')}</strong></article>
        <article><small>{t.rarer}</small><strong>{data.ending.rarerThan}</strong></article>
        <article><small>{t.routes}</small><strong>{data.ending.theoreticalCount}<span>/256</span></strong></article>
      </div>

      <div className="outcome-copy">
        <small>{t.outcome}</small>
        <h2>{data.ending.name}</h2>
        <p>{data.ending.description}</p>
      </div>

      <div className="crew-signature">
        {data.players.map((player) => <span key={player.slot}><b>{player.name}</b><small>{player.roleLabel.replace('THE ', '')}</small></span>)}
      </div>
      <p className="route-note">{t.routeNote}</p>
    </section>

    <div className="post-reveal-actions">
      <button className="secondary-button" disabled={aiWorking} onClick={() => generateAiCard(true)}>{aiWorking ? t.creating : t.regenerate}</button>
      <button className="secondary-button" onClick={challengeCrew}>{t.challenge}</button>
    </div>
  </section>
}

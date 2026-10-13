'use client'
import { FormEvent, Fragment, useState } from 'react'
import type { SupportedLocale } from '@/lib/locale'

const COPY = {
  'it-IT': { phase:'FASE 01', start:'SI PARTE DA TE', choose:'LINGUA DELLA CREW', chooseHint:'Tutti gli invitati vedranno questa missione nella lingua scelta.', name:'IL TUO NOME', placeholder:'es. Alex', flow:['NOME','RUOLO','FOTO','SCELTA SEGRETA'], invalid:'Scrivi il tuo nome prima di creare la crew.', failure:'Non è stato possibile creare la crew', loading:'APERTURA MISSIONE…', submit:'CREA LA TUA CREW', note:'Completi prima la tua parte. Solo dopo si apre il link da condividere con gli altri tre giocatori.' },
  'en-US': { phase:'STEP 01', start:'YOU GO FIRST', choose:'CREW LANGUAGE', chooseHint:'Every invited player will see this mission in the language you choose.', name:'YOUR NAME', placeholder:'e.g. Alex', flow:['NAME','ROLE','PHOTO','SECRET CHOICE'], invalid:'Enter your name before creating the crew.', failure:'Could not create the crew', loading:'OPENING MISSION…', submit:'CREATE YOUR CREW', note:'Complete your own setup first. Only then does the Crew link open for the other three players.' },
} as const

export function CreateCrewForm() {
  const [locale,setLocale]=useState<SupportedLocale>('en-US')
  const [creatorName,setCreatorName]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const t=COPY[locale]
  async function submit(event:FormEvent){event.preventDefault();setError('');const cleanName=creatorName.trim();if(!cleanName||cleanName.length>30){setError(t.invalid);return}setLoading(true);try{const response=await fetch('/api/crews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({creatorName:cleanName,locale})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||t.failure);window.location.href=payload.creatorPlayUrl}catch(cause){setError(cause instanceof Error?cause.message:t.failure);setLoading(false)}}
  return <form className="create-form" onSubmit={submit}>
    <div className="form-header"><span>{t.phase}</span><strong>{t.start}</strong></div>
    <div className="crew-language-picker"><small>{t.choose}</small><div className="crew-language-buttons"><button type="button" className={locale==='en-US'?'active':''} onClick={()=>setLocale('en-US')}>ENGLISH</button><button type="button" className={locale==='it-IT'?'active':''} onClick={()=>setLocale('it-IT')}>ITALIANO</button></div><p>{t.chooseHint}</p></div>
    <label className="player-input creator-only"><span className="slot-number">01</span><div><small>{t.name}</small><input maxLength={30} autoComplete="name" placeholder={t.placeholder} value={creatorName} onChange={(e)=>setCreatorName(e.target.value)} autoFocus /></div><span className="input-mark">→</span></label>
    <div className="creator-flow-preview">{t.flow.map((step,index)=><Fragment key={step}><div><b>0{index+1}</b><span>{step}</span></div>{index<t.flow.length-1?<i>→</i>:null}</Fragment>)}</div>
    {error?<div className="form-error">{error}</div>:null}<button className="primary-button submit-button" disabled={loading} type="submit">{loading?t.loading:t.submit} <span>↗</span></button><p className="privacy-note">{t.note}</p>
  </form>
}

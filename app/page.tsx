import Link from 'next/link'

const rarities = [
  ['COMMON', 'steel'], ['RARE', 'blue'], ['EPIC', 'purple'], ['LEGENDARY', 'gold'], ['SECRET', 'secret'],
]

const t = {
  eyebrow: 'WEEKLY CREW GAME · DROP #01',
  hero: <>4 FRIENDS.<br />4 SECRET CHOICES.<br /><em>1 OUTCOME.</em></>,
  heroCopy: 'Build a crew. Claim your roles. Make your choices in secret. When the fourth player locks in, FOURGE forges your crew into a cinematic AI Wild Card — built to share.',
  create: 'CREATE YOUR CREW', howLink: 'HOW IT WORKS ↓', active: 'ACTIVE DROP', firstMission: 'YOUR FIRST MISSION',
  ticker: ['NO ACCOUNT', '4 PLAYERS', 'SECRET CHOICES', 'AI WILD CARD', 'COLLECT ENDINGS'],
  how: 'HOW FOURGE WORKS',
  steps: [
    ['Set yourself up', 'Name, role, photo and one secret choice. The creator goes first.'],
    ['Open the crew', 'Enter the Waiting Room and share one link with three friends.'],
    ['Everyone locks in', 'Each friend completes their own private setup. Roles are first come, first served.'],
    ['Reveal the Wild Card', 'At 4/4, your outcome becomes a cinematic 4:5 AI Wild Card. FOURGE also prepares a complete 9:16 Story version automatically.'],
  ],
  endingSystem: 'ENDING SYSTEM', endingTitle: <>NOT EVERY CREW<br />GETS THE SAME STORY.</>,
  secretEnding: 'SECRET ENDING', secretCopy: "One exact route. One combination in 256. We won't tell you which.", hunt: 'START THE HUNT',
  footer: 'NEW DROP. SAME WORLD. DIFFERENT OUTCOME.',
  finalCta: <>YOUR CREW.<br />YOUR CHOICES.<br /><em>YOUR ENDING.</em></>,
  dropFoot: ['16 ENDINGS', '256 ROUTES', '1 SECRET'],
}

export default function HomePage() {
  const createHref = '/create'
  return <main>
    <header className="site-header shell"><Link className="brand" href="/">FOURGE<span>.</span></Link><div className="header-tools"><div className="header-meta"><span className="live-dot" /> DROP 01 LIVE</div></div></header>
    <section className="hero shell">
      <div className="eyebrow">{t.eyebrow}</div><h1>{t.hero}</h1><p className="hero-copy">{t.heroCopy}</p>
      <div className="hero-actions"><Link href={createHref} className="primary-button">{t.create} <span>↗</span></Link><a href="#how" className="text-link">{t.howLink}</a></div>
      <div className="drop-stage"><div className="drop-halo" /><div className="drop-card"><div className="drop-card-top"><span>FOURGE / 001</span><span>{t.active}</span></div><div className="drop-number">01</div><div className="drop-kicker">{t.firstMission}</div><div className="drop-title">THE<br />HEIST</div><div className="drop-divider" /><div className="drop-foot">{t.dropFoot.map((item)=><span key={item}>{item}</span>)}</div></div></div>
    </section>
    <section className="ticker" aria-label="Game features">{t.ticker.map((item,index)=><div className="ticker-piece" key={item}>{index>0?<b>◆</b>:null}<div>{item}</div></div>)}</section>
    <section id="how" className="how shell"><div className="section-label">{t.how}</div><div className="steps-grid">{t.steps.map(([title,body],index)=><article key={title}><b>0{index+1}</b><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className="rarity-section shell"><div><div className="section-label">{t.endingSystem}</div><h2>{t.endingTitle}</h2></div><div className="rarity-list">{rarities.map(([label,tone])=><div className={`rarity-row ${tone}`} key={label}><span className="rarity-gem"/><strong>{label}</strong><span className="rarity-line"/>{label==='SECRET'?<small>?</small>:null}</div>)}</div></section>
    <section className="secret-section shell"><div className="secret-card"><div className="secret-lock">◇</div><div><div className="eyebrow">{t.secretEnding}</div><h2>THE 0.39</h2><p>{t.secretCopy}</p></div><Link href={createHref} className="outline-button">{t.hunt}</Link></div></section>
    <section className="final-cta shell"><div className="eyebrow">DROP #01 · THE HEIST</div><h2>{t.finalCta}</h2><Link href={createHref} className="primary-button">{t.create} <span>↗</span></Link></section>
    <footer className="footer shell"><Link className="brand" href="/">FOURGE<span>.</span></Link><span>{t.footer}</span><span>© 2026</span></footer>
  </main>
}

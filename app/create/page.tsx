import Link from 'next/link'
import { CreateCrewForm } from '@/components/create-crew-form'

export default function CreatePage() {
  return <main className="create-page">
    <header className="site-header shell"><Link className="brand" href="/">FOURGE<span>.</span></Link><div className="header-tools"><Link className="back-link" href="/">← BACK TO DROP</Link></div></header>
    <section className="create-shell shell">
      <div className="create-copy"><div className="eyebrow">DROP #01 · THE HEIST</div><h1>FORGE<br />YOUR <em>IDENTITY.</em></h1><p>Choose the language for this Crew, then enter your name. From that point on, every player in the Crew will see the mission in the same language.</p><div className="mini-rule"><span>01</span><p>Choose English or Italian for the Crew.</p></div><div className="mini-rule"><span>02</span><p>Complete role, photo and secret choice.</p></div><div className="mini-rule"><span>03</span><p>Open one shared link for the other three players.</p></div></div>
      <CreateCrewForm />
    </section>
  </main>
}

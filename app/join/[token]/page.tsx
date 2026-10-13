import Link from 'next/link'
import { PlayerEntry } from '@/components/player-entry'

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <main className="join-page">
      <header className="site-header shell">
        <Link className="brand" href="/">FOURGE<span>.</span></Link>
        <span className="header-meta">THE HEIST</span>
      </header>
      <section className="join-shell shell"><PlayerEntry token={token} /></section>
    </main>
  )
}

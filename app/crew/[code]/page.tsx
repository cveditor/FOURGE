import Link from 'next/link'
import { CrewRoom } from '@/components/crew-room'

export default async function CrewPage({ params, searchParams }: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { code } = await params
  const { token = '' } = await searchParams

  return (
    <main className="room-page">
      <header className="site-header shell">
        <Link className="brand" href="/">FOURGE<span>.</span></Link>
        <span className="header-meta">THE HEIST</span>
      </header>
      <section className="room-shell shell"><CrewRoom code={code} token={token} /></section>
    </main>
  )
}

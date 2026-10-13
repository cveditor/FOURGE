import Link from 'next/link'
import { SharedCrewJoin } from '@/components/shared-crew-join'

export default async function SharedJoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { code } = await params
  const { token = '' } = await searchParams

  return (
    <main className="join-page">
      <header className="site-header shell">
        <Link className="brand" href="/">FOURGE<span>.</span></Link>
        <span className="header-meta">THE HEIST</span>
      </header>
      <section className="join-shell shell">
        <SharedCrewJoin code={code} token={token} />
      </section>
    </main>
  )
}

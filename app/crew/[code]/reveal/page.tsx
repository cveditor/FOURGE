import { RevealExperience } from '@/components/reveal-experience'

export default async function RevealPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { code } = await params
  const { token = '' } = await searchParams
  return (
    <main className="reveal-page">
      <RevealExperience code={code} token={token} />
    </main>
  )
}

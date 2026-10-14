import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FOURGE — 4 friends. 4 secret choices. 1 outcome.',
  description: 'A weekly social game built for crews. Drop #01: The Heist.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  )
}

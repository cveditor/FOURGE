import Link from 'next/link'

export function LanguageSwitch({ lang, basePath = '/' }: { lang: 'it' | 'en'; basePath?: string }) {
  return (
    <nav className="language-switch" aria-label="Language">
      <Link className={lang === 'it' ? 'active' : ''} href={`${basePath}?lang=it`}>IT</Link>
      <span>/</span>
      <Link className={lang === 'en' ? 'active' : ''} href={`${basePath}?lang=en`}>EN</Link>
    </nav>
  )
}

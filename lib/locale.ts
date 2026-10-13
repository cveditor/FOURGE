export type SupportedLocale = 'it-IT' | 'en-US'

export function localeFromLang(value?: string | null): SupportedLocale {
  return value?.toLowerCase() === 'it' || value === 'it-IT' ? 'it-IT' : 'en-US'
}

export function langFromLocale(locale?: string | null): 'it' | 'en' {
  return locale === 'it-IT' ? 'it' : 'en'
}

export function isItalian(locale?: string | null) {
  return locale === 'it-IT'
}

export function localeFromAcceptLanguage(value?: string | null): SupportedLocale {
  const first = (value || '').toLowerCase()
  return first.includes('it') ? 'it-IT' : 'en-US'
}

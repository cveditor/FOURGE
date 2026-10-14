export function getSiteUrl() {
  let url = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim()
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`
  return url.replace(/\/+$/, '')
}

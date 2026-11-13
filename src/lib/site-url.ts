const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i

export function resolveSiteUrl(configured: string, host: string | null, proto: string | null): string {
  const base = configured.replace(/\/+$/, '')
  if (!LOCAL.test(base) || !host || !/^[a-z0-9.\-:[\]]+$/i.test(host)) return base
  const scheme = proto === 'https' || proto === 'http' ? proto : 'http'
  return `${scheme}://${host}`
}

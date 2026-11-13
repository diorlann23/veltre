import type { MetadataRoute } from 'next'
import { siteUrl } from '@/server/env'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/checkout', '/cart', '/api/', '/login', '/register'] }],
    sitemap: `${await siteUrl()}/sitemap.xml`,
  }
}

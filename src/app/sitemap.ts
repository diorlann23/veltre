import type { MetadataRoute } from 'next'
import { collections } from '@/server/db'
import { siteUrl } from '@/server/env'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl()
  const { products, categories } = await collections()
  const [productDocs, categoryDocs] = await Promise.all([
    products.find({ status: 'active' }, { projection: { slug: 1, updatedAt: 1 } }).toArray(),
    categories.find({}, { projection: { slug: 1, updatedAt: 1 } }).toArray(),
  ])
  return [
    ...['', '/shop', '/collections', '/about', '/contact'].map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...categoryDocs.map((c) => ({ url: `${base}/shop?category=${c.slug}`, lastModified: c.updatedAt, priority: 0.6 })),
    ...productDocs.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
  ]
}

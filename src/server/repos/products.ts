import 'server-only'
import { ObjectId, type Filter } from 'mongodb'
import type { z } from 'zod'
import { sortSizes, type CatalogQuery } from '@/lib/catalog'
import { escapeRegex, slugify } from '@/lib/slug'
import type { CategoryRef, Product, ProductStatus } from '@/lib/types'
import type { productInputSchema } from '@/lib/validation'
import { collections } from '../db'
import type { ProductDoc } from '../documents'
import { badRequest, conflict, notFound } from '../http'
import { deleteUnreferencedImages, imageUrl } from './images'

type ProductInput = z.infer<typeof productInputSchema>

export const PAGE_SIZE = 24

const hex = (ids: ObjectId[]) => ids.map((i) => i.toHexString())
const urls = (ids: ObjectId[]) => ids.map((i) => imageUrl(i) as string)

export function toProduct(doc: ProductDoc, categories: Map<string, CategoryRef>): Product {
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    name: doc.name,
    description: doc.description,
    details: doc.details,
    fit: doc.fit,
    category: doc.categoryId ? (categories.get(doc.categoryId.toHexString()) ?? null) : null,
    price: doc.price,
    salePrice: doc.salePrice,
    images: urls(doc.imageIds),
    imageIds: hex(doc.imageIds),
    colors: doc.colors.map((c) => ({ name: c.name, hex: c.hex, images: urls(c.imageIds), imageIds: hex(c.imageIds) })),
    sizes: sortSizes(doc.sizes),
    variants: doc.variants,
    featured: doc.featured,
    newArrival: doc.newArrival,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

async function categoryRefs(): Promise<Map<string, CategoryRef>> {
  const { categories } = await collections()
  const docs = await categories.find({}, { projection: { slug: 1, name: 1 } }).toArray()
  return new Map(docs.map((d) => [d._id.toHexString(), { id: d._id.toHexString(), slug: d.slug, name: d.name }]))
}

async function mapProducts(docs: ProductDoc[]): Promise<Product[]> {
  const refs = await categoryRefs()
  return docs.map((d) => toProduct(d, refs))
}

const effectivePrice = {
  $cond: [{ $and: [{ $ne: ['$salePrice', null] }, { $lt: ['$salePrice', '$price'] }] }, '$salePrice', '$price'],
}

export async function searchProducts(q: CatalogQuery) {
  const { products, categories } = await collections()
  const match: Filter<ProductDoc> = { status: 'active' }
  const and: Filter<ProductDoc>[] = []

  if (q.q.trim()) {
    const terms = q.q.trim().split(/\s+/).slice(0, 6)
    for (const term of terms) {
      const rx = new RegExp(escapeRegex(term), 'i')
      const catIds = (await categories.find({ name: rx }, { projection: { _id: 1 } }).toArray()).map((c) => c._id)
      and.push({ $or: [{ name: rx }, { description: rx }, { 'colors.name': rx }, { categoryId: { $in: catIds } }] })
    }
  }
  if (q.categories.length) {
    const ids = (await categories.find({ slug: { $in: q.categories } }, { projection: { _id: 1 } }).toArray()).map((c) => c._id)
    and.push({ categoryId: { $in: ids } })
  }
  if (q.sizes.length) and.push({ variants: { $elemMatch: { size: { $in: q.sizes }, stock: { $gt: 0 } } } })
  if (q.colors.length) and.push({ 'colors.name': { $in: q.colors } })
  if (q.inStock) and.push({ variants: { $elemMatch: { stock: { $gt: 0 } } } })
  if (q.sale) and.push({ salePrice: { $ne: null }, $expr: { $lt: ['$salePrice', '$price'] } })
  if (and.length) match.$and = and

  const priceMatch: Record<string, number> = {}
  if (q.min !== null) priceMatch.$gte = q.min
  if (q.max !== null) priceMatch.$lte = q.max

  const sort: Record<string, 1 | -1> =
    q.sort === 'newest'
      ? { createdAt: -1 }
      : q.sort === 'price-asc'
        ? { effectivePrice: 1, createdAt: -1 }
        : q.sort === 'price-desc'
          ? { effectivePrice: -1, createdAt: -1 }
          : q.sort === 'name-asc'
            ? { name: 1 }
            : { inStock: -1, featured: -1, createdAt: -1 }

  const [result] = await products
    .aggregate<{ items: ProductDoc[]; total: { n: number }[] }>([
      { $match: match },
      { $addFields: { effectivePrice, inStock: { $anyElementTrue: { $map: { input: '$variants', in: { $gt: ['$$this.stock', 0] } } } } } },
      ...(Object.keys(priceMatch).length ? [{ $match: { effectivePrice: priceMatch } }] : []),
      {
        $facet: {
          items: [{ $sort: sort }, { $skip: (q.page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE }, { $project: { effectivePrice: 0, inStock: 0 } }],
          total: [{ $count: 'n' }],
        },
      },
    ])
    .toArray()

  const total = result?.total[0]?.n ?? 0
  return {
    products: await mapProducts(result?.items ?? []),
    total,
    page: q.page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}

export async function catalogFacets() {
  const { products } = await collections()
  const [sizes, colors, prices] = await Promise.all([
    products.distinct('sizes', { status: 'active' }),
    products
      .aggregate<{ _id: string; hex: string }>([
        { $match: { status: 'active' } },
        { $unwind: '$colors' },
        { $group: { _id: '$colors.name', hex: { $first: '$colors.hex' } } },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
    products
      .aggregate<{ min: number; max: number }>([
        { $match: { status: 'active' } },
        { $group: { _id: null, min: { $min: effectivePrice }, max: { $max: effectivePrice } } },
      ])
      .toArray(),
  ])
  return {
    sizes: sortSizes(sizes as string[]),
    colors: colors.map((c) => ({ name: c._id, hex: c.hex })),
    minPrice: prices[0]?.min ?? 0,
    maxPrice: prices[0]?.max ?? 0,
  }
}

export async function homeProducts(limit: number) {
  const { products } = await collections()
  const inStock = { status: 'active' as const, variants: { $elemMatch: { stock: { $gt: 0 } } } }
  const featured = await products.find({ ...inStock, featured: true }).sort({ createdAt: -1 }).limit(limit).toArray()
  const featuredIds = featured.map((f) => f._id)
  const latest = await products
    .find({ ...inStock, _id: { $nin: featuredIds } })
    .sort({ newArrival: -1, createdAt: -1 })
    .limit(limit)
    .toArray()
  return { featured: await mapProducts(featured), newArrivals: await mapProducts(latest) }
}

export async function getProductBySlug(slug: string, { includeHidden = false } = {}): Promise<Product | null> {
  const { products } = await collections()
  const doc = await products.findOne({ slug, ...(includeHidden ? {} : { status: 'active' as const }) })
  if (!doc) return null
  return (await mapProducts([doc]))[0]
}

export async function relatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const { products } = await collections()
  const base = { status: 'active' as const, _id: { $ne: new ObjectId(product.id) }, variants: { $elemMatch: { stock: { $gt: 0 } } } }
  const sameCategory = product.category
    ? await products.find({ ...base, categoryId: new ObjectId(product.category.id) }).limit(limit).toArray()
    : []
  const rest =
    sameCategory.length < limit
      ? await products
          .find({ ...base, _id: { $nin: [new ObjectId(product.id), ...sameCategory.map((p) => p._id)] } })
          .sort({ createdAt: -1 })
          .limit(limit - sameCategory.length)
          .toArray()
      : []
  return mapProducts([...sameCategory, ...rest])
}

export async function getProductDocsByIds(ids: string[]) {
  const { products } = await collections()
  const objectIds = [...new Set(ids)].filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))
  return products.find({ _id: { $in: objectIds } }).toArray()
}

export async function listAdminProducts({ q = '', status = '', page = 1 }: { q?: string; status?: string; page?: number }) {
  const { products } = await collections()
  const filter: Filter<ProductDoc> = {}
  if (q.trim()) filter.name = new RegExp(escapeRegex(q.trim()), 'i')
  if (['active', 'draft', 'archived'].includes(status)) filter.status = status as ProductStatus
  const [docs, total] = await Promise.all([
    products.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * 30).limit(30).toArray(),
    products.countDocuments(filter),
  ])
  return { products: await mapProducts(docs), total, pages: Math.max(1, Math.ceil(total / 30)) }
}

export async function getAdminProduct(id: ObjectId): Promise<Product | null> {
  const { products } = await collections()
  const doc = await products.findOne({ _id: id })
  return doc ? (await mapProducts([doc]))[0] : null
}

async function uniqueSlug(base: string, excludeId?: ObjectId): Promise<string> {
  const { products } = await collections()
  const root = base || 'product'
  for (let i = 1; i < 200; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`
    const exists = await products.findOne({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }, { projection: { _id: 1 } })
    if (!exists) return candidate
  }
  throw conflict('Could not create a unique link for this product.')
}

async function buildDoc(input: ProductInput, excludeId?: ObjectId) {
  const { categories } = await collections()
  let categoryId: ObjectId | null = null
  if (input.categoryId) {
    categoryId = new ObjectId(input.categoryId)
    if (!(await categories.findOne({ _id: categoryId }, { projection: { _id: 1 } })))
      throw badRequest('Choose a valid collection.', { categoryId: 'Collection not found' })
  }
  const sizes = sortSizes(input.sizes)
  const stock = new Map(input.variants.map((v) => [`${v.color}/${v.size}`, v.stock]))
  const variants = input.colors.flatMap((c) => sizes.map((s) => ({ color: c.name, size: s, stock: stock.get(`${c.name}/${s}`) ?? 0 })))
  return {
    slug: await uniqueSlug(input.slug || slugify(input.name), excludeId),
    name: input.name,
    description: input.description,
    details: input.details,
    fit: input.fit,
    categoryId,
    price: input.price,
    salePrice: input.salePrice,
    imageIds: input.imageIds.map((i) => new ObjectId(i)),
    colors: input.colors.map((c) => ({ name: c.name, hex: c.hex.toUpperCase(), imageIds: c.imageIds.map((i) => new ObjectId(i)) })),
    sizes,
    variants,
    featured: input.featured,
    newArrival: input.newArrival,
    status: input.status,
  }
}

const allImageIds = (d: Pick<ProductDoc, 'imageIds' | 'colors'>) => [...d.imageIds, ...d.colors.flatMap((c) => c.imageIds)]

export async function createProduct(input: ProductInput): Promise<Product> {
  const { products } = await collections()
  const now = new Date()
  const doc: ProductDoc = { _id: new ObjectId(), ...(await buildDoc(input)), createdAt: now, updatedAt: now }
  await products.insertOne(doc)
  return (await mapProducts([doc]))[0]
}

export async function updateProduct(id: ObjectId, input: ProductInput): Promise<Product> {
  const { products } = await collections()
  const existing = await products.findOne({ _id: id })
  if (!existing) throw notFound('Product not found.')
  const update = { ...(await buildDoc(input, id)), updatedAt: new Date() }
  await products.updateOne({ _id: id }, { $set: update })
  const kept = new Set(allImageIds(update).map((i) => i.toHexString()))
  await deleteUnreferencedImages(allImageIds(existing).filter((i) => !kept.has(i.toHexString())))
  return (await mapProducts([{ ...existing, ...update }]))[0]
}

export async function deleteProduct(id: ObjectId): Promise<void> {
  const { products, carts } = await collections()
  const existing = await products.findOneAndDelete({ _id: id })
  if (!existing) throw notFound('Product not found.')
  await carts.updateMany({ 'items.productId': id.toHexString() }, { $pull: { items: { productId: id.toHexString() } } })
  await deleteUnreferencedImages(allImageIds(existing))
}

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { MongoClient, ObjectId, type Db } from 'mongodb'
import { sortSizes } from '../src/lib/catalog'
import { slugify } from '../src/lib/slug'
import { productInputSchema } from '../src/lib/validation'
import { categories, products, settingsImages, type SeedProduct } from './seed/catalog'

const IMAGE_DIR = fileURLToPath(new URL('./seed/images/', import.meta.url))
const DAY = 24 * 60 * 60 * 1000

async function removeCatalog(db: Db) {
  const [productDocs, categoryDocs, settings, orderImages] = await Promise.all([
    db.collection('products').find({}, { projection: { imageIds: 1, colors: 1 } }).toArray(),
    db.collection('categories').find({}, { projection: { imageId: 1 } }).toArray(),
    db.collection('settings').findOne({ _id: 'store' as never }),
    db.collection('orders').distinct('items.imageId'),
  ])
  const ids = [
    ...productDocs.flatMap((p) => [...(p.imageIds ?? []), ...(p.colors ?? []).flatMap((c: { imageIds: ObjectId[] }) => c.imageIds)]),
    ...categoryDocs.map((c) => c.imageId).filter(Boolean),
    settings?.heroImageId,
    settings?.aboutImageId,
  ].filter(Boolean) as ObjectId[]
  const keep = new Set(orderImages.filter(Boolean).map((i) => String(i)))
  const removable = [...new Map(ids.map((id) => [String(id), id])).values()].filter((id) => !keep.has(String(id)))
  await db.collection('products').deleteMany({})
  await db.collection('categories').deleteMany({})
  if (removable.length) await db.collection('images').deleteMany({ _id: { $in: removable } })
  return { products: productDocs.length, categories: categoryDocs.length, images: removable.length }
}

function stockFor(p: SeedProduct, color: string, size: string): number {
  if (typeof p.stock === 'number') return p.stock
  return p.stock[`${color}/${size}`] ?? p.stock.default ?? 0
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set. Add it to .env.local first.')
  const replace = process.argv.includes('--replace')
  const client = await new MongoClient(uri, { serverSelectionTimeoutMS: 15000 }).connect()
  const db = client.db(process.env.MONGODB_DB || 'veltre')

  try {
    await Promise.all([
      db.collection('products').createIndex({ slug: 1 }, { unique: true }),
      db.collection('categories').createIndex({ slug: 1 }, { unique: true }),
    ])

    const existing = await db.collection('products').countDocuments()
    if (existing > 0 && !replace) {
      console.log(`The store already has ${existing} products. Nothing was changed.`)
      console.log('Run `npm run seed -- --replace` to replace the catalog (orders and customers are kept).')
      return
    }
    if (replace) {
      const removed = await removeCatalog(db)
      console.log(`Removed ${removed.products} products, ${removed.categories} collections and ${removed.images} images.`)
    }

    const admin = await db.collection('users').findOne({ role: 'admin' }, { projection: { _id: 1 } })
    const uploadedBy = admin?._id ?? new ObjectId()
    const images = new Map<string, ObjectId>()
    const image = async (name: string) => {
      const cached = images.get(name)
      if (cached) return cached
      const buffer = await readFile(`${IMAGE_DIR}${name}.webp`)
      const _id = new ObjectId()
      await db.collection('images').insertOne({ _id, data: buffer.toString('base64'), mimeType: 'image/webp', size: buffer.length, uploadedBy, createdAt: new Date() })
      images.set(name, _id)
      return _id
    }

    const now = Date.now()
    const categoryIds = new Map<string, ObjectId>()
    for (const [i, c] of categories.entries()) {
      const _id = new ObjectId()
      await db.collection('categories').insertOne({
        _id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        imageId: await image(c.image),
        sortOrder: i,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      })
      categoryIds.set(c.slug, _id)
    }

    for (const p of products) {
      const sizes = sortSizes(p.sizes)
      const imageIds = await Promise.all(p.images.map(image))
      const colors = await Promise.all(
        p.colors.map(async (c) => ({ name: c.name, hex: c.hex.toUpperCase(), imageIds: await Promise.all((c.images ?? []).map(image)) })),
      )
      const variants = colors.flatMap((c) => sizes.map((s) => ({ color: c.name, size: s, stock: stockFor(p, c.name, s) })))
      const categoryId = categoryIds.get(p.category)
      if (!categoryId) throw new Error(`Unknown category "${p.category}" for ${p.name}`)

      productInputSchema.parse({
        name: p.name,
        description: p.description,
        details: p.details,
        fit: p.fit,
        categoryId: categoryId.toHexString(),
        price: p.price,
        salePrice: p.salePrice ?? null,
        imageIds: imageIds.map(String),
        sizes,
        colors: colors.map((c) => ({ ...c, imageIds: c.imageIds.map(String) })),
        variants,
      })

      const createdAt = new Date(now - p.daysAgo * DAY)
      await db.collection('products').insertOne({
        _id: new ObjectId(),
        slug: slugify(p.name),
        name: p.name,
        description: p.description,
        details: p.details,
        fit: p.fit,
        categoryId,
        price: p.price,
        salePrice: p.salePrice ?? null,
        imageIds,
        colors,
        sizes,
        variants,
        featured: p.featured ?? false,
        newArrival: p.newArrival ?? false,
        status: 'active',
        createdAt,
        updatedAt: createdAt,
      })
    }

    await db.collection('settings').updateOne(
      { _id: 'store' as never },
      { $set: { heroImageId: await image(settingsImages.hero), aboutImageId: await image(settingsImages.about), updatedAt: new Date() } },
      { upsert: true },
    )

    console.log(`✓ Added ${categories.length} collections, ${products.length} products and ${images.size} images.`)
    console.log('✓ Set the homepage hero and About page images.')
  } finally {
    await client.close()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})

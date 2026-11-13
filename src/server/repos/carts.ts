import 'server-only'
import type { ObjectId } from 'mongodb'
import { cartKey, normalizeCart } from '@/lib/cart'
import { unitPrice, variantStock } from '@/lib/catalog'
import type { CartItem, CartQuote } from '@/lib/types'
import { collections } from '../db'
import { getProductDocsByIds } from './products'
import { imageUrl } from './images'
import { getSettings } from './settings'

export async function quoteCart(rawItems: CartItem[]): Promise<CartQuote> {
  const items = normalizeCart(rawItems)
  const settings = await getSettings()
  const docs = await getProductDocsByIds(items.map((i) => i.productId))
  const byId = new Map(docs.map((d) => [d._id.toHexString(), d]))

  const lines = items.map((item) => {
    const doc = byId.get(item.productId)
    const key = cartKey(item)
    if (!doc || doc.status !== 'active') {
      return { ...item, key, slug: '', name: 'Unavailable product', image: null, unitPrice: 0, lineTotal: 0, maxQuantity: 0, available: false }
    }
    const stock = variantStock(doc.variants, item.color, item.size)
    const max = Math.min(stock, settings.maxQuantityPerItem)
    const quantity = Math.min(item.quantity, Math.max(max, 1))
    const price = unitPrice(doc)
    const image = imageUrl(doc.colors.find((c) => c.name === item.color)?.imageIds[0] ?? doc.imageIds[0])
    const available = max > 0
    return {
      ...item,
      quantity,
      key,
      slug: doc.slug,
      name: doc.name,
      image,
      unitPrice: price,
      lineTotal: available ? price * quantity : 0,
      maxQuantity: max,
      available,
    }
  })

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0)
  return {
    lines,
    itemCount: lines.filter((l) => l.available).reduce((sum, l) => sum + l.quantity, 0),
    subtotal,
    deliveryFee: settings.deliveryFee,
    total: subtotal + (settings.deliveryFee ?? 0),
  }
}

export async function getCart(userId: ObjectId): Promise<CartItem[]> {
  const { carts } = await collections()
  const doc = await carts.findOne({ _id: userId })
  return normalizeCart(doc?.items ?? [])
}

export async function saveCart(userId: ObjectId, items: CartItem[]): Promise<CartItem[]> {
  const { carts } = await collections()
  const clean = normalizeCart(items)
  await carts.updateOne({ _id: userId }, { $set: { items: clean, updatedAt: new Date() } }, { upsert: true })
  return clean
}

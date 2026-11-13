import 'server-only'
import { randomInt } from 'node:crypto'
import { ObjectId, MongoServerError, type Filter } from 'mongodb'
import type { z } from 'zod'
import { normalizeCart } from '@/lib/cart'
import { unitPrice, variantStock } from '@/lib/catalog'
import { escapeRegex } from '@/lib/slug'
import type { Order, OrderDelivery, OrderStatus } from '@/lib/types'
import type { createOrderSchema, updateOrderSchema } from '@/lib/validation'
import { collections } from '../db'
import type { OrderDoc, OrderItemDoc, UserDoc } from '../documents'
import { badRequest, conflict, notFound } from '../http'
import { imageUrl } from './images'
import { getProductDocsByIds } from './products'
import { getSettings } from './settings'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const NO_DELIVERY: OrderDelivery = { estimatedDate: '', paymentMethod: '' }

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export function orderNumber(prefix: string, date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Accra', year: '2-digit', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  const suffix = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
  return `${prefix}-${get('year')}${get('month')}${get('day')}-${suffix}`
}

export function toOrder(doc: OrderDoc): Order {
  return {
    id: doc._id.toHexString(),
    number: doc.number,
    userId: doc.userId.toHexString(),
    customer: doc.customer,
    items: doc.items.map((i) => ({
      productId: i.productId.toHexString(),
      slug: i.slug,
      name: i.name,
      image: imageUrl(i.imageId),
      color: i.color,
      size: i.size,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    itemCount: doc.itemCount,
    subtotal: doc.subtotal,
    deliveryFee: doc.deliveryFee,
    total: doc.total,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    delivery: { estimatedDate: doc.delivery?.estimatedDate ?? NO_DELIVERY.estimatedDate, paymentMethod: doc.delivery?.paymentMethod ?? NO_DELIVERY.paymentMethod },
    statusHistory: doc.statusHistory.map((h) => ({ status: h.status, at: h.at.toISOString(), note: h.note })),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

async function releaseStock(items: Pick<OrderItemDoc, 'productId' | 'color' | 'size' | 'quantity'>[]) {
  const { products } = await collections()
  for (const item of items) {
    await products.updateOne(
      { _id: item.productId },
      { $inc: { 'variants.$[v].stock': item.quantity } },
      { arrayFilters: [{ 'v.color': item.color, 'v.size': item.size }] },
    )
  }
}

export async function createOrder(user: UserDoc, input: z.infer<typeof createOrderSchema>): Promise<Order> {
  const { products, orders, carts, users } = await collections()
  const settings = await getSettings()
  const items = normalizeCart(input.items)
  if (items.length === 0) throw badRequest('Your cart is empty.')

  const docs = await getProductDocsByIds(items.map((i) => i.productId))
  const byId = new Map(docs.map((d) => [d._id.toHexString(), d]))
  const lines: OrderItemDoc[] = []

  for (const item of items) {
    const doc = byId.get(item.productId)
    if (!doc || doc.status !== 'active') throw conflict('An item in your cart is no longer available. Please review your cart.')
    const stock = variantStock(doc.variants, item.color, item.size)
    if (stock < item.quantity)
      throw conflict(
        stock === 0
          ? `${doc.name} (${item.color} / ${item.size}) is sold out. Please update your cart.`
          : `Only ${stock} of ${doc.name} (${item.color} / ${item.size}) left. Please update your cart.`,
      )
    if (item.quantity > settings.maxQuantityPerItem)
      throw conflict(`You can order up to ${settings.maxQuantityPerItem} of each item.`)
    const price = unitPrice(doc)
    const colorImage = doc.colors.find((c) => c.name === item.color)?.imageIds[0]
    lines.push({
      productId: doc._id,
      slug: doc.slug,
      name: doc.name,
      imageId: colorImage ?? doc.imageIds[0] ?? null,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      unitPrice: price,
      lineTotal: price * item.quantity,
    })
  }

  const reserved: OrderItemDoc[] = []
  for (const line of lines) {
    const res = await products.updateOne(
      { _id: line.productId, status: 'active', variants: { $elemMatch: { color: line.color, size: line.size, stock: { $gte: line.quantity } } } },
      { $inc: { 'variants.$[v].stock': -line.quantity } },
      { arrayFilters: [{ 'v.color': line.color, 'v.size': line.size }] },
    )
    if (res.modifiedCount !== 1) {
      await releaseStock(reserved)
      throw conflict(`${line.name} (${line.color} / ${line.size}) just sold out. Please update your cart.`)
    }
    reserved.push(line)
  }

  const now = new Date()
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0)
  const base: Omit<OrderDoc, '_id' | 'number'> = {
    userId: user._id,
    customer: input.customer,
    items: lines,
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    subtotal,
    deliveryFee: settings.deliveryFee,
    total: subtotal + (settings.deliveryFee ?? 0),
    status: 'pending',
    paymentStatus: 'unpaid',
    stockRestored: false,
    statusHistory: [{ status: 'pending', at: now, note: 'Order placed', by: user._id }],
    createdAt: now,
    updatedAt: now,
  }

  let doc: OrderDoc | null = null
  try {
    for (let attempt = 0; attempt < 5 && !doc; attempt++) {
      const candidate: OrderDoc = { _id: new ObjectId(), number: orderNumber(settings.orderPrefix, now), ...base }
      try {
        await orders.insertOne(candidate)
        doc = candidate
      } catch (err) {
        if (!(err instanceof MongoServerError && err.code === 11000)) throw err
      }
    }
    if (!doc) throw new Error('Could not generate an order number')
  } catch (err) {
    await releaseStock(reserved)
    throw err
  }

  await carts.updateOne({ _id: user._id }, { $set: { items: [], updatedAt: now } }, { upsert: true })
  if (input.saveDetails) {
    await users.updateOne(
      { _id: user._id },
      { $set: { phone: input.customer.whatsapp, address: input.customer.address, updatedAt: now } },
    )
  }
  return toOrder(doc)
}

export async function listUserOrders(userId: ObjectId): Promise<Order[]> {
  const { orders } = await collections()
  return (await orders.find({ userId }).sort({ createdAt: -1 }).limit(100).toArray()).map(toOrder)
}

export async function getUserOrder(userId: ObjectId, number: string): Promise<Order | null> {
  const { orders } = await collections()
  const doc = await orders.findOne({ userId, number })
  return doc ? toOrder(doc) : null
}

export async function getOrderById(id: ObjectId): Promise<Order | null> {
  const { orders } = await collections()
  const doc = await orders.findOne({ _id: id })
  return doc ? toOrder(doc) : null
}

export async function listAdminOrders({ status = '', q = '', page = 1 }: { status?: string; q?: string; page?: number }) {
  const { orders } = await collections()
  const filter: Filter<OrderDoc> = {}
  if (status && status in ORDER_TRANSITIONS) filter.status = status as OrderStatus
  if (q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i')
    filter.$or = [{ number: rx }, { 'customer.fullName': rx }, { 'customer.whatsapp': rx }]
  }
  const [docs, total] = await Promise.all([
    orders.find(filter).sort({ createdAt: -1 }).skip((page - 1) * 30).limit(30).toArray(),
    orders.countDocuments(filter),
  ])
  return { orders: docs.map(toOrder), total, pages: Math.max(1, Math.ceil(total / 30)) }
}

async function applyStatus(doc: OrderDoc, status: OrderStatus, note: string, by: ObjectId | null) {
  if (doc.status === status) return
  if (!ORDER_TRANSITIONS[doc.status].includes(status))
    throw badRequest(`An order that is ${doc.status} cannot be changed to ${status}.`)
  const { orders } = await collections()
  const now = new Date()
  const res = await orders.updateOne(
    { _id: doc._id, status: doc.status },
    {
      $set: { status, updatedAt: now, ...(status === 'cancelled' ? { stockRestored: true } : {}) },
      $push: { statusHistory: { status, at: now, note, by } },
    },
  )
  if (res.modifiedCount !== 1) throw conflict('This order was just updated. Please refresh and try again.')
  if (status === 'cancelled' && !doc.stockRestored) await releaseStock(doc.items)
}

export async function updateOrder(id: ObjectId, input: z.infer<typeof updateOrderSchema>, adminId: ObjectId): Promise<Order> {
  const { orders } = await collections()
  const doc = await orders.findOne({ _id: id })
  if (!doc) throw notFound('Order not found.')
  if (input.status) await applyStatus(doc, input.status, input.note, adminId)
  else if (input.note) {
    // An update for the customer without a status change; it shows on their tracking page.
    await orders.updateOne({ _id: id }, { $set: { updatedAt: new Date() }, $push: { statusHistory: { status: doc.status, at: new Date(), note: input.note, by: adminId } } })
  }
  if (input.paymentStatus && input.paymentStatus !== doc.paymentStatus) {
    await orders.updateOne({ _id: id }, { $set: { paymentStatus: input.paymentStatus, updatedAt: new Date() } })
  }
  if (input.delivery) {
    const fields = Object.fromEntries(Object.entries(input.delivery).map(([k, v]) => [`delivery.${k}`, v]))
    if (Object.keys(fields).length) await orders.updateOne({ _id: id }, { $set: { ...fields, updatedAt: new Date() } })
  }
  return (await getOrderById(id)) as Order
}

export async function cancelOwnOrder(user: UserDoc, number: string): Promise<Order> {
  const { orders } = await collections()
  const doc = await orders.findOne({ userId: user._id, number })
  if (!doc) throw notFound('Order not found.')
  if (doc.status !== 'pending') throw badRequest('This order has already been confirmed. Please contact us on WhatsApp to change it.')
  await applyStatus(doc, 'cancelled', 'Cancelled by customer', user._id)
  return (await getOrderById(doc._id)) as Order
}

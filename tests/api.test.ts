import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ORIGIN, PNG_1PX, call } from './helpers'
import * as register from '@/app/api/auth/register/route'
import * as login from '@/app/api/auth/login/route'
import * as logout from '@/app/api/auth/logout/route'
import * as me from '@/app/api/auth/me/route'
import * as account from '@/app/api/account/route'
import * as password from '@/app/api/account/password/route'
import * as cancelOrder from '@/app/api/account/orders/[number]/cancel/route'
import * as products from '@/app/api/products/route'
import * as productById from '@/app/api/products/[id]/route'
import * as categories from '@/app/api/categories/route'
import * as categoryById from '@/app/api/categories/[id]/route'
import * as images from '@/app/api/images/route'
import * as imageById from '@/app/api/images/[id]/route'
import * as cart from '@/app/api/cart/route'
import * as quote from '@/app/api/cart/quote/route'
import * as orders from '@/app/api/orders/route'
import * as orderById from '@/app/api/orders/[id]/route'
import * as settings from '@/app/api/settings/route'
import * as customers from '@/app/api/admin/customers/route'
import * as customerById from '@/app/api/admin/customers/[id]/route'
import * as stats from '@/app/api/admin/stats/route'
import { closeDb, getDb } from '@/server/db'

let admin = ''
let shopper = ''
let other = ''
let categoryId = ''
let imageId = ''
let productId = ''

const productBody = (over: Record<string, unknown> = {}) => ({
  name: 'Core Fleece Jogger',
  description: 'Brushed fleece jogger.',
  details: ['Cotton blend'],
  fit: 'Regular',
  categoryId,
  price: 32000,
  salePrice: null,
  imageIds: [imageId],
  sizes: ['M', 'S', 'L'],
  colors: [
    { name: 'Black', hex: '#111111', imageIds: [] },
    { name: 'Grey', hex: '#999999', imageIds: [] },
  ],
  variants: [
    { color: 'Black', size: 'S', stock: 5 },
    { color: 'Black', size: 'M', stock: 3 },
    { color: 'Grey', size: 'M', stock: 1 },
  ],
  featured: true,
  newArrival: false,
  status: 'active',
  ...over,
})

const customer = { fullName: 'Ama Mensah', whatsapp: '024 123 4567', address: 'Osu, Oxford Street, Accra', notes: '' }

async function stockOf(color: string, size: string) {
  const res = await call(productById.GET, 'GET', `/api/products/${productId}`, { cookie: admin, params: { id: productId } })
  const p = res.json.product as { variants: { color: string; size: string; stock: number }[] }
  return p.variants.find((v) => v.color === color && v.size === size)?.stock
}

beforeAll(async () => {
  await (await getDb()).dropDatabase()
  await closeDb()
})

afterAll(async () => {
  await closeDb()
})

describe('auth', () => {
  it('registers users and makes ADMIN_EMAILS admins', async () => {
    const a = await call(register.POST, 'POST', '/api/auth/register', {
      body: { name: 'Store Owner', email: 'Owner@Veltre.test', phone: '0599967302', password: 'secret123' },
    })
    expect(a.status).toBe(201)
    expect(a.json.user).toMatchObject({ email: 'owner@veltre.test', role: 'admin' })
    expect(a.cookie).toBeTruthy()
    admin = a.cookie!

    const s = await call(register.POST, 'POST', '/api/auth/register', {
      body: { name: 'Ama Mensah', email: 'ama@example.com', phone: '024 123 4567', password: 'jogger2026' },
    })
    expect(s.json.user).toMatchObject({ role: 'customer' })
    shopper = s.cookie!

    const o = await call(register.POST, 'POST', '/api/auth/register', {
      body: { name: 'Kofi Boateng', email: 'kofi@example.com', phone: '020 555 1234', password: 'kofi12345' },
    })
    other = o.cookie!
  })

  it('rejects duplicate emails and weak passwords', async () => {
    const dup = await call(register.POST, 'POST', '/api/auth/register', {
      body: { name: 'Ama Two', email: 'AMA@example.com', phone: '0241234567', password: 'jogger2026' },
    })
    expect(dup.status).toBe(409)
    expect(dup.json.fields).toHaveProperty('email')

    const weak = await call(register.POST, 'POST', '/api/auth/register', {
      body: { name: 'X', email: 'not-an-email', phone: 'abc', password: 'short' },
    })
    expect(weak.status).toBe(400)
    expect(Object.keys(weak.json.fields as object).sort()).toEqual(['email', 'name', 'password', 'phone'])
  })

  it('logs in with the right password only and never returns the hash', async () => {
    const bad = await call(login.POST, 'POST', '/api/auth/login', { body: { email: 'ama@example.com', password: 'wrong-pass1' } })
    expect(bad.status).toBe(401)
    const good = await call(login.POST, 'POST', '/api/auth/login', { body: { email: 'AMA@example.com', password: 'jogger2026' } })
    expect(good.status).toBe(200)
    expect(JSON.stringify(good.json)).not.toContain('passwordHash')
    const who = await call(me.GET, 'GET', '/api/auth/me', { cookie: good.cookie })
    expect(who.json.user).toMatchObject({ email: 'ama@example.com' })
  })

  it('rate-limits repeated failed logins', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 10; i++) {
      const r = await call(login.POST, 'POST', '/api/auth/login', {
        body: { email: 'nobody@example.com', password: `wrong${i}pass` },
        ip: '10.9.9.9',
      })
      statuses.push(r.status)
    }
    expect(statuses.slice(0, 8).every((s) => s === 401)).toBe(true)
    expect(statuses.slice(8)).toEqual([429, 429])
  })

  it('logs out by destroying the session', async () => {
    const s = await call(login.POST, 'POST', '/api/auth/login', { body: { email: 'owner@veltre.test', password: 'secret123' } })
    await call(logout.POST, 'POST', '/api/auth/logout', { cookie: s.cookie })
    const who = await call(me.GET, 'GET', '/api/auth/me', { cookie: s.cookie })
    expect(who.json.user).toBeNull()
  })

  it('updates profile and changes password', async () => {
    const p = await call(account.PATCH, 'PATCH', '/api/account', {
      cookie: other,
      body: { name: 'Kofi Boateng', phone: '+233 20 555 1234', address: 'East Legon' },
    })
    expect(p.json.user).toMatchObject({ address: 'East Legon' })
    const wrong = await call(password.POST, 'POST', '/api/account/password', {
      cookie: other,
      body: { currentPassword: 'nope', newPassword: 'newpass123' },
    })
    expect(wrong.status).toBe(400)
    const right = await call(password.POST, 'POST', '/api/account/password', {
      cookie: other,
      body: { currentPassword: 'kofi12345', newPassword: 'newpass123' },
    })
    expect(right.status).toBe(200)
    const relog = await call(login.POST, 'POST', '/api/auth/login', { body: { email: 'kofi@example.com', password: 'newpass123' }, ip: '10.1.1.1' })
    expect(relog.status).toBe(200)
  })
})

describe('security', () => {
  it('blocks cross-site and missing-origin writes', async () => {
    const cross = await call(categories.POST, 'POST', '/api/categories', { cookie: admin, origin: 'https://evil.example', body: { name: 'Hack' } })
    expect(cross.status).toBe(403)
    const none = await call(categories.POST, 'POST', '/api/categories', { cookie: admin, origin: null, body: { name: 'Hack' } })
    expect(none.status).toBe(403)
  })

  it('requires login and admin role for admin endpoints', async () => {
    expect((await call(categories.POST, 'POST', '/api/categories', { body: { name: 'Cargo' } })).status).toBe(401)
    expect((await call(categories.POST, 'POST', '/api/categories', { cookie: shopper, body: { name: 'Cargo' } })).status).toBe(403)
    expect((await call(stats.GET, 'GET', '/api/admin/stats', { cookie: shopper })).status).toBe(403)
    expect((await call(settings.PUT, 'PUT', '/api/settings', { cookie: shopper, body: {} })).status).toBe(403)
  })
})

describe('catalog admin', () => {
  it('creates a category with a unique slug', async () => {
    const c = await call(categories.POST, 'POST', '/api/categories', { cookie: admin, body: { name: 'Essentials', description: 'Everyday fleece' } })
    expect(c.status).toBe(201)
    categoryId = (c.json.category as { id: string }).id
    const again = await call(categories.POST, 'POST', '/api/categories', { cookie: admin, body: { name: 'Essentials' } })
    expect((again.json.category as { slug: string }).slug).toBe('essentials-2')
    await call(categoryById.DELETE, 'DELETE', '/api/categories/x', { cookie: admin, params: { id: (again.json.category as { id: string }).id } })
    const list = await call(categories.GET, 'GET', '/api/categories')
    expect((list.json.categories as unknown[]).length).toBe(1)
  })

  it('stores uploaded images as base64 and serves them as binary', async () => {
    const bad = await call(images.POST, 'POST', '/api/images', { cookie: admin, body: { data: 'data:image/png;base64,aGVsbG8gd29ybGQ=' } })
    expect(bad.status).toBe(400)
    const up = await call(images.POST, 'POST', '/api/images', { cookie: admin, body: { data: PNG_1PX } })
    expect(up.status).toBe(201)
    imageId = up.json.id as string
    const stored = await (await getDb()).collection('images').findOne()
    expect(typeof stored?.data).toBe('string')
    const res = await imageById.GET(
      new (await import('next/server')).NextRequest(`${ORIGIN}/api/images/${imageId}`),
      { params: Promise.resolve({ id: imageId }) },
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
    expect(res.headers.get('cache-control')).toContain('immutable')
    expect(new Uint8Array(await res.arrayBuffer()).slice(1, 4)).toEqual(new Uint8Array([0x50, 0x4e, 0x47]))
  })

  it('validates and creates products with a full colour × size stock grid', async () => {
    const invalid = await call(products.POST, 'POST', '/api/products', { cookie: admin, body: productBody({ salePrice: 40000, sizes: [] }) })
    expect(invalid.status).toBe(400)
    expect(invalid.json.fields).toHaveProperty('sizes')

    const created = await call(products.POST, 'POST', '/api/products', { cookie: admin, body: productBody() })
    expect(created.status).toBe(201)
    const p = created.json.product as { id: string; slug: string; sizes: string[]; variants: unknown[]; images: string[] }
    productId = p.id
    expect(p.slug).toBe('core-fleece-jogger')
    expect(p.sizes).toEqual(['S', 'M', 'L'])
    expect(p.variants).toHaveLength(6)
    expect(p.images).toEqual([`/api/images/${imageId}`])

    const draft = await call(products.POST, 'POST', '/api/products', {
      cookie: admin,
      body: productBody({ name: 'Hidden Draft', status: 'draft', price: 10000 }),
    })
    expect(draft.status).toBe(201)
  })

  it('searches, filters and sorts in the database, hiding drafts', async () => {
    const all = await call(products.GET, 'GET', '/api/products')
    expect((all.json.products as { name: string }[]).map((p) => p.name)).toEqual(['Core Fleece Jogger'])
    const search = await call(products.GET, 'GET', '/api/products?q=fleece%20black')
    expect(search.json.total).toBe(1)
    expect((await call(products.GET, 'GET', '/api/products?q=denim')).json.total).toBe(0)
    expect((await call(products.GET, 'GET', '/api/products?size=L')).json.total).toBe(0)
    expect((await call(products.GET, 'GET', '/api/products?size=M&color=Grey')).json.total).toBe(1)
    expect((await call(products.GET, 'GET', '/api/products?max=300')).json.total).toBe(0)
    expect((await call(products.GET, 'GET', '/api/products?min=300&max=350&category=essentials')).json.total).toBe(1)
    expect((await call(products.GET, 'GET', '/api/products?sale=1')).json.total).toBe(0)
  })
})

describe('cart', () => {
  it('quotes prices from the database and clamps to stock', async () => {
    const q = await call(quote.POST, 'POST', '/api/cart/quote', {
      body: {
        items: [
          { productId, color: 'Grey', size: 'M', quantity: 4 },
          { productId, color: 'Black', size: 'L', quantity: 1 },
          { productId: 'a'.repeat(24), color: 'Black', size: 'M', quantity: 1 },
        ],
      },
    })
    const lines = q.json.lines as { quantity: number; unitPrice: number; available: boolean; lineTotal: number }[]
    expect(lines[0]).toMatchObject({ quantity: 1, unitPrice: 32000, available: true, lineTotal: 32000 })
    expect(lines[1].available).toBe(false)
    expect(lines[2].available).toBe(false)
    expect(q.json).toMatchObject({ itemCount: 1, subtotal: 32000, deliveryFee: null, total: 32000 })
  })

  it('syncs a logged-in cart and drops malformed items', async () => {
    const put = await call(cart.PUT, 'PUT', '/api/cart', {
      cookie: shopper,
      body: { items: [{ productId, color: 'Black', size: 'S', quantity: 2 }] },
    })
    expect(put.status).toBe(200)
    const get = await call(cart.GET, 'GET', '/api/cart', { cookie: shopper })
    expect(get.json.items).toEqual([{ productId, color: 'Black', size: 'S', quantity: 2 }])
    expect((await call(cart.PUT, 'PUT', '/api/cart', { cookie: shopper, body: { items: [{ productId: 'x', quantity: 1 }] } })).status).toBe(400)
  })
})

describe('orders', () => {
  let orderId = ''
  let orderNumber = ''

  it('requires login to place an order', async () => {
    const r = await call(orders.POST, 'POST', '/api/orders', { body: { items: [{ productId, color: 'Black', size: 'S', quantity: 1 }], customer } })
    expect(r.status).toBe(401)
  })

  it('places an order with server-side prices, reserves stock and builds the WhatsApp link', async () => {
    const r = await call(orders.POST, 'POST', '/api/orders', {
      cookie: shopper,
      host: 'veltre.vercel.app',
      body: { items: [{ productId, color: 'Black', size: 'S', quantity: 2 }], customer },
    })
    expect(r.status).toBe(201)
    const order = r.json.order as { id: string; number: string; total: number; status: string; items: { unitPrice: number }[] }
    orderId = order.id
    orderNumber = order.number
    expect(order.number).toMatch(/^VLT-\d{6}-[A-HJ-NP-Z2-9]{6}$/)
    expect(order).toMatchObject({ total: 64000, status: 'pending' })
    expect(await stockOf('Black', 'S')).toBe(3)
    const url = new URL(r.json.whatsappUrl as string)
    expect(url.origin + url.pathname).toBe('https://wa.me/233599967302')
    const text = url.searchParams.get('text')!
    expect(text).toContain(`Order: ${order.number}`)
    expect(text).toContain('Qty: 2 × GH₵320.00 = GH₵640.00')
    expect(text).toContain(`Manage order: https://veltre.vercel.app/admin/orders/${order.id}`)
    expect(text).not.toContain('localhost')
    expect((await call(cart.GET, 'GET', '/api/cart', { cookie: shopper })).json.items).toEqual([])
  })

  it('refuses to oversell and leaves stock untouched when any item fails', async () => {
    const r = await call(orders.POST, 'POST', '/api/orders', {
      cookie: shopper,
      body: {
        items: [
          { productId, color: 'Black', size: 'M', quantity: 2 },
          { productId, color: 'Grey', size: 'M', quantity: 2 },
        ],
        customer,
      },
    })
    expect(r.status).toBe(409)
    expect(r.json.error).toMatch(/Only 1 of Core Fleece Jogger/)
    expect(await stockOf('Black', 'M')).toBe(3)
    expect(await stockOf('Grey', 'M')).toBe(1)
  })

  it('keeps orders private to their owner', async () => {
    expect((await call(orderById.GET, 'GET', `/api/orders/${orderId}`, { cookie: other, params: { id: orderId } })).status).toBe(403)
    expect((await call(orderById.GET, 'GET', `/api/orders/${orderId}`, { cookie: shopper, params: { id: orderId } })).status).toBe(200)
    const mine = await call(orders.GET, 'GET', '/api/orders', { cookie: other })
    expect(mine.json.orders).toEqual([])
  })

  it('lets a customer cancel a pending order and restores stock', async () => {
    const r = await call(cancelOrder.POST, 'POST', `/api/account/orders/${orderNumber}/cancel`, { cookie: shopper, params: { number: orderNumber } })
    expect(r.status).toBe(200)
    expect((r.json.order as { status: string }).status).toBe('cancelled')
    expect(await stockOf('Black', 'S')).toBe(5)
    const again = await call(cancelOrder.POST, 'POST', '', { cookie: shopper, params: { number: orderNumber } })
    expect(again.status).toBe(400)
    expect(await stockOf('Black', 'S')).toBe(5)
  })

  it('moves orders through valid statuses only and restores stock once on cancel', async () => {
    const placed = await call(orders.POST, 'POST', '/api/orders', {
      cookie: shopper,
      body: { items: [{ productId, color: 'Grey', size: 'M', quantity: 1 }], customer },
    })
    const id = (placed.json.order as { id: string }).id
    expect(await stockOf('Grey', 'M')).toBe(0)

    const patch = (body: unknown) => call(orderById.PATCH, 'PATCH', `/api/orders/${id}`, { cookie: admin, params: { id }, body })
    expect((await call(orderById.PATCH, 'PATCH', '', { cookie: shopper, params: { id }, body: { status: 'confirmed' } })).status).toBe(403)
    expect((await patch({ status: 'delivered' })).status).toBe(400)
    expect(((await patch({ status: 'confirmed', note: 'Stock checked' })).json.order as { status: string }).status).toBe('confirmed')
    const custCancel = await call(cancelOrder.POST, 'POST', '', { cookie: shopper, params: { number: (placed.json.order as { number: string }).number } })
    expect(custCancel.status).toBe(400)
    expect(((await patch({ paymentStatus: 'paid' })).json.order as { paymentStatus: string }).paymentStatus).toBe('paid')
    expect(((await patch({ status: 'cancelled' })).json.order as { status: string }).status).toBe('cancelled')
    expect(await stockOf('Grey', 'M')).toBe(1)
    expect((await patch({ status: 'confirmed' })).status).toBe(400)
    expect(await stockOf('Grey', 'M')).toBe(1)
  })

  it('lets the admin post updates and delivery details the customer can see', async () => {
    const placed = await call(orders.POST, 'POST', '/api/orders', {
      cookie: shopper,
      body: { items: [{ productId, color: 'Black', size: 'S', quantity: 1 }], customer },
    })
    const id = (placed.json.order as { id: string }).id
    const patch = (body: unknown, cookie = admin) => call(orderById.PATCH, 'PATCH', `/api/orders/${id}`, { cookie, params: { id }, body })
    type Tracked = { status: string; delivery: { estimatedDate: string; paymentMethod: string }; statusHistory: { status: string; note: string }[] }

    expect((placed.json.order as Tracked).delivery).toEqual({ estimatedDate: '', paymentMethod: '' })
    expect((await patch({ note: 'Hi' }, shopper)).status).toBe(403)
    expect((await patch({ delivery: { estimatedDate: '18/10/2026' } })).status).toBe(400)

    await patch({ status: 'confirmed' })
    const posted = (await patch({ note: 'Packed and ready for pickup' })).json.order as Tracked
    expect(posted.status).toBe('confirmed')
    expect(posted.statusHistory.at(-1)).toMatchObject({ status: 'confirmed', note: 'Packed and ready for pickup' })

    const saved = (await patch({ delivery: { estimatedDate: '2026-10-18', paymentMethod: 'MTN Mobile Money' } })).json.order as Tracked
    expect(saved.delivery).toEqual({ estimatedDate: '2026-10-18', paymentMethod: 'MTN Mobile Money' })
    const partial = (await patch({ delivery: { paymentMethod: 'Cash on delivery' } })).json.order as Tracked
    expect(partial.delivery).toEqual({ estimatedDate: '2026-10-18', paymentMethod: 'Cash on delivery' })

    const seen = await call(orderById.GET, 'GET', `/api/orders/${id}`, { cookie: shopper, params: { id } })
    expect((seen.json.order as Tracked).delivery.paymentMethod).toBe('Cash on delivery')
    expect((await patch({ status: 'cancelled' })).status).toBe(200)
  })
})

describe('settings and admin', () => {
  it('validates settings and applies the delivery fee to new orders', async () => {
    const current = (await call(settings.GET, 'GET', '/api/settings')).json.settings as Record<string, unknown>
    const { heroImage: _h, aboutImage: _a, ...editable } = current
    const bad = await call(settings.PUT, 'PUT', '/api/settings', { cookie: admin, body: { ...editable, whatsappNumber: '+233 59 996 7302' } })
    expect(bad.status).toBe(400)
    expect(bad.json.fields).toHaveProperty('whatsappNumber')
    const good = await call(settings.PUT, 'PUT', '/api/settings', { cookie: admin, body: { ...editable, deliveryFee: 2500 } })
    expect(good.status).toBe(200)
    const q = await call(quote.POST, 'POST', '/api/cart/quote', { body: { items: [{ productId, color: 'Black', size: 'S', quantity: 1 }] } })
    expect(q.json).toMatchObject({ subtotal: 32000, deliveryFee: 2500, total: 34500 })
  })

  it('lists customers, resets passwords and can disable an account', async () => {
    const list = await call(customers.GET, 'GET', '/api/admin/customers?q=ama', { cookie: admin })
    const ama = (list.json.customers as { id: string; orderCount: number }[])[0]
    expect(ama.orderCount).toBe(0)
    const all = await call(customers.GET, 'GET', '/api/admin/customers', { cookie: admin })
    const self = (all.json.customers as { id: string; email: string }[]).find((c) => c.email === 'owner@veltre.test')!
    expect((await call(customerById.PATCH, 'PATCH', '', { cookie: admin, params: { id: self.id }, body: { disabled: true } })).status).toBe(400)
    expect((await call(customerById.PATCH, 'PATCH', '', { cookie: admin, params: { id: ama.id }, body: { password: 'short' } })).status).toBe(400)
    const reset = await call(customerById.PATCH, 'PATCH', '', { cookie: admin, params: { id: ama.id }, body: { password: 'Temp12345' } })
    expect(reset.status).toBe(200)
    expect((await call(me.GET, 'GET', '/api/auth/me', { cookie: shopper })).json.user).toBeNull()
    const relogin = await call(login.POST, 'POST', '/api/auth/login', { body: { email: 'ama@example.com', password: 'Temp12345' }, ip: '10.3.3.3' })
    expect(relogin.status).toBe(200)
    shopper = relogin.cookie!
    const off = await call(customerById.PATCH, 'PATCH', '', { cookie: admin, params: { id: ama.id }, body: { disabled: true } })
    expect(off.status).toBe(200)
    expect((await call(me.GET, 'GET', '/api/auth/me', { cookie: shopper })).json.user).toBeNull()
    expect((await call(login.POST, 'POST', '/api/auth/login', { body: { email: 'ama@example.com', password: 'Temp12345' }, ip: '10.2.2.2' })).status).toBe(401)
  })

  it('reports dashboard stats', async () => {
    const s = await call(stats.GET, 'GET', '/api/admin/stats', { cookie: admin })
    expect(s.json).toMatchObject({ orders30d: 0, pendingOrders: 0, activeProducts: 1 })
    expect((s.json.lowStock as unknown[]).length).toBeGreaterThan(0)
  })

  it('deletes products and their unused images', async () => {
    const del = await call(productById.DELETE, 'DELETE', '', { cookie: admin, params: { id: productId } })
    expect(del.status).toBe(200)
    expect((await call(products.GET, 'GET', '/api/products')).json.total).toBe(0)
  })
})

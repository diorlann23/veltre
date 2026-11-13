import type { CartItem } from './types'

export const MAX_CART_LINES = 50

export const cartKey = (i: Pick<CartItem, 'productId' | 'color' | 'size'>) => `${i.productId}::${i.color}::${i.size}`

export function normalizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return []
  const merged = new Map<string, CartItem>()
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const { productId, color, size, quantity } = entry as Record<string, unknown>
    if (typeof productId !== 'string' || !/^[a-f0-9]{24}$/.test(productId)) continue
    if (typeof color !== 'string' || typeof size !== 'string' || !color || !size) continue
    if (typeof quantity !== 'number' || !Number.isFinite(quantity)) continue
    const q = Math.floor(quantity)
    if (q < 1) continue
    const key = cartKey({ productId, color, size })
    const prev = merged.get(key)
    merged.set(key, { productId, color: color.slice(0, 60), size: size.slice(0, 20), quantity: Math.min(99, (prev?.quantity ?? 0) + q) })
    if (merged.size >= MAX_CART_LINES) break
  }
  return [...merged.values()]
}

export function mergeCarts(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>()
  for (const item of [...a, ...b]) {
    const key = cartKey(item)
    const prev = map.get(key)
    map.set(key, prev ? { ...prev, quantity: Math.max(prev.quantity, item.quantity) } : item)
  }
  return [...map.values()].slice(0, MAX_CART_LINES)
}

export function addItem(items: CartItem[], item: CartItem): CartItem[] {
  const key = cartKey(item)
  const existing = items.find((i) => cartKey(i) === key)
  if (existing) return items.map((i) => (cartKey(i) === key ? { ...i, quantity: i.quantity + item.quantity } : i))
  return [...items, item].slice(0, MAX_CART_LINES)
}

export function setItemQuantity(items: CartItem[], key: string, quantity: number): CartItem[] {
  const q = Math.floor(quantity)
  if (!Number.isFinite(q) || q < 1) return items.filter((i) => cartKey(i) !== key)
  return items.map((i) => (cartKey(i) === key ? { ...i, quantity: q } : i))
}

export function removeItem(items: CartItem[], key: string): CartItem[] {
  return items.filter((i) => cartKey(i) !== key)
}

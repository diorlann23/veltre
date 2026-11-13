import type { Product, Variant } from './types'

export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

export function isOnSale(p: Pick<Product, 'price' | 'salePrice'>): boolean {
  return p.salePrice !== null && p.salePrice > 0 && p.salePrice < p.price
}

export function unitPrice(p: Pick<Product, 'price' | 'salePrice'>): number {
  return isOnSale(p) ? (p.salePrice as number) : p.price
}

export function discountPercent(p: Pick<Product, 'price' | 'salePrice'>): number {
  return isOnSale(p) ? Math.round((1 - (p.salePrice as number) / p.price) * 100) : 0
}

export function sortSizes(sizes: string[]): string[] {
  const rank = (s: string) => {
    const i = SIZE_ORDER.indexOf(s.toUpperCase())
    return i === -1 ? SIZE_ORDER.length : i
  }
  return [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

export function variantStock(variants: Variant[], color: string, size: string): number {
  return Math.max(0, variants.find((v) => v.color === color && v.size === size)?.stock ?? 0)
}

export function totalStock(variants: Variant[]): number {
  return variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0)
}

export function isInStock(p: Pick<Product, 'variants'>): boolean {
  return p.variants.some((v) => v.stock > 0)
}

export function colorHasStock(variants: Variant[], color: string): boolean {
  return variants.some((v) => v.color === color && v.stock > 0)
}

export function sizeHasStock(variants: Variant[], size: string, color?: string | null): boolean {
  return variants.some((v) => v.size === size && v.stock > 0 && (!color || v.color === color))
}

export function galleryFor(p: Pick<Product, 'images' | 'colors'>, color?: string | null): string[] {
  const colorImages = color ? p.colors.find((c) => c.name === color)?.images : undefined
  return colorImages && colorImages.length > 0 ? colorImages : p.images
}

export type StockLevel = 'in-stock' | 'low-stock' | 'sold-out'

export function stockLevel(units: number, lowThreshold: number): StockLevel {
  if (units <= 0) return 'sold-out'
  if (units <= lowThreshold) return 'low-stock'
  return 'in-stock'
}

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A–Z' },
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]['value']

export interface CatalogQuery {
  q: string
  categories: string[]
  sizes: string[]
  colors: string[]
  min: number | null
  max: number | null
  inStock: boolean
  sale: boolean
  sort: SortOption
  page: number
}

type Params = Record<string, string | string[] | undefined> | URLSearchParams

function read(params: Params, key: string): string | null {
  if (params instanceof URLSearchParams) return params.get(key)
  const v = params[key]
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null)
}

const list = (v: string | null) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20) : [])
const cedisParam = (v: string | null) => {
  if (v === null || v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null
}

export function parseCatalogQuery(params: Params): CatalogQuery {
  const sort = read(params, 'sort')
  const page = Number(read(params, 'page'))
  return {
    q: (read(params, 'q') ?? '').slice(0, 80),
    categories: list(read(params, 'category')),
    sizes: list(read(params, 'size')),
    colors: list(read(params, 'color')),
    min: cedisParam(read(params, 'min')),
    max: cedisParam(read(params, 'max')),
    inStock: read(params, 'instock') === '1',
    sale: read(params, 'sale') === '1',
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortOption) : 'featured',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

export function catalogQueryToParams(q: CatalogQuery): URLSearchParams {
  const p = new URLSearchParams()
  if (q.q.trim()) p.set('q', q.q)
  if (q.categories.length) p.set('category', q.categories.join(','))
  if (q.sizes.length) p.set('size', q.sizes.join(','))
  if (q.colors.length) p.set('color', q.colors.join(','))
  if (q.min !== null) p.set('min', String(q.min / 100))
  if (q.max !== null) p.set('max', String(q.max / 100))
  if (q.inStock) p.set('instock', '1')
  if (q.sale) p.set('sale', '1')
  if (q.sort !== 'featured') p.set('sort', q.sort)
  if (q.page > 1) p.set('page', String(q.page))
  return p
}

export function countActiveFilters(q: CatalogQuery): number {
  return (
    q.categories.length +
    q.sizes.length +
    q.colors.length +
    (q.min !== null ? 1 : 0) +
    (q.max !== null ? 1 : 0) +
    (q.inStock ? 1 : 0) +
    (q.sale ? 1 : 0)
  )
}

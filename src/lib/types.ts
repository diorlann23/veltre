export type Role = 'customer' | 'admin'

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PRODUCT_STATUSES = ['active', 'draft', 'archived'] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export interface Variant {
  color: string
  size: string
  stock: number
}

export interface ProductColor {
  name: string
  hex: string
  images: string[]
}

export interface CategoryRef {
  id: string
  slug: string
  name: string
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  details: string[]
  fit: string
  category: CategoryRef | null
  price: number
  salePrice: number | null
  images: string[]
  imageIds: string[]
  colors: (ProductColor & { imageIds: string[] })[]
  sizes: string[]
  variants: Variant[]
  featured: boolean
  newArrival: boolean
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  image: string | null
  imageId: string | null
  sortOrder: number
  productCount: number
}

export interface CartItem {
  productId: string
  color: string
  size: string
  quantity: number
}

export interface CartLine extends CartItem {
  key: string
  slug: string
  name: string
  image: string | null
  unitPrice: number
  lineTotal: number
  maxQuantity: number
  available: boolean
}

export interface CartQuote {
  lines: CartLine[]
  itemCount: number
  subtotal: number
  deliveryFee: number | null
  total: number
}

export interface OrderItem {
  productId: string
  slug: string
  name: string
  image: string | null
  color: string
  size: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface OrderCustomer {
  fullName: string
  whatsapp: string
  address: string
  notes: string
}

export interface OrderDelivery {
  /** Calendar date (YYYY-MM-DD) the customer can expect delivery, or '' when not set yet. */
  estimatedDate: string
  paymentMethod: string
}

export interface Order {
  id: string
  number: string
  userId: string
  customer: OrderCustomer
  items: OrderItem[]
  itemCount: number
  subtotal: number
  deliveryFee: number | null
  total: number
  status: OrderStatus
  paymentStatus: 'unpaid' | 'paid'
  delivery: OrderDelivery
  statusHistory: { status: OrderStatus; at: string; note: string }[]
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  name: string
  role: Role
  phone: string
  address: string
}

export interface StoreSettings {
  brandName: string
  tagline: string
  description: string
  whatsappNumber: string
  contact: { email: string; phone: string; location: string; hours: string }
  social: { instagram: string; tiktok: string; snapchat: string; x: string; facebook: string }
  deliveryFee: number | null
  deliveryInfo: string
  paymentInfo: string
  exchangesInfo: string
  heroHeading: string
  heroText: string
  heroImage: string | null
  heroImageId: string | null
  aboutHeading: string
  aboutBody: string
  aboutImage: string | null
  aboutImageId: string | null
  orderPrefix: string
  lowStockThreshold: number
  maxQuantityPerItem: number
}

export const CURRENCY = { code: 'GHS', symbol: 'GH₵', locale: 'en-GH' } as const

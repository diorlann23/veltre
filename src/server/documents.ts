import type { ObjectId } from 'mongodb'
import type { CartItem, OrderCustomer, OrderDelivery, OrderStatus, ProductStatus, Role, Variant } from '@/lib/types'

export interface UserDoc {
  _id: ObjectId
  email: string
  name: string
  passwordHash: string
  role: Role
  phone: string
  address: string
  disabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SessionDoc {
  _id: string
  userId: ObjectId
  expiresAt: Date
  createdAt: Date
}

export interface ImageDoc {
  _id: ObjectId
  data: string
  mimeType: string
  size: number
  uploadedBy: ObjectId
  createdAt: Date
}

export interface CategoryDoc {
  _id: ObjectId
  slug: string
  name: string
  description: string
  imageId: ObjectId | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductDoc {
  _id: ObjectId
  slug: string
  name: string
  description: string
  details: string[]
  fit: string
  categoryId: ObjectId | null
  price: number
  salePrice: number | null
  imageIds: ObjectId[]
  colors: { name: string; hex: string; imageIds: ObjectId[] }[]
  sizes: string[]
  variants: Variant[]
  featured: boolean
  newArrival: boolean
  status: ProductStatus
  createdAt: Date
  updatedAt: Date
}

export interface CartDoc {
  _id: ObjectId
  items: CartItem[]
  updatedAt: Date
}

export interface OrderItemDoc {
  productId: ObjectId
  slug: string
  name: string
  imageId: ObjectId | null
  color: string
  size: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface OrderDoc {
  _id: ObjectId
  number: string
  userId: ObjectId
  customer: OrderCustomer
  items: OrderItemDoc[]
  itemCount: number
  subtotal: number
  deliveryFee: number | null
  total: number
  status: OrderStatus
  paymentStatus: 'unpaid' | 'paid'
  /** Absent on orders placed before delivery details existed. */
  delivery?: OrderDelivery
  stockRestored: boolean
  statusHistory: { status: OrderStatus; at: Date; note: string; by: ObjectId | null }[]
  createdAt: Date
  updatedAt: Date
}

export interface SettingsDoc {
  _id: 'store'
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
  heroImageId: ObjectId | null
  aboutHeading: string
  aboutBody: string
  aboutImageId: ObjectId | null
  orderPrefix: string
  lowStockThreshold: number
  maxQuantityPerItem: number
  updatedAt: Date
}

export interface RateLimitDoc {
  _id: string
  count: number
  expiresAt: Date
}

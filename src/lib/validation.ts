import { z } from 'zod'
import { isValidPhone, isValidWhatsAppNumber } from './phone'
import { ORDER_STATUSES, PRODUCT_STATUSES } from './types'

const objectId = z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id')
const trimmed = (max: number) => z.string().trim().max(max, `Must be ${max} characters or fewer`)
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes only')
const money = z.number().int('Invalid amount').min(0, 'Must be 0 or more').max(100_000_000, 'Amount is too large')
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || /^https:\/\/[^\s]+$/.test(v), 'Must be a full https:// link')

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(160)

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128, 'Use 128 characters or fewer')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Include at least one letter and one number')

export const phoneSchema = z
  .string()
  .trim()
  .max(24)
  .refine(isValidPhone, 'Enter a valid phone number, e.g. 024 123 4567')

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Enter your full name')
  .max(80, 'Must be 80 characters or fewer')
  .refine((v) => /\p{L}/u.test(v), 'Enter a valid name')

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password').max(128),
})

export const profileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  address: trimmed(300),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password').max(128),
  newPassword: passwordSchema,
})

export const cartItemSchema = z.object({
  productId: objectId,
  color: z.string().min(1).max(60),
  size: z.string().min(1).max(20),
  quantity: z.number().int().min(1).max(99),
})

export const cartSchema = z.object({ items: z.array(cartItemSchema).max(50) })

export const checkoutCustomerSchema = z.object({
  fullName: nameSchema,
  whatsapp: phoneSchema,
  address: z.string().trim().min(5, 'Add a little more detail so we can find you').max(300),
  notes: trimmed(500).default(''),
})

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Your cart is empty').max(50),
  customer: checkoutCustomerSchema,
  saveDetails: z.boolean().default(true),
})

export const updateOrderSchema = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    paymentStatus: z.enum(['unpaid', 'paid']).optional(),
    note: trimmed(300).default(''),
    delivery: z
      .object({
        estimatedDate: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date')]),
        paymentMethod: trimmed(60),
      })
      .partial()
      .optional(),
  })
  .refine((v) => v.status || v.paymentStatus || v.delivery || v.note, 'Nothing to update')

export const colorInputSchema = z.object({
  name: z.string().trim().min(1, 'Name the colour').max(40),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #111111'),
  imageIds: z.array(objectId).max(12).default([]),
})

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter a product name').max(120),
    slug: slug.or(z.literal('')).default(''),
    description: trimmed(2000).default(''),
    details: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
    fit: trimmed(500).default(''),
    categoryId: objectId.nullable().default(null),
    price: money.min(1, 'Enter a price'),
    salePrice: money.nullable().default(null),
    imageIds: z.array(objectId).max(12).default([]),
    sizes: z.array(z.string().trim().min(1).max(20)).min(1, 'Add at least one size').max(15),
    colors: z.array(colorInputSchema).min(1, 'Add at least one colour').max(20),
    variants: z
      .array(z.object({ color: z.string(), size: z.string(), stock: z.number().int().min(0).max(1_000_000) }))
      .max(300),
    featured: z.boolean().default(false),
    newArrival: z.boolean().default(false),
    status: z.enum(PRODUCT_STATUSES).default('active'),
  })
  .superRefine((p, ctx) => {
    if (p.salePrice !== null && p.salePrice >= p.price)
      ctx.addIssue({ code: 'custom', path: ['salePrice'], message: 'Sale price must be lower than the price' })
    const colorNames = p.colors.map((c) => c.name.toLowerCase())
    if (new Set(colorNames).size !== colorNames.length)
      ctx.addIssue({ code: 'custom', path: ['colors'], message: 'Colour names must be unique' })
    const sizes = p.sizes.map((s) => s.toUpperCase())
    if (new Set(sizes).size !== sizes.length)
      ctx.addIssue({ code: 'custom', path: ['sizes'], message: 'Sizes must be unique' })
  })

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name').max(60),
  slug: slug.or(z.literal('')).default(''),
  description: trimmed(300).default(''),
  imageId: objectId.nullable().default(null),
  sortOrder: z.number().int().min(0).max(1000).default(0),
})

export const settingsInputSchema = z.object({
  brandName: z.string().trim().min(1, 'Enter a brand name').max(40),
  tagline: trimmed(120),
  description: trimmed(300),
  whatsappNumber: z
    .string()
    .trim()
    .refine(isValidWhatsAppNumber, 'International format, digits only, e.g. 233599967302'),
  contact: z.object({
    email: z.string().trim().max(160).refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email'),
    phone: trimmed(40),
    location: trimmed(120),
    hours: trimmed(120),
  }),
  social: z.object({
    instagram: optionalUrl,
    tiktok: optionalUrl,
    snapchat: optionalUrl,
    x: optionalUrl,
    facebook: optionalUrl,
  }),
  deliveryFee: money.nullable(),
  deliveryInfo: trimmed(500),
  paymentInfo: trimmed(500),
  exchangesInfo: trimmed(500),
  heroHeading: trimmed(120),
  heroText: trimmed(300),
  heroImageId: objectId.nullable(),
  aboutHeading: trimmed(160),
  aboutBody: trimmed(4000),
  aboutImageId: objectId.nullable(),
  orderPrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,5}$/, 'Use 2–5 letters'),
  lowStockThreshold: z.number().int().min(0).max(1000),
  maxQuantityPerItem: z.number().int().min(1).max(99),
})

export const userUpdateSchema = z
  .object({ role: z.enum(['customer', 'admin']).optional(), disabled: z.boolean().optional(), password: passwordSchema.optional() })
  .refine((v) => v.role !== undefined || v.disabled !== undefined || v.password !== undefined, 'Nothing to update')

export type FieldErrors = Record<string, string>

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    if (!out[key]) out[key] = issue.message
  }
  return out
}

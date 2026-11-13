import 'server-only'
import { ObjectId } from 'mongodb'
import { cache } from 'react'
import type { z } from 'zod'
import type { StoreSettings } from '@/lib/types'
import type { settingsInputSchema } from '@/lib/validation'
import { collections } from '../db'
import type { SettingsDoc } from '../documents'
import { deleteUnreferencedImages, imageUrl } from './images'

const DEFAULTS: Omit<SettingsDoc, '_id' | 'updatedAt'> = {
  brandName: 'VELTRÉ',
  tagline: 'Dresses made to be noticed.',
  description: 'Bodycon, party and day dresses, rompers and playsuits. Hand-picked pieces, confirmed with you on WhatsApp.',
  whatsappNumber: '233599967302',
  contact: { email: '', phone: '+233 59 996 7302', location: '', hours: '' },
  social: { instagram: '', tiktok: '', snapchat: '', x: '', facebook: '' },
  deliveryFee: null,
  deliveryInfo: 'Delivery fee, timing and options are confirmed with you on WhatsApp after you order.',
  paymentInfo: 'No payment is taken on this website. Payment options are confirmed directly with you on WhatsApp after you place your order.',
  exchangesInfo: 'Questions about sizing or exchanges? Message us on WhatsApp and we will help.',
  heroHeading: 'Dresses made to be noticed.',
  heroText: 'Bodycon, party and day dresses, plus rompers and playsuits. Hand-picked pieces for every occasion.',
  heroImageId: null,
  aboutHeading: 'Hand-picked dresses for every occasion.',
  aboutBody:
    'We hand-pick every dress, romper and playsuit in our collection — from sleek bodycon and lace to easy day dresses and statement evening pieces.\n\nWe keep ordering personal. You choose your pieces, place your order, and we confirm everything with you directly on WhatsApp.',
  aboutImageId: null,
  orderPrefix: 'VLT',
  lowStockThreshold: 5,
  maxQuantityPerItem: 10,
}

export async function getSettingsDoc(): Promise<SettingsDoc> {
  const { settings } = await collections()
  const doc = await settings.findOne({ _id: 'store' })
  return { _id: 'store', updatedAt: new Date(0), ...DEFAULTS, ...doc, contact: { ...DEFAULTS.contact, ...doc?.contact }, social: { ...DEFAULTS.social, ...doc?.social } }
}

export function toStoreSettings(doc: SettingsDoc): StoreSettings {
  const { _id: _ignored, updatedAt: _u, heroImageId, aboutImageId, ...rest } = doc
  return {
    ...rest,
    heroImageId: heroImageId?.toHexString() ?? null,
    heroImage: imageUrl(heroImageId),
    aboutImageId: aboutImageId?.toHexString() ?? null,
    aboutImage: imageUrl(aboutImageId),
  }
}

export const getSettings = cache(async (): Promise<StoreSettings> => toStoreSettings(await getSettingsDoc()))

export async function updateSettings(input: z.infer<typeof settingsInputSchema>): Promise<StoreSettings> {
  const { settings } = await collections()
  const previous = await getSettingsDoc()
  const next = {
    ...input,
    heroImageId: input.heroImageId ? new ObjectId(input.heroImageId) : null,
    aboutImageId: input.aboutImageId ? new ObjectId(input.aboutImageId) : null,
    updatedAt: new Date(),
  }
  await settings.updateOne({ _id: 'store' }, { $set: next }, { upsert: true })
  const replaced = [previous.heroImageId, previous.aboutImageId].filter(
    (id): id is ObjectId => !!id && !id.equals(next.heroImageId ?? undefined) && !id.equals(next.aboutImageId ?? undefined),
  )
  await deleteUnreferencedImages(replaced)
  return toStoreSettings({ _id: 'store', ...next })
}

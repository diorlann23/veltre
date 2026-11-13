import 'server-only'
import { ObjectId } from 'mongodb'
import { cache } from 'react'
import type { z } from 'zod'
import { slugify } from '@/lib/slug'
import type { Category } from '@/lib/types'
import type { categoryInputSchema } from '@/lib/validation'
import { collections } from '../db'
import type { CategoryDoc } from '../documents'
import { conflict, notFound } from '../http'
import { deleteUnreferencedImages, imageUrl } from './images'

type CategoryInput = z.infer<typeof categoryInputSchema>

function toCategory(doc: CategoryDoc, productCount = 0): Category {
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    name: doc.name,
    description: doc.description,
    image: imageUrl(doc.imageId),
    imageId: doc.imageId?.toHexString() ?? null,
    sortOrder: doc.sortOrder,
    productCount,
  }
}

export const listCategories = cache(async (): Promise<Category[]> => {
  const { categories, products } = await collections()
  const [docs, counts] = await Promise.all([
    categories.find().sort({ sortOrder: 1, name: 1 }).toArray(),
    products
      .aggregate<{ _id: ObjectId; count: number }>([
        { $match: { status: 'active', categoryId: { $ne: null } } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ])
      .toArray(),
  ])
  const countMap = new Map(counts.map((c) => [c._id.toHexString(), c.count]))
  return docs.map((d) => toCategory(d, countMap.get(d._id.toHexString()) ?? 0))
})

async function uniqueSlug(base: string, excludeId?: ObjectId): Promise<string> {
  const { categories } = await collections()
  const root = base || 'collection'
  for (let i = 1; i < 100; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`
    const exists = await categories.findOne({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
    if (!exists) return candidate
  }
  throw conflict('Could not create a unique link for this collection.')
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { categories } = await collections()
  const now = new Date()
  const doc: CategoryDoc = {
    _id: new ObjectId(),
    slug: await uniqueSlug(input.slug || slugify(input.name)),
    name: input.name,
    description: input.description,
    imageId: input.imageId ? new ObjectId(input.imageId) : null,
    sortOrder: input.sortOrder,
    createdAt: now,
    updatedAt: now,
  }
  await categories.insertOne(doc)
  return toCategory(doc)
}

export async function updateCategory(id: ObjectId, input: CategoryInput): Promise<Category> {
  const { categories } = await collections()
  const existing = await categories.findOne({ _id: id })
  if (!existing) throw notFound('Collection not found.')
  const imageId = input.imageId ? new ObjectId(input.imageId) : null
  const update = {
    slug: await uniqueSlug(input.slug || slugify(input.name), id),
    name: input.name,
    description: input.description,
    imageId,
    sortOrder: input.sortOrder,
    updatedAt: new Date(),
  }
  await categories.updateOne({ _id: id }, { $set: update })
  if (existing.imageId && !existing.imageId.equals(imageId ?? undefined)) await deleteUnreferencedImages([existing.imageId])
  return toCategory({ ...existing, ...update })
}

export async function deleteCategory(id: ObjectId): Promise<void> {
  const { categories, products } = await collections()
  const existing = await categories.findOneAndDelete({ _id: id })
  if (!existing) throw notFound('Collection not found.')
  await products.updateMany({ categoryId: id }, { $set: { categoryId: null, updatedAt: new Date() } })
  if (existing.imageId) await deleteUnreferencedImages([existing.imageId])
}

import 'server-only'
import { ObjectId } from 'mongodb'
import { collections } from '../db'
import { badRequest } from '../http'

export const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024

const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  'image/avif': (b) => b.subarray(4, 12).toString('ascii').startsWith('ftypavi'),
}

export const imageUrl = (id: ObjectId | string | null | undefined) =>
  id ? `/api/images/${typeof id === 'string' ? id : id.toHexString()}` : null

export async function saveImage(dataUrl: string, uploadedBy: ObjectId) {
  const match = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl)
  if (!match) throw badRequest('Upload a JPG, PNG, WebP or AVIF image.')
  const mimeType = match[1]
  const check = SIGNATURES[mimeType]
  if (!check) throw badRequest('Upload a JPG, PNG, WebP or AVIF image.')
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length === 0 || !check(buffer)) throw badRequest('The file is not a valid image.')
  if (buffer.length > MAX_IMAGE_BYTES) throw badRequest('Image is too large. Please use an image under 2.5 MB.')

  const { images } = await collections()
  const _id = new ObjectId()
  await images.insertOne({
    _id,
    data: buffer.toString('base64'),
    mimeType,
    size: buffer.length,
    uploadedBy,
    createdAt: new Date(),
  })
  return { id: _id.toHexString(), url: imageUrl(_id) as string }
}

export async function readImage(id: ObjectId) {
  const { images } = await collections()
  const doc = await images.findOne({ _id: id })
  if (!doc) return null
  return { buffer: Buffer.from(doc.data, 'base64'), mimeType: doc.mimeType }
}

export async function deleteUnreferencedImages(ids: ObjectId[]) {
  if (ids.length === 0) return
  const { images, products, categories, settings, orders } = await collections()
  const [p, c, s, o] = await Promise.all([
    products.find({ $or: [{ imageIds: { $in: ids } }, { 'colors.imageIds': { $in: ids } }] }, { projection: { imageIds: 1, colors: 1 } }).toArray(),
    categories.find({ imageId: { $in: ids } }, { projection: { imageId: 1 } }).toArray(),
    settings.find({ $or: [{ heroImageId: { $in: ids } }, { aboutImageId: { $in: ids } }] }).toArray(),
    orders.distinct('items.imageId', { 'items.imageId': { $in: ids } }),
  ])
  const used = new Set<string>()
  p.forEach((d) => [...d.imageIds, ...d.colors.flatMap((col) => col.imageIds)].forEach((i) => used.add(i.toHexString())))
  c.forEach((d) => d.imageId && used.add(d.imageId.toHexString()))
  s.forEach((d) => [d.heroImageId, d.aboutImageId].forEach((i) => i && used.add(i.toHexString())))
  o.forEach((i) => i && used.add((i as ObjectId).toHexString()))
  const removable = ids.filter((id) => !used.has(id.toHexString()))
  if (removable.length) await images.deleteMany({ _id: { $in: removable } })
}

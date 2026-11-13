import 'server-only'
import { collections } from './db'
import { HttpError } from './http'

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<void> {
  const { rateLimits } = await collections()
  const now = Date.now()
  const doc = await rateLimits.findOneAndUpdate(
    { _id: key, expiresAt: { $gt: new Date(now) } },
    { $inc: { count: 1 } },
    { returnDocument: 'after' },
  )
  if (doc) {
    if (doc.count > limit) {
      const retry = Math.max(1, Math.ceil((doc.expiresAt.getTime() - now) / 60000))
      throw new HttpError(429, `Too many attempts. Please try again in ${retry} minute${retry === 1 ? '' : 's'}.`)
    }
    return
  }
  await rateLimits.updateOne(
    { _id: key },
    { $set: { count: 1, expiresAt: new Date(now + windowSeconds * 1000) } },
    { upsert: true },
  )
}

export async function resetRateLimit(key: string): Promise<void> {
  const { rateLimits } = await collections()
  await rateLimits.deleteOne({ _id: key })
}

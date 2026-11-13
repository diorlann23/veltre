import { z } from 'zod'
import { requireAdmin } from '@/server/auth'
import { ok, readJson, route } from '@/server/http'
import { rateLimit } from '@/server/rate-limit'
import { saveImage } from '@/server/repos/images'

const schema = z.object({ data: z.string().min(20).max(3_600_000) })

export const POST = route(async (req) => {
  const admin = await requireAdmin(req)
  await rateLimit(`upload:${admin._id.toHexString()}`, 200, 60 * 60)
  const { data } = await readJson(req, schema)
  return ok(await saveImage(data, admin._id), { status: 201 })
})

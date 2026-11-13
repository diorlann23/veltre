import { userUpdateSchema } from '@/lib/validation'
import { requireAdmin } from '@/server/auth'
import { ok, readJson, route, toObjectId } from '@/server/http'
import { updateUserByAdmin } from '@/server/repos/users'

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const admin = await requireAdmin(req)
  const input = await readJson(req, userUpdateSchema)
  return ok({ customer: await updateUserByAdmin(toObjectId((await params).id), admin._id, input) })
})

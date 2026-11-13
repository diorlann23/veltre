import { profileSchema } from '@/lib/validation'
import { requireUser, toPublicUser } from '@/server/auth'
import { ok, readJson, route } from '@/server/http'
import { updateProfile } from '@/server/repos/users'

export const GET = route(async (req) => ok({ user: toPublicUser(await requireUser(req)) }))

export const PATCH = route(async (req) => {
  const user = await requireUser(req)
  const input = await readJson(req, profileSchema)
  return ok({ user: toPublicUser(await updateProfile(user._id, input)) })
})

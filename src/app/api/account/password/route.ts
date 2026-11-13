import { changePasswordSchema } from '@/lib/validation'
import { SESSION_COOKIE, destroyOtherSessions, requireUser } from '@/server/auth'
import { ok, readJson, route } from '@/server/http'
import { rateLimit } from '@/server/rate-limit'
import { changePassword } from '@/server/repos/users'

export const POST = route(async (req) => {
  const user = await requireUser(req)
  await rateLimit(`password:${user._id.toHexString()}`, 10, 15 * 60)
  const input = await readJson(req, changePasswordSchema)
  await changePassword(user, input.currentPassword, input.newPassword)
  await destroyOtherSessions(user._id, req.cookies.get(SESSION_COOKIE)?.value)
  return ok({ ok: true })
})

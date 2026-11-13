import { loginSchema } from '@/lib/validation'
import { createSession, sessionCookie, toPublicUser } from '@/server/auth'
import { HttpError, clientIp, ok, readJson, route } from '@/server/http'
import { rateLimit, resetRateLimit } from '@/server/rate-limit'
import { authenticate } from '@/server/repos/users'

export const POST = route(async (req) => {
  const input = await readJson(req, loginSchema)
  await rateLimit(`login-ip:${clientIp(req)}`, 30, 15 * 60)
  await rateLimit(`login:${input.email}`, 8, 15 * 60)
  const user = await authenticate(input.email, input.password)
  if (!user) throw new HttpError(401, 'Incorrect email or password.')
  await resetRateLimit(`login:${input.email}`)
  const session = await createSession(user._id)
  const res = ok({ user: toPublicUser(user) })
  res.cookies.set(sessionCookie(session.token, session.expiresAt))
  return res
})

import { registerSchema } from '@/lib/validation'
import { createSession, sessionCookie, toPublicUser } from '@/server/auth'
import { clientIp, ok, readJson, route } from '@/server/http'
import { rateLimit } from '@/server/rate-limit'
import { registerUser } from '@/server/repos/users'

export const POST = route(async (req) => {
  await rateLimit(`register:${clientIp(req)}`, 10, 60 * 60)
  const input = await readJson(req, registerSchema)
  const user = await registerUser(input)
  const session = await createSession(user._id)
  const res = ok({ user: toPublicUser(user) }, { status: 201 })
  res.cookies.set(sessionCookie(session.token, session.expiresAt))
  return res
})

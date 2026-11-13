import { SESSION_COOKIE, toPublicUser, userFromToken } from '@/server/auth'
import { ok, route } from '@/server/http'

export const GET = route(async (req) => {
  const user = await userFromToken(req.cookies.get(SESSION_COOKIE)?.value)
  return ok({ user: user ? toPublicUser(user) : null }, { headers: { 'Cache-Control': 'no-store' } })
})

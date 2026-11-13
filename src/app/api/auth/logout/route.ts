import { SESSION_COOKIE, clearedSessionCookie, destroySession } from '@/server/auth'
import { ok, route } from '@/server/http'

export const POST = route(async (req) => {
  await destroySession(req.cookies.get(SESSION_COOKIE)?.value)
  const res = ok({ ok: true })
  res.cookies.set(clearedSessionCookie())
  return res
})

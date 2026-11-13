import { requireAdmin } from '@/server/auth'
import { ok, route } from '@/server/http'
import { listCustomers } from '@/server/repos/users'

export const GET = route(async (req) => {
  await requireAdmin(req)
  const sp = req.nextUrl.searchParams
  return ok(await listCustomers({ q: sp.get('q') ?? '', page: Number(sp.get('page')) || 1 }))
})

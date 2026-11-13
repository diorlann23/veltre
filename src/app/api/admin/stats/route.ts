import { requireAdmin } from '@/server/auth'
import { ok, route } from '@/server/http'
import { dashboardStats } from '@/server/repos/stats'

export const GET = route(async (req) => {
  await requireAdmin(req)
  return ok(await dashboardStats(), { headers: { 'Cache-Control': 'no-store' } })
})

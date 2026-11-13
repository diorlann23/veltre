import { requireUser } from '@/server/auth'
import { ok, route } from '@/server/http'
import { cancelOwnOrder } from '@/server/repos/orders'

export const POST = route<{ number: string }>(async (req, { params }) => {
  const user = await requireUser(req)
  const { number } = await params
  return ok({ order: await cancelOwnOrder(user, number) })
})

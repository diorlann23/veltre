import { updateOrderSchema } from '@/lib/validation'
import { requireAdmin, requireUser } from '@/server/auth'
import { forbidden, notFound, ok, readJson, route, toObjectId } from '@/server/http'
import { getOrderById, updateOrder } from '@/server/repos/orders'

type Params = { id: string }

export const GET = route<Params>(async (req, { params }) => {
  const user = await requireUser(req)
  const order = await getOrderById(toObjectId((await params).id))
  if (!order) throw notFound('Order not found.')
  if (user.role !== 'admin' && order.userId !== user._id.toHexString()) throw forbidden()
  return ok({ order })
})

export const PATCH = route<Params>(async (req, { params }) => {
  const admin = await requireAdmin(req)
  const input = await readJson(req, updateOrderSchema)
  return ok({ order: await updateOrder(toObjectId((await params).id), input, admin._id) })
})

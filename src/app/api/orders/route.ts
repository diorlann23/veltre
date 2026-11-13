import { createOrderSchema } from '@/lib/validation'
import { orderMessage, whatsappUrl } from '@/lib/whatsapp'
import { requireUser } from '@/server/auth'
import { siteUrlFromRequest } from '@/server/env'
import { ok, readJson, route } from '@/server/http'
import { rateLimit } from '@/server/rate-limit'
import { createOrder, listAdminOrders, listUserOrders } from '@/server/repos/orders'
import { getSettings } from '@/server/repos/settings'

export const GET = route(async (req) => {
  const user = await requireUser(req)
  const sp = req.nextUrl.searchParams
  if (user.role === 'admin' && sp.get('scope') === 'all') {
    return ok(await listAdminOrders({ status: sp.get('status') ?? '', q: sp.get('q') ?? '', page: Number(sp.get('page')) || 1 }))
  }
  return ok({ orders: await listUserOrders(user._id) })
})

export const POST = route(async (req) => {
  const user = await requireUser(req)
  await rateLimit(`order:${user._id.toHexString()}`, 20, 60 * 60)
  const input = await readJson(req, createOrderSchema)
  const order = await createOrder(user, input)
  const settings = await getSettings()
  const message = orderMessage(order, settings.brandName, `${siteUrlFromRequest(req)}/admin/orders/${order.id}`)
  return ok({ order, whatsappUrl: whatsappUrl(settings.whatsappNumber, message), message }, { status: 201 })
})

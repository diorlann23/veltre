import { cartSchema } from '@/lib/validation'
import { requireUser } from '@/server/auth'
import { ok, readJson, route } from '@/server/http'
import { getCart, saveCart } from '@/server/repos/carts'

export const GET = route(async (req) => {
  const user = await requireUser(req)
  return ok({ items: await getCart(user._id) }, { headers: { 'Cache-Control': 'no-store' } })
})

export const PUT = route(async (req) => {
  const user = await requireUser(req)
  const { items } = await readJson(req, cartSchema)
  return ok({ items: await saveCart(user._id, items) })
})

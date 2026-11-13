import { cartSchema } from '@/lib/validation'
import { ok, readJson, route } from '@/server/http'
import { quoteCart } from '@/server/repos/carts'

export const POST = route(async (req) => {
  const { items } = await readJson(req, cartSchema)
  return ok(await quoteCart(items), { headers: { 'Cache-Control': 'no-store' } })
})

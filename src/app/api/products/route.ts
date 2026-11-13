import { parseCatalogQuery } from '@/lib/catalog'
import { productInputSchema } from '@/lib/validation'
import { requireAdmin } from '@/server/auth'
import { ok, readJson, route } from '@/server/http'
import { createProduct, searchProducts } from '@/server/repos/products'

export const GET = route(async (req) => ok(await searchProducts(parseCatalogQuery(req.nextUrl.searchParams))))

export const POST = route(async (req) => {
  await requireAdmin(req)
  const input = await readJson(req, productInputSchema)
  return ok({ product: await createProduct(input) }, { status: 201 })
})

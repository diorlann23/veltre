import { productInputSchema } from '@/lib/validation'
import { requireAdmin } from '@/server/auth'
import { notFound, ok, readJson, route, toObjectId } from '@/server/http'
import { deleteProduct, getAdminProduct, updateProduct } from '@/server/repos/products'

type Params = { id: string }

export const GET = route<Params>(async (req, { params }) => {
  await requireAdmin(req)
  const product = await getAdminProduct(toObjectId((await params).id))
  if (!product) throw notFound('Product not found.')
  return ok({ product })
})

export const PUT = route<Params>(async (req, { params }) => {
  await requireAdmin(req)
  const id = toObjectId((await params).id)
  const input = await readJson(req, productInputSchema)
  return ok({ product: await updateProduct(id, input) })
})

export const DELETE = route<Params>(async (req, { params }) => {
  await requireAdmin(req)
  await deleteProduct(toObjectId((await params).id))
  return ok({ ok: true })
})

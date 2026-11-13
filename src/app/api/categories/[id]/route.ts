import { categoryInputSchema } from '@/lib/validation'
import { requireAdmin } from '@/server/auth'
import { ok, readJson, route, toObjectId } from '@/server/http'
import { deleteCategory, updateCategory } from '@/server/repos/categories'

type Params = { id: string }

export const PUT = route<Params>(async (req, { params }) => {
  await requireAdmin(req)
  const id = toObjectId((await params).id)
  const input = await readJson(req, categoryInputSchema)
  return ok({ category: await updateCategory(id, input) })
})

export const DELETE = route<Params>(async (req, { params }) => {
  await requireAdmin(req)
  await deleteCategory(toObjectId((await params).id))
  return ok({ ok: true })
})

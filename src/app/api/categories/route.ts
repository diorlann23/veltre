import { categoryInputSchema } from '@/lib/validation'
import { requireAdmin } from '@/server/auth'
import { ok, readJson, route } from '@/server/http'
import { createCategory, listCategories } from '@/server/repos/categories'

export const GET = route(async () => ok({ categories: await listCategories() }))

export const POST = route(async (req) => {
  await requireAdmin(req)
  const input = await readJson(req, categoryInputSchema)
  return ok({ category: await createCategory(input) }, { status: 201 })
})

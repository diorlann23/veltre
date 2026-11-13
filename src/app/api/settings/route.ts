import { settingsInputSchema } from '@/lib/validation'
import { requireAdmin } from '@/server/auth'
import { ok, readJson, route } from '@/server/http'
import { getSettings, updateSettings } from '@/server/repos/settings'

export const GET = route(async () => ok({ settings: await getSettings() }))

export const PUT = route(async (req) => {
  await requireAdmin(req)
  const input = await readJson(req, settingsInputSchema)
  return ok({ settings: await updateSettings(input) })
})

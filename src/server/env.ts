import 'server-only'
import { headers } from 'next/headers'
import { z } from 'zod'
import { resolveSiteUrl } from '@/lib/site-url'

const schema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is not set'),
  MONGODB_DB: z.string().min(1).default('veltre'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_EMAILS: z.string().default(''),
  NODE_ENV: z.string().default('development'),
})

let cached: z.infer<typeof schema> | null = null

export function env() {
  if (!cached) {
    const parsed = schema.safeParse(process.env)
    if (!parsed.success) throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => i.message).join(', ')}`)
    cached = parsed.data
  }
  return cached
}

export function adminEmails(): string[] {
  return env()
    .ADMIN_EMAILS.split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export const isProduction = () => env().NODE_ENV === 'production'

type HeaderSource = { get(name: string): string | null }

const fromHeaders = (h: HeaderSource) =>
  resolveSiteUrl(env().APP_URL, h.get('x-forwarded-host') ?? h.get('host'), h.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? null)

export const siteUrlFromRequest = (req: { headers: HeaderSource }) => fromHeaders(req.headers)

export async function siteUrl(): Promise<string> {
  return fromHeaders(await headers())
}

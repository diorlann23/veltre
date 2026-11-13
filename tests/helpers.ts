import { inject } from 'vitest'
import { NextRequest } from 'next/server'

process.env.MONGODB_URI = inject('mongoUri')
process.env.APP_URL = 'http://localhost:3000'
process.env.ADMIN_EMAILS = 'owner@veltre.test'

export const ORIGIN = 'http://localhost:3000'

type Handler<P> = (req: NextRequest, ctx: { params: Promise<P> }) => Promise<Response>

interface CallOptions<P> {
  body?: unknown
  cookie?: string
  origin?: string | null
  params?: P
  ip?: string
  host?: string
}

export async function call<P>(handler: Handler<P>, method: string, path: string, opts: CallOptions<P> = {}) {
  const host = opts.host ?? 'localhost:3000'
  const headers = new Headers({ host, 'x-forwarded-for': opts.ip ?? '10.0.0.1' })
  if (opts.host) headers.set('x-forwarded-proto', 'https')
  if (opts.origin !== null) headers.set('origin', opts.origin ?? (opts.host ? `https://${opts.host}` : ORIGIN))
  if (opts.cookie) headers.set('cookie', opts.cookie)
  if (opts.body !== undefined) headers.set('content-type', 'application/json')
  const req = new NextRequest(`${ORIGIN}${path}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })
  const res = await handler(req, { params: Promise.resolve((opts.params ?? {}) as P) })
  const text = await res.text()
  let json: Record<string, unknown> = {}
  try {
    json = JSON.parse(text)
  } catch {
    json = {}
  }
  const setCookie = res.headers.get('set-cookie') ?? ''
  const cookie = /veltre_session=([^;]*)/.exec(setCookie)?.[1]
  return { status: res.status, json, cookie: cookie ? `veltre_session=${cookie}` : undefined, headers: res.headers }
}

export const PNG_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

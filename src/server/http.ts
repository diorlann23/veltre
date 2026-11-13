import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { ZodError } from 'zod'
import { fieldErrors } from '@/lib/validation'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message)
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) => new HttpError(400, message, fields)
export const unauthorized = (message = 'Please log in to continue.') => new HttpError(401, message)
export const forbidden = (message = 'You do not have access to this.') => new HttpError(403, message)
export const notFound = (message = 'Not found.') => new HttpError(404, message)
export const conflict = (message: string, fields?: Record<string, string>) => new HttpError(409, message, fields)

type RouteContext<P> = { params: Promise<P> }
type Handler<P> = (req: NextRequest, ctx: RouteContext<P>) => Promise<Response>

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function assertSameOrigin(req: NextRequest) {
  if (!MUTATING.has(req.method)) return
  const origin = req.headers.get('origin')
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (!origin || !host) throw forbidden('Cross-site request blocked.')
  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    throw forbidden('Cross-site request blocked.')
  }
  if (originHost !== host) throw forbidden('Cross-site request blocked.')
}

export function route<P = Record<string, never>>(fn: Handler<P>): Handler<P> {
  return async (req, ctx) => {
    try {
      assertSameOrigin(req)
      return await fn(req, ctx)
    } catch (err) {
      return errorResponse(err)
    }
  }
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message, fields: err.fields }, { status: err.status })
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: 'Please check the highlighted fields.', fields: fieldErrors(err) }, { status: 400 })
  }
  console.error(err)
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}

export async function readJson<T>(req: NextRequest, schema: { parse: (value: unknown) => T }): Promise<T> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw badRequest('Invalid request body.')
  }
  return schema.parse(body)
}

export function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id) || !/^[a-f0-9]{24}$/i.test(id)) throw notFound()
  return new ObjectId(id)
}

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init)

import { NextResponse } from 'next/server'
import { route, toObjectId } from '@/server/http'
import { readImage } from '@/server/repos/images'

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const id = toObjectId((await params).id)
  const image = await readImage(id)
  if (!image) return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } })
  return new NextResponse(new Uint8Array(image.buffer), {
    headers: {
      'Content-Type': image.mimeType,
      'Content-Length': String(image.buffer.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: `"${id.toHexString()}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  })
})

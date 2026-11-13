import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/checkout', '/account', '/admin']

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !req.cookies.has('veltre_session')) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/checkout/:path*', '/account/:path*', '/admin/:path*'],
}

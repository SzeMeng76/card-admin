import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const intlMiddleware = createMiddleware({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'always',
})

const PUBLIC_PATHS = ['/login']
const ADMIN_PATHS = ['/dashboard']
const USER_PATHS = ['/portal']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Strip locale prefix for path checks
  const pathWithoutLocale = pathname.replace(/^\/(zh|en)/, '') || '/'

  const isPublic = PUBLIC_PATHS.some(p => pathWithoutLocale.startsWith(p))
  const isRoot = pathWithoutLocale === '/'

  const token = request.cookies.get('token')?.value
  const locale = pathname.split('/')[1] || 'zh'

  if (isRoot) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  if (!isPublic) {
    if (!token) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'changeme')
      const { payload } = await jwtVerify(token, secret)
      const role = payload.role as string

      const isAdminPath = ADMIN_PATHS.some(p => pathWithoutLocale.startsWith(p))
      const isUserPath = USER_PATHS.some(p => pathWithoutLocale.startsWith(p))

      if (isAdminPath && role !== 'admin') {
        return NextResponse.redirect(new URL(`/${locale}/portal`, request.url))
      }
      if (isUserPath && role === 'admin') {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
      }
    } catch {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/(zh|en)/:path*', '/'],
}

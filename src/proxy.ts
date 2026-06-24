import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'always',
})

const PUBLIC_PATHS = ['/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const pathWithoutLocale = pathname.replace(/^\/(zh|en)/, '') || '/'
  const isPublic = PUBLIC_PATHS.some(p => pathWithoutLocale.startsWith(p))
  const isRoot = pathWithoutLocale === '/'
  const locale = pathname.split('/')[1] || 'zh'

  if (isRoot) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  if (!isPublic) {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/(zh|en)/:path*', '/'],
}

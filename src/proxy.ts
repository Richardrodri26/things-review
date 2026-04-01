import { NextRequest, NextResponse } from 'next/server'
import { LOCALE_COOKIE, locales, type Locale } from '@/i18n/config'

// Rutas que no requieren sesión
const PUBLIC_PATHS = ['/login', '/register', '/api/auth']

function parseAcceptLanguage(acceptLanguage: string): Locale | null {
  const languages = acceptLanguage
    .split(',')
    .map((part) => {
      const [lang, q] = part.trim().split(';q=')
      return { lang: lang.split('-')[0].toLowerCase(), q: q ? parseFloat(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { lang } of languages) {
    if (locales.includes(lang as Locale)) {
      return lang as Locale
    }
  }
  return null
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Auth guard: redirigir a /login si no hay sesión en rutas protegidas
  if (!PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const sessionToken =
      request.cookies.get('better-auth.session_token') ??
      request.cookies.get('__Secure-better-auth.session_token')

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // i18n: detectar idioma preferido del navegador y persistirlo en cookie
  const response = NextResponse.next()
  const existingCookie = request.cookies.get(LOCALE_COOKIE)?.value
  if (!existingCookie || !locales.includes(existingCookie as Locale)) {
    const acceptLanguage = request.headers.get('accept-language') ?? ''
    const detected = parseAcceptLanguage(acceptLanguage)
    if (detected) {
      response.cookies.set(LOCALE_COOKIE, detected, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        // Security: next-intl reads this cookie server-side only — httpOnly prevents
        // client-side JS from reading or tampering with the locale preference
        httpOnly: true,
      })
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (imágenes optimizadas)
     * - favicon.ico, imágenes en /public
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { NextRequest, NextResponse } from 'next/server'
import { LOCALE_COOKIE, locales, type Locale } from '@/i18n/config'

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
  const response = NextResponse.next()

  // Only set the cookie if it hasn't been set by the user already
  const existingCookie = request.cookies.get(LOCALE_COOKIE)?.value
  if (!existingCookie || !locales.includes(existingCookie as Locale)) {
    const acceptLanguage = request.headers.get('accept-language') ?? ''
    const detected = parseAcceptLanguage(acceptLanguage)
    if (detected) {
      response.cookies.set(LOCALE_COOKIE, detected, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}

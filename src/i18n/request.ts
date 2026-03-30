import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { locales, defaultLocale, LOCALE_COOKIE, type Locale } from '@/i18n/config'

function parseAcceptLanguage(acceptLanguage: string): Locale | null {
  // Parse "es-AR,es;q=0.9,en;q=0.8" and return the first matching supported locale
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

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  // 1. Cookie set explicitly by the user (locale selector)
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    const locale = cookieLocale as Locale
    return {
      locale,
      messages: (await import(`../../messages/${locale}.json`)).default,
    }
  }

  // 2. Browser Accept-Language header
  const acceptLanguage = headerStore.get('accept-language') ?? ''
  const detectedLocale = parseAcceptLanguage(acceptLanguage)
  const locale = detectedLocale ?? defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})

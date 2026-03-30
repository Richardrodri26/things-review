'use server'

import { cookies } from 'next/headers'
import { LOCALE_COOKIE, locales, type Locale } from '@/i18n/config'

export async function setLocale(locale: Locale): Promise<void> {
  if (!locales.includes(locale)) return

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
}

import { getRequestConfig } from 'next-intl/server'

const locales = ['en', 'es'] as const
const defaultLocale = 'en'

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale is a Promise<string | undefined> in next-intl v4
  let locale = await requestLocale

  // Fallback to default if locale is undefined or not supported
  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    locale = defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})

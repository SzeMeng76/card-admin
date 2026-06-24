import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? 'zh'
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})

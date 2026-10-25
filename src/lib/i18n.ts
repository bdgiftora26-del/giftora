import en from '@/messages/en.json'
import bn from '@/messages/bn.json'

export const messages = { en, bn } as const
export type Locale = 'en' | 'bn'
export const defaultLocale: Locale = 'en'
export const locales: Locale[] = ['en', 'bn']

export function loadMessages(locale: Locale) {
  return messages[locale] ?? messages.en
}

// Dot-path lookup with {param} interpolation.
export function translate(
  messages: Record<string, unknown>,
  path: string,
  params?: Record<string, string | number>,
): string {
  const parts = path.split('.')
  let cur: unknown = messages
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return path
    }
  }
  let str = typeof cur === 'string' ? cur : path
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return str
}

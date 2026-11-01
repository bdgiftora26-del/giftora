// Currency context helpers. Rates live in DB (Currency table). Client reads via /api/currency/rates.

import { db } from '@/lib/db'
import { toNumber } from '@/lib/money'
import type { CurrencyInfo } from '@/lib/money'
import { cached } from '@/lib/cache'
import { tag, bustCurrencies } from '@/lib/cache-tags'

// Re-export so callers (e.g. admin currency mutation handlers) can bust the
// cache after a rate update.
export { bustCurrencies }

export async function getCurrencies(): Promise<CurrencyInfo[]> {
  return cached('currencies', [tag.currencies()], 5 * 60_000, async () => {
    const rows = await db.currency.findMany({ where: { isActive: true } })
    return rows.map((r) => ({
      code: r.code,
      symbol: r.symbol,
      name: r.name,
      rateFromBdt: toNumber(r.rateFromBdt),
    }))
  })
}

export async function getCurrency(code: string): Promise<CurrencyInfo> {
  const all = await getCurrencies()
  return all.find((c) => c.code === code) ?? all[0] ?? { code: 'USD', symbol: '$', name: 'US Dollar', rateFromBdt: 0.0091 }
}

export function currencyFromCookie(cookieValue?: string): string {
  if (cookieValue && ['USD', 'BDT', 'GBP', 'AUD', 'CAD', 'EUR'].includes(cookieValue)) {
    return cookieValue
  }
  return 'USD'
}

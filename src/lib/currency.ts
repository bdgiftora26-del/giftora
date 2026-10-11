// Currency context helpers. Rates live in DB (Currency table). Client reads via /api/currency/rates.

import { db } from '@/lib/db'
import { toNumber } from '@/lib/money'
import type { CurrencyInfo } from '@/lib/money'

const cache: { data: CurrencyInfo[] | null; ts: number } = { data: null, ts: 0 }
const TTL = 60_000 // 1 min in-memory cache

export async function getCurrencies(): Promise<CurrencyInfo[]> {
  if (cache.data && Date.now() - cache.ts < TTL) return cache.data
  const rows = await db.currency.findMany({ where: { isActive: true } })
  const data: CurrencyInfo[] = rows.map((r) => ({
    code: r.code,
    symbol: r.symbol,
    name: r.name,
    rateFromBdt: toNumber(r.rateFromBdt),
  }))
  cache.data = data
  cache.ts = Date.now()
  return data
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

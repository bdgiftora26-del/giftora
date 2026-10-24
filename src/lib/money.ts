// Money helpers. All prices stored in BDT; converted for display via Currency.rateFromBdt.
// NOTE: do NOT import from @prisma/client here — this module is used in client components.

type DecimalLike = { toNumber(): number }

export type MoneyInput = number | string | DecimalLike

export function toNumber(v: MoneyInput): number {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'string') return parseFloat(v) || 0
  if (typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber()
  return Number(v) || 0
}

export function bdt(v: MoneyInput): number {
  return Math.round(toNumber(v) * 100) / 100
}

export function convertFromBdt(bdtAmount: MoneyInput, rateFromBdt: MoneyInput): number {
  const amt = toNumber(bdtAmount)
  const rate = toNumber(rateFromBdt)
  if (!rate || rate <= 0) return amt
  // rateFromBdt = "1 BDT = X foreign currency", so foreign = bdt × rate
  return Math.round(amt * rate * 100) / 100
}

export type CurrencyInfo = {
  code: string
  symbol: string
  name: string
  rateFromBdt: number
}

const CURRENCY_PREFIX: Record<string, string> = {
  USD: 'US $',
  BDT: 'BDT ৳',
  GBP: 'GBP £',
  AUD: 'AUD $',
  CAD: 'CAD $',
  EUR: 'EUR €',
}

export function formatPrice(amount: number, currency: CurrencyInfo): string {
  const prefix = CURRENCY_PREFIX[currency.code] ?? `${currency.code} `
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${prefix}${formatted}`
}

export function formatBdt(amount: MoneyInput): string {
  const n = toNumber(amount)
  return `BDT ৳${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

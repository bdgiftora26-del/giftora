'use client'

import { useCurrency } from '@/components/providers'
import { convertFromBdt, formatPrice } from '@/lib/money'

export function Price({ bdt, className }: { bdt: number; className?: string }) {
  const { currency } = useCurrency()
  if (!currency) return <span className={className}>…</span>
  const amount = convertFromBdt(bdt, currency.rateFromBdt)
  return <span className={className}>{formatPrice(amount, currency)}</span>
}

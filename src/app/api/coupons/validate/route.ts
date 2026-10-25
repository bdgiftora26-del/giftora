import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toNumber } from '@/lib/money'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { code, subtotalBdt } = await req.json().catch(() => ({}))
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const coupon = await db.coupon.findUnique({ where: { code: String(code).toUpperCase().trim() } })
  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
  }
  const now = new Date()
  if (coupon.startsAt && now < coupon.startsAt) {
    return NextResponse.json({ error: 'Coupon not yet active' }, { status: 400 })
  }
  if (coupon.endsAt && now > coupon.endsAt) {
    return NextResponse.json({ error: 'Coupon expired' }, { status: 400 })
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 })
  }
  const subtotal = toNumber(subtotalBdt || 0)
  if (coupon.minOrderBdt && subtotal < toNumber(coupon.minOrderBdt)) {
    return NextResponse.json(
      { error: `Minimum order ৳${toNumber(coupon.minOrderBdt)} required` },
      { status: 400 },
    )
  }
  return NextResponse.json({
    code: coupon.code,
    kind: coupon.kind,
    value: toNumber(coupon.value),
  })
}

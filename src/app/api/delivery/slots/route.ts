import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const cityId = searchParams.get('cityId')

  if (!date) return NextResponse.json({ slots: [] })

  // Slot rules: specific city first, then generic (cityId null)
  const where = cityId
    ? { isActive: true, OR: [{ cityId: Number(cityId) }, { cityId: null }] }
    : { isActive: true, cityId: null }
  const rules = await db.deliverySlotRule.findMany({ where, orderBy: { startTime: 'asc' } })

  // Deduplicate by label, preferring city-specific
  const seen = new Set<string>()
  const slots: string[] = []
  for (const r of rules) {
    if (!seen.has(r.label)) {
      seen.add(r.label)
      slots.push(r.label)
    }
  }

  return NextResponse.json({ slots })
}

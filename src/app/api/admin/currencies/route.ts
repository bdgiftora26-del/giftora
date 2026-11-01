import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { toNumber } from '@/lib/money'

export const dynamic = 'force-dynamic'

// List all currencies
export async function GET() {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currencies = await db.currency.findMany({ orderBy: { code: 'asc' } })
  return NextResponse.json({
    currencies: currencies.map((c) => ({
      code: c.code,
      symbol: c.symbol,
      name: c.name,
      rateFromBdt: toNumber(c.rateFromBdt),
      isActive: c.isActive,
    })),
  })
}

// Update currency rate
export async function PATCH(req: Request) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code, rateFromBdt, isActive } = await req.json()
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const update: any = {}
  if (rateFromBdt !== undefined) update.rateFromBdt = Number(rateFromBdt)
  if (isActive !== undefined) update.isActive = isActive
  update.updatedAt = new Date()

  await db.currency.update({ where: { code }, data: update })
  return NextResponse.json({ ok: true })
}

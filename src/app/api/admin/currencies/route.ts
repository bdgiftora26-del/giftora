import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { toNumber } from '@/lib/money'
import { cached } from '@/lib/cache'
import { tag, TTL as CACHE_TTL, bustCurrencies } from '@/lib/cache-tags'

export const dynamic = 'force-dynamic'

// List all currencies (admin). Cached under `currencies`.
export async function GET() {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await cached('admin:currencies', [tag.currencies()], CACHE_TTL.ADMIN_BANNERS, async () => {
    const currencies = await db.currency.findMany({ orderBy: { code: 'asc' } })
    return {
      currencies: currencies.map((c) => ({
        code: c.code,
        symbol: c.symbol,
        name: c.name,
        rateFromBdt: toNumber(c.rateFromBdt),
        isActive: c.isActive,
      })),
    }
  })
  return NextResponse.json(payload)
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
  // Bust both public + admin currency caches.
  bustCurrencies()
  return NextResponse.json({ ok: true })
}

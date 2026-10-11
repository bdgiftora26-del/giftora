import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')
  const where: { parentId: null; isActive: boolean; cityId?: number | null } = {
    parentId: null,
    isActive: true,
  }
  if (city) {
    const cityRow = await db.city.findUnique({ where: { slug: city } })
    if (cityRow) where.cityId = cityRow.id
  }
  const rows = await db.category.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: { i18n: true },
  })
  return NextResponse.json({
    categories: rows.map((c) => {
      const en = c.i18n.find((i) => i.locale === 'en')
      return {
        id: c.id,
        slug: c.slug,
        name: en?.name || c.slug,
        icon: c.icon,
        href: `/${c.slug}`,
      }
    }),
  })
}

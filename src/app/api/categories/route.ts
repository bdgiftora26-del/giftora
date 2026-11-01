import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cached, cacheKey } from '@/lib/cache'
import { tag, TTL as CACHE_TTL } from '@/lib/cache-tags'

export const dynamic = 'force-dynamic'

// Public sidebar category list. Cached under `category` tag (15 min).
// Invalidation: any category mutation → bustCategory() drops this.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city') || ''
  const key = cacheKey('categories:public', { city })
  const payload = await cached(key, [tag.category()], CACHE_TTL.CATEGORY_LIST, () =>
    loadCategories(city),
  )
  return NextResponse.json(payload)
}

async function loadCategories(city: string) {
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
  return {
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
  }
}

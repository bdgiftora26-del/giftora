import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toNumber } from '@/lib/money'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const city = searchParams.get('city')
  const sort = searchParams.get('sort') || 'default'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const perPage = 48

  let categoryIds: number[] = []
  if (category) {
    const cat = await db.category.findFirst({ where: { slug: category } })
    if (cat) {
      const collect = async (pid: number): Promise<number[]> => {
        const children = await db.category.findMany({ where: { parentId: pid } })
        const ids = [pid]
        for (const c of children) ids.push(...(await collect(c.id)))
        return ids
      }
      categoryIds = await collect(cat.id)
    }
  }

  const where = {
    isActive: true,
    ...(categoryIds.length > 0 ? { categories: { some: { categoryId: { in: categoryIds } } } } : {}),
  }

  const orderBy =
    sort === 'price-asc'
      ? { priceBdt: 'asc' as const }
      : sort === 'price-desc'
        ? { priceBdt: 'desc' as const }
        : sort === 'popular'
          ? { orderCount: 'desc' as const }
          : sort === 'newest'
            ? { createdAt: 'desc' as const }
            : { slug: 'asc' as const }

  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      include: { i18n: { where: { locale: 'en' } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  return NextResponse.json({
    total,
    page,
    perPage,
    products: rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      sku: p.sku,
      name: p.i18n[0]?.name || p.slug,
      priceBdt: toNumber(p.priceBdt),
      salePriceBdt: p.salePriceBdt ? toNumber(p.salePriceBdt) : null,
      image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
      orderCount: p.orderCount,
      firstSoldYear: p.firstSoldYear,
      shortDescription: p.i18n[0]?.shortDescription,
    })),
  })
}

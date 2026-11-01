import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toNumber } from '@/lib/money'
import { cached, cacheKey } from '@/lib/cache'
import { tag, TTL as CACHE_TTL } from '@/lib/cache-tags'

export const dynamic = 'force-dynamic'

// Public product list (used by category pages via CategoryProductsClient).
// Cached per (category, city, sort, page) tuple. Tags:
//   - `products`           → any product mutation busts every list
//   - `category:<slug>`    → that category's tree change busts its list
//   - `category-page`      → any category mutation busts all category lists
// First visitor warms; everyone else gets ~5ms. Admin mutations call
// bustProduct()/bustCategory() which drop these entries instantly.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || ''
  const city = searchParams.get('city') || ''
  const sort = searchParams.get('sort') || 'default'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const perPage = 48

  const key = cacheKey('products', { category, city, sort, page, perPage })
  const tags = [tag.products(), tag.categoryPage(), ...(category ? [tag.categorySlug(category)] : [])]

  const payload = await cached(key, tags, CACHE_TTL.PRODUCT_LIST, () =>
    loadProducts({ category, sort, page, perPage }),
  )
  return NextResponse.json(payload)
}

async function loadProducts({ category, sort, page, perPage }: { category: string; sort: string; page: number; perPage: number }) {
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

  return {
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
  }
}

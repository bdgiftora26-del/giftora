// Shared category-products loader (cached). Used by:
//   - src/app/[...categoryPath]/page.tsx  (server component → initial products as props, NO loading spinner)
//   - src/app/api/products/route.ts      (API route, kept for any client refresh)
//
// Both paths share the same cache entries + tags, so invalidation works
// identically whether the next visitor hits the page or the API.

import { db } from '@/lib/db'
import { toNumber } from '@/lib/money'
import { cached, cacheKey } from '@/lib/cache'
import { tag, TTL as CACHE_TTL } from '@/lib/cache-tags'

export type CategoryProductsPayload = Awaited<ReturnType<typeof loadCategoryProducts>>

/** Cached products-in-a-category list. First caller warms; rest get ~5ms. */
export function getCategoryProducts(opts: { category: string; sort?: string; page?: number; perPage?: number }): Promise<CategoryProductsPayload> {
  const category = opts.category
  const sort = opts.sort || 'default'
  const page = Math.max(1, opts.page || 1)
  const perPage = opts.perPage || 48
  const key = cacheKey('products', { category, sort, page, perPage })
  const tags = [tag.products(), tag.categoryPage(), ...(category ? [tag.categorySlug(category)] : [])]
  return cached(key, tags, CACHE_TTL.PRODUCT_LIST, () => loadCategoryProducts({ category, sort, page, perPage }))
}

async function loadCategoryProducts({ category, sort, page, perPage }: { category: string; sort: string; page: number; perPage: number }) {
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

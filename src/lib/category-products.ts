// Shared category-products loader (cached, two-tier). Used by:
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

/** Cached products-in-a-category list. First caller warms; rest get L1 µs-hit. */
export function getCategoryProducts(opts: {
  category: string
  sort?: string
  page?: number
  perPage?: number
}): Promise<CategoryProductsPayload> {
  const category = opts.category
  const sort = opts.sort || 'default'
  const page = Math.max(1, opts.page || 1)
  const perPage = opts.perPage || 48
  const key = cacheKey('products', { category, sort, page, perPage })
  const tags = [tag.products(), tag.categoryPage(), ...(category ? [tag.categorySlug(category)] : [])]
  return cached(key, tags, CACHE_TTL.PRODUCT_LIST, () => loadCategoryProducts({ category, sort, page, perPage }))
}

/**
 * Build the set of category IDs to filter products by.
 *
 * Given a leaf category slug, return [leafId, ...allDescendantIds].
 *
 * Implementation: ONE query fetches the entire category table (just id,
 * parentId, slug) and we walk the tree in-memory. This replaces the old
 * recursive N+1 pattern that fired one DB query per node — which on a deep
 * tree + cross-region Supabase could add seconds of latency per request.
 *
 * The full-tree fetch is itself cheap (~108 categories × 3 small columns =
 * a few KB) and is memoized implicitly inside the cached() wrapper at the
 * caller, so the tree walk only runs on cache miss.
 */
async function collectCategoryIds(slug: string): Promise<number[]> {
  // Single query — entire category table, smallest possible column set.
  const all = await db.category.findMany({
    select: { id: true, parentId: true, slug: true },
  })

  // Find the root by slug (we accept the first hit — slug is unique within
  // a parent+city tuple, and storefront queries are city-agnostic).
  const root = all.find((c) => c.slug === slug)
  if (!root) return []

  // Build child-of map: parentId -> [childId, childId, ...]
  const childrenOf = new Map<number | null, number[]>()
  for (const c of all) {
    const arr = childrenOf.get(c.parentId) ?? []
    arr.push(c.id)
    childrenOf.set(c.parentId, arr)
  }

  // BFS/DFS from root — collect root + all descendants.
  const out: number[] = [root.id]
  const stack: number[] = [root.id]
  while (stack.length) {
    const id = stack.pop()!
    const kids = childrenOf.get(id)
    if (kids) {
      for (const k of kids) {
        out.push(k)
        stack.push(k)
      }
    }
  }
  return out
}

async function loadCategoryProducts({
  category,
  sort,
  page,
  perPage,
}: {
  category: string
  sort: string
  page: number
  perPage: number
}) {
  // Single-tree-fetch (no recursion).
  const categoryIds = category ? await collectCategoryIds(category) : []

  const where = {
    isActive: true,
    ...(categoryIds.length > 0
      ? { categories: { some: { categoryId: { in: categoryIds } } } }
      : {}),
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

  // Total + page in parallel (2 queries, not N).
  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      include: {
        i18n: { where: { locale: 'en' } },
        images: { take: 1, orderBy: { sortOrder: 'asc' } },
      },
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

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { StorefrontShell, resolveCategoryPath } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard'
import { SortControl } from '@/components/product/SortControl'
import { allSettledFallback } from '@/lib/db-resilient'
import { toNumber } from '@/lib/money'
import type { Metadata } from 'next'

// Static ISR — sidebar locale defaults to 'en'; keeps page cacheable for fast + resilient loads.
export const revalidate = 600
const LOCALE = 'en'

const SORTS = ['default', 'price-asc', 'price-desc', 'name-asc', 'popular', 'newest'] as const
type Sort = (typeof SORTS)[number]

const PER_PAGE = 48

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryPath: string[] }>
}): Promise<Metadata> {
  const { categoryPath } = await params
  try {
    const resolved = await resolveCategoryPath(categoryPath, LOCALE)
    if (!resolved || resolved.length === 0) return {}
    const cat = resolved[resolved.length - 1]
    return {
      title: cat.name,
      description: cat.description || `${cat.name} — BDGiftora gift delivery in Bangladesh`,
    }
  } catch {
    return {}
  }
}

// Fetch a category and ALL its descendants in ONE query (instead of recursive calls).
// Works by fetching all categories, then filtering the subtree in memory.
async function getCategorySubtreeIds(rootId: number): Promise<number[]> {
  const all = await db.category.findMany({ select: { id: true, parentId: true } })
  const ids = new Set<number>([rootId])
  let added = true
  while (added) {
    added = false
    for (const c of all) {
      if (c.parentId !== null && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id)
        added = true
      }
    }
  }
  return [...ids]
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoryPath: string[] }>
  searchParams: Promise<{ sort?: string; page?: string }>
}) {
  const { categoryPath } = await params
  const sp = await searchParams

  // Resolve path + CMS fallback (tolerant of transient DB errors)
  const resolved = await resolveCategoryPath(categoryPath, LOCALE).catch(() => null)

  if ((!resolved || resolved.length === 0) && categoryPath.length === 1) {
    const slug = categoryPath[0]
    const cms = await db.cmsPage
      .findUnique({ where: { slug_locale: { slug, locale: LOCALE } } })
      .catch(() => null)
    if (cms) {
      return (
        <StorefrontShell withSidebar>
          <div style={{ padding: '12px 16px', maxWidth: 760, margin: '0 auto' }}>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: cms.title }]} />
            <h1 className="category-h1">{cms.title}</h1>
            <div
              style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--c-text)' }}
              dangerouslySetInnerHTML={{ __html: cms.body.replace(/\n/g, '<br/>') }}
            />
          </div>
        </StorefrontShell>
      )
    }
  }

  if (!resolved || resolved.length === 0) notFound()
  const leaf = resolved[resolved.length - 1]

  const sort = (SORTS as readonly string[]).includes(sp.sort || '') ? (sp.sort as Sort) : 'default'
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1)

  // Optimized: single query for subtree ids, then single product query.
  // Wrapped in allSettledFallback so a transient DB error doesn't crash the page.
  const [categoryIds, products] = await allSettledFallback<
    [number[], Awaited<ReturnType<typeof db.product.findMany>>]
  >([
    {
      run: () => getCategorySubtreeIds(leaf.id),
      fallback: [leaf.id] as number[],
    },
    {
      run: () =>
        db.product.findMany({
          where: {
            isActive: true,
            categories: { some: { categoryId: { in: [leaf.id] } } },
          },
          include: {
            i18n: { where: { locale: LOCALE } },
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
          orderBy:
            sort === 'price-asc'
              ? { priceBdt: 'asc' }
              : sort === 'price-desc'
                ? { priceBdt: 'desc' }
                : sort === 'popular'
                  ? { orderCount: 'desc' }
                  : sort === 'newest'
                    ? { createdAt: 'desc' }
                    : { slug: 'asc' },
        }),
      fallback: [] as Awaited<ReturnType<typeof db.product.findMany>>,
    },
  ])

  // If subtree has descendants, re-fetch products for the whole subtree in one query
  // (only when there are descendants beyond the leaf, to avoid an extra call for leaf categories)
  let finalProducts = products
  if (categoryIds.length > 1) {
    finalProducts = await db.product
      .findMany({
        where: {
          isActive: true,
          categories: { some: { categoryId: { in: categoryIds } } },
        },
        include: {
          i18n: { where: { locale: LOCALE } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
        orderBy:
          sort === 'price-asc'
            ? { priceBdt: 'asc' }
            : sort === 'price-desc'
              ? { priceBdt: 'desc' }
              : sort === 'popular'
                ? { orderCount: 'desc' }
                : sort === 'newest'
                  ? { createdAt: 'desc' }
                  : { slug: 'asc' },
      })
      .catch(() => products)
  }

  if (sort === 'name-asc') {
    finalProducts = [...finalProducts].sort((a, b) => {
      const an = a.i18n[0]?.name || a.slug
      const bn = b.i18n[0]?.name || b.slug
      return an.localeCompare(bn)
    })
  }

  const total = finalProducts.length
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = finalProducts.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const cardData: ProductCardData[] = paged.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.i18n[0]?.name || p.slug,
    priceBdt: toNumber(p.priceBdt),
    salePriceBdt: p.salePriceBdt ? toNumber(p.salePriceBdt) : null,
    image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
    orderCount: p.orderCount,
    firstSoldYear: p.firstSoldYear,
    shortDescription: p.i18n[0]?.shortDescription,
  }))

  const crumbs = [
    { label: 'Home', href: '/' },
    ...resolved.map((c, i) => ({
      label: c.name,
      href: '/' + resolved.slice(0, i + 1).map((x) => x.slug).join('/'),
    })),
  ]

  return (
    <StorefrontShell withSidebar activeSlug={resolved[0]?.slug}>
      <Breadcrumb items={crumbs} />
      <h1 className="category-h1">{leaf.name}</h1>
      {leaf.description && <p className="category-desc">{leaf.description}</p>}

      <div className="category-toolbar">
        <span>Total {total} Products</span>
        <SortControl sort={sort} />
      </div>

      {cardData.length === 0 ? (
        <p className="muted">No products in this category yet.</p>
      ) : (
        <div className="product-grid">
          {cardData.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}

      <div className="product-footer-bar">Showing {cardData.length} products</div>

      {totalPages > 1 && (
        <div className="pager">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`?sort=${sort}&page=${n}`}
              className={n === safePage ? 'pager-current' : ''}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </StorefrontShell>
  )
}

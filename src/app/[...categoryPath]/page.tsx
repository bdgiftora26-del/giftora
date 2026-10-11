import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { StorefrontShell, resolveCategoryPath } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { CategoryProducts } from '@/components/product/CategoryProducts'
import type { ProductCardData } from '@/components/product/ProductCard'
import { toNumber } from '@/lib/money'
import type { Metadata } from 'next'

// ISR: top-level categories + CMS pages pre-rendered at build (fast build),
// nested category paths render on-demand and get cached.
export const revalidate = 600
export const dynamicParams = true
const LOCALE = 'en'

// Pre-render only top-level category slugs + CMS single-segment slugs (~49 pages).
// Nested category paths + products render on-demand (ISR) → fast build, still cached.
export async function generateStaticParams() {
  try {
    const top = await db.category.findMany({
      where: { parentId: null, isActive: true },
      select: { slug: true },
    })
    const cms = await db.cmsPage.findMany({ where: { locale: 'en' }, select: { slug: true } })
    const params: { categoryPath: string[] }[] = []
    for (const c of top) params.push({ categoryPath: [c.slug] })
    for (const c of cms) {
      if (!params.some((p) => p.categoryPath[0] === c.slug)) params.push({ categoryPath: [c.slug] })
    }
    return params
  } catch {
    return []
  }
}

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
}: {
  params: Promise<{ categoryPath: string[] }>
}) {
  const { categoryPath } = await params

  // Resolve path (tolerant of transient DB errors)
  const resolved = await resolveCategoryPath(categoryPath, LOCALE).catch(() => null)

  // CMS fallback for single-segment slugs (about-us, how-to-order-gift, etc.)
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

  // Single optimized query: get subtree ids, then all products in that subtree.
  let products: ProductCardData[] = []
  try {
    const categoryIds = await getCategorySubtreeIds(leaf.id)
    const rows = await db.product.findMany({
      where: {
        isActive: true,
        categories: { some: { categoryId: { in: categoryIds } } },
      },
      include: {
        i18n: { where: { locale: LOCALE } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
      orderBy: { slug: 'asc' },
    })
    products = rows.map((p) => ({
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
  } catch {
    // Transient DB error — render page with empty products rather than crashing
    products = []
  }

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

      <CategoryProducts products={products} />
    </StorefrontShell>
  )
}

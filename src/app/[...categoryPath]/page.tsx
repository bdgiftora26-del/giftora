import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { StorefrontShell, resolveCategoryPath } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { CategoryProducts } from '@/components/product/CategoryProducts'
import type { Metadata } from 'next'

// Dynamic rendering — avoids build-time DB queries (which fail on Vercel Hobby).
// ISR cache still works via revalidate.
export const revalidate = 600
export const dynamic = 'force-dynamic'
const LOCALE = 'en'

// Static metadata (no DB query at build time — avoids Vercel build failures)
export const metadata: Metadata = {
  title: 'BDGift.com — Send Gifts to Bangladesh',
  description: 'Send gifts, cakes, flowers, and more to Bangladesh. Serving since 2004.',
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

  // Fetch products server-side (force-dynamic = runtime only, not build-time)
  let products: any[] = []
  try {
    const { toNumber } = await import('@/lib/money')
    // Get this category + all descendants
    const allCats = await db.category.findMany({ select: { id: true, parentId: true } })
    const catIds = new Set<number>([leaf.id])
    let added = true
    while (added) {
      added = false
      for (const c of allCats) {
        if (c.parentId !== null && catIds.has(c.parentId) && !catIds.has(c.id)) {
          catIds.add(c.id)
          added = true
        }
      }
    }
    const rows = await db.product.findMany({
      where: { isActive: true, categories: { some: { categoryId: { in: [...catIds] } } } },
      include: { i18n: { where: { locale: LOCALE } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
      orderBy: { orderCount: 'desc' },
      take: 100,
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

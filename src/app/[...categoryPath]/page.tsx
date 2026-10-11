import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { StorefrontShell, resolveCategoryPath } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard'
import { SortControl } from '@/components/product/SortControl'
import { toNumber } from '@/lib/money'
import type { Metadata } from 'next'

export const revalidate = 300

async function getLocale(): Promise<string> {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  return store.get('ub_locale')?.value === 'bn' ? 'bn' : 'en'
}

const SORTS = ['default', 'price-asc', 'price-desc', 'name-asc', 'popular', 'newest'] as const
type Sort = (typeof SORTS)[number]

const PER_PAGE = 48

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryPath: string[] }>
}): Promise<Metadata> {
  const { categoryPath } = await params
  const locale = await getLocale()
  const resolved = await resolveCategoryPath(categoryPath, locale)
  if (!resolved || resolved.length === 0) return {}
  const cat = resolved[resolved.length - 1]
  return {
    title: cat.name,
    description: cat.description || `${cat.name} — UpoharBd gift delivery in Bangladesh`,
  }
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
  const locale = await getLocale()

  const resolved = await resolveCategoryPath(categoryPath, locale)

  // Fallback: single-segment CMS page (about-us, how-to-order-gift, etc.)
  if ((!resolved || resolved.length === 0) && categoryPath.length === 1) {
    const slug = categoryPath[0]
    const cms = await db.cmsPage.findUnique({ where: { slug_locale: { slug, locale } } })
      ?? (locale !== 'en' ? await db.cmsPage.findUnique({ where: { slug_locale: { slug, locale: 'en' } } }) : null)
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

  // Gather this category and all descendant category ids
  const collectIds = async (parentId: number): Promise<number[]> => {
    const children = await db.category.findMany({ where: { parentId } })
    const ids = [parentId]
    for (const c of children) {
      ids.push(...(await collectIds(c.id)))
    }
    return ids
  }
  const categoryIds = await collectIds(leaf.id)

  let products = await db.product.findMany({
    where: {
      isActive: true,
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    include: {
      i18n: { where: { locale } },
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

  if (sort === 'name-asc') {
    products = [...products].sort((a, b) => {
      const an = a.i18n[0]?.name || a.slug
      const bn = b.i18n[0]?.name || b.slug
      return an.localeCompare(bn)
    })
  }

  const total = products.length
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = products.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

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

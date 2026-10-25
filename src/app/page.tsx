import { db } from '@/lib/db'
import { allSettledFallback } from '@/lib/db-resilient'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeProductSections } from '@/components/home/HomeProductSections'
import { HomeSidebar } from '@/components/home/HomeSidebar'
import { HomeContentSections } from '@/components/home/HomeContentSections'
import Link from 'next/link'

const LOCALE = 'en'

export const dynamic = "force-dynamic"

// Cache for category subtree lookups (avoid repeated queries within same request)
const catCache = new Map<string, number[]>()

// Fetch products in a top-level category AND its children (optimized)
async function fetchByTopCategory(topSlug: string, take = 6) {
  let catIds = catCache.get(topSlug)
  if (!catIds) {
    const top = await db.category.findFirst({ where: { slug: topSlug, parentId: null }, select: { id: true } })
    if (!top) return []
    const children = await db.category.findMany({ where: { parentId: top.id }, select: { id: true } })
    catIds = [top.id, ...children.map(c => c.id)]
    catCache.set(topSlug, catIds)
  }
  return db.product.findMany({
    where: { isActive: true, categories: { some: { categoryId: { in: catIds } } } },
    select: {
      id: true, slug: true, priceBdt: true, salePriceBdt: true, orderCount: true, firstSoldYear: true,
      i18n: { where: { locale: LOCALE }, select: { name: true, shortDescription: true } },
      images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
    },
    orderBy: { orderCount: 'desc' }, take,
  })
}

export default async function HomePage() {
  // First fetch categories, then products by top-level category (including children)
  const [flowers, cakes, food, anniversary, giftBaskets, allCategories] = (await allSettledFallback([
    { run: () => fetchByTopCategory('flowers', 6), fallback: [] as any },
    { run: () => fetchByTopCategory('cake', 6), fallback: [] as any },
    { run: () => fetchByTopCategory('food', 6), fallback: [] as any },
    { run: () => fetchByTopCategory('anniversary', 6), fallback: [] as any },
    {
      run: async () => {
        const baskets = await fetchByTopCategory('gift-baskets', 3)
        const combos = await fetchByTopCategory('combo-gifts', 3)
        return [...baskets, ...combos].slice(0, 6)
      },
      fallback: [] as any,
    },
    {
      run: () => db.category.findMany({
        where: { parentId: null, isActive: true, showInSidebar: true },
        select: { slug: true, i18n: { where: { locale: LOCALE }, select: { name: true, locale: true } } },
        orderBy: { sortOrder: 'asc' },
      }),
      fallback: [] as any,
    },
  ])) as any

  const seoLinks = allCategories
    .map((c) => {
      const i18n = c.i18n.find((x) => x.locale === LOCALE) || c.i18n.find((x) => x.locale === 'en')
      return { name: i18n?.name || c.slug, href: `/${c.slug}` }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <StorefrontShell>
      <HomeHero />
      <div className="content-with-sidebar">
        <HomeSidebar />
        <main className="content-main">
          <HomeProductSections
            sections={[
              { title: 'Fresh Flowers', products: flowers, cols: 3 },
              { title: 'Popular Cakes', products: cakes, cols: 4 },
              { title: 'Food Items', products: food, cols: 3 },
              { title: 'Anniversary Gifts', products: anniversary, cols: 4 },
              { title: 'Gift Baskets & Combos', products: giftBaskets, cols: 3 },
            ]}
          />
          <HomeContentSections />
          {seoLinks.length > 0 && (
            <section className="seo-links">
              <div className="section-header">All Categories</div>
              <div className="seo-links-grid">
                {seoLinks.map((l) => (
                  <Link key={l.href} href={l.href}>{l.name}</Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </StorefrontShell>
  )
}

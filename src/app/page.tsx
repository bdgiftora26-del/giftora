import { db } from '@/lib/db'
import { allSettledFallback } from '@/lib/db-resilient'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeProductSections } from '@/components/home/HomeProductSections'
import Link from 'next/link'

const LOCALE = 'en'

export const dynamic = "force-dynamic"

// Fetch products in a top-level category AND its children
async function fetchByTopCategory(topSlug: string, take = 8) {
  // Find the top category + all its child category ids
  const top = await db.category.findFirst({ where: { slug: topSlug, parentId: null } })
  if (!top) return []
  const children = await db.category.findMany({ where: { parentId: top.id }, select: { id: true } })
  const catIds = [top.id, ...children.map(c => c.id)]
  return db.product.findMany({
    where: { isActive: true, categories: { some: { categoryId: { in: catIds } } } },
    include: { i18n: { where: { locale: LOCALE } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
    orderBy: { orderCount: 'desc' }, take,
  })
}

export default async function HomePage() {
  // First fetch categories, then products by top-level category (including children)
  const [flowers, cakes, food, anniversary, giftBaskets, allCategories] = (await allSettledFallback([
    { run: () => fetchByTopCategory('flowers', 8), fallback: [] as any },
    { run: () => fetchByTopCategory('cake', 8), fallback: [] as any },
    { run: () => fetchByTopCategory('food', 8), fallback: [] as any },
    { run: () => fetchByTopCategory('anniversary', 8), fallback: [] as any },
    {
      run: async () => {
        const baskets = await fetchByTopCategory('gift-baskets', 4)
        const combos = await fetchByTopCategory('combo-gifts', 4)
        return [...baskets, ...combos].slice(0, 8)
      },
      fallback: [] as any,
    },
    {
      run: () => db.category.findMany({
        where: { parentId: null, isActive: true, showInSidebar: true },
        include: { i18n: true },
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
    <StorefrontShell withSidebar>
      <HomeHero />
      <div className="home-body">
        <div className="home-content">
          <HomeProductSections
            sections={[
              { title: 'Fresh Flowers', products: flowers },
              { title: 'Popular Cakes', products: cakes },
              { title: 'Food Items', products: food },
              { title: 'Anniversary Gifts', products: anniversary },
              { title: 'Gift Baskets & Combos', products: giftBaskets },
            ]}
          />
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
        </div>
      </div>
    </StorefrontShell>
  )
}

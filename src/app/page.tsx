import { db } from '@/lib/db'
import { allSettledFallback } from '@/lib/db-resilient'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeProductSections } from '@/components/home/HomeProductSections'
import Link from 'next/link'

const LOCALE = 'en'

export const revalidate = 600

export default async function HomePage() {
  const [flowers, cakes, food, teddy, giftBaskets, allCategories] = (await allSettledFallback([
    {
      run: () => db.product.findMany({
        where: { isActive: true, categories: { some: { category: { slug: 'fresh-flower-and-roses' } } } },
        include: { i18n: { where: { locale: LOCALE } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
        orderBy: { orderCount: 'desc' }, take: 6,
      }),
      fallback: [] as any,
    },
    {
      run: () => db.product.findMany({
        where: { isActive: true, isCake: true },
        include: { i18n: { where: { locale: LOCALE } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
        orderBy: { orderCount: 'desc' }, take: 6,
      }),
      fallback: [] as any,
    },
    {
      run: () => db.product.findMany({
        where: { isActive: true, categories: { some: { category: { slug: 'food-court' } } } },
        include: { i18n: { where: { locale: LOCALE } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
        orderBy: { orderCount: 'desc' }, take: 6,
      }),
      fallback: [] as any,
    },
    {
      run: () => db.product.findMany({
        where: { isActive: true, categories: { some: { category: { slug: 'teddy-bear-and-soft-toys' } } } },
        include: { i18n: { where: { locale: LOCALE } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
        orderBy: { orderCount: 'desc' }, take: 6,
      }),
      fallback: [] as any,
    },
    {
      run: () => db.product.findMany({
        where: { isActive: true, salePriceBdt: { not: null } },
        include: { i18n: { where: { locale: LOCALE } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
        orderBy: { orderCount: 'desc' }, take: 6,
      }),
      fallback: [] as any,
    },
    {
      run: () => db.category.findMany({
        where: { parentId: null, isActive: true },
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
              { title: 'Latest Flowers', products: flowers },
              { title: 'Popular Cakes', products: cakes },
              { title: 'Food Items', products: food },
              { title: 'Teddy Bears & Gifts', products: teddy },
              { title: 'Special Offers', products: giftBaskets },
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

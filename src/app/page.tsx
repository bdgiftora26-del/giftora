import { db } from '@/lib/db'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeProductSections } from '@/components/home/HomeProductSections'
import { HomeSidebar } from '@/components/home/HomeSidebar'
import { HomeContentSections } from '@/components/home/HomeContentSections'

const LOCALE = 'en'

// In-memory cache for home page data (30s TTL — avoids hitting DB on every request)
let homeCache: { ts: number; data: any } | null = null
const HOME_CACHE_TTL = 30_000

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Fetch ALL home page data in a single batch of parallel queries
async function fetchHomeData() {
  if (homeCache && Date.now() - homeCache.ts < HOME_CACHE_TTL) {
    return homeCache.data
  }

  // Step 1: Get all category IDs in ONE query
  const allCats = await db.category.findMany({
    where: { parentId: null, isActive: true, showInSidebar: true },
    select: {
      id: true, slug: true, icon: true,
      i18n: { where: { locale: LOCALE }, select: { name: true } },
      children: {
        where: { isActive: true },
        select: { id: true, slug: true, parentId: true, i18n: { where: { locale: LOCALE }, select: { name: true } } },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  // Build category lookup
  const catMap = new Map<string, number[]>()
  const sidebarCats = allCats.map((c) => {
    const childIds = c.children.map((ch) => ch.id)
    catMap.set(c.slug, [c.id, ...childIds])
    return { id: c.id, slug: c.slug, name: c.i18n[0]?.name || c.slug, icon: c.icon, href: `/${c.slug}`, isActive: true }
  })

  // Step 2: Fetch all product sections + slider + sidebar widgets IN PARALLEL
  const sectionSlugs = ['flowers', 'cake', 'food', 'anniversary', 'gift-baskets', 'combo-gifts']
  const [sectionResults, sliderBanners, topProducts, testimonial] = await Promise.all([
    // All product sections at once
    Promise.all(sectionSlugs.map(async (slug) => {
      const catIds = catMap.get(slug) || []
      if (catIds.length === 0) return []
      return db.product.findMany({
        where: { isActive: true, categories: { some: { categoryId: { in: catIds } } } },
        select: { id: true, slug: true, priceBdt: true, salePriceBdt: true, orderCount: true, firstSoldYear: true, i18n: { where: { locale: LOCALE }, select: { name: true } }, images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } } },
        orderBy: { orderCount: 'desc' }, take: 6,
      })
    })),
    // Slider banners
    db.banner.findMany({ where: { placement: 'HOME_SLIDER', isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, title: true, imageUrl: true, link: true } }),
    // Top sellers (for sidebar)
    db.product.findMany({ where: { isActive: true, orderCount: { gt: 0 } }, select: { id: true, slug: true, priceBdt: true, salePriceBdt: true, i18n: { where: { locale: LOCALE }, select: { name: true } }, images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } } }, orderBy: { orderCount: 'desc' }, take: 3 }),
    // Testimonial
    db.testimonial.findFirst({ where: { approved: true }, orderBy: { createdAt: 'desc' }, select: { name: true, country: true, message: true } }),
  ])

  const data = {
    flowers: sectionResults[0],
    cakes: sectionResults[1],
    food: sectionResults[2],
    anniversary: sectionResults[3],
    giftBaskets: [...sectionResults[4], ...sectionResults[5]].slice(0, 6),
    sliderBanners,
    sidebarCategories: sidebarCats,
    topProducts,
    testimonial,
  }

  homeCache = { ts: Date.now(), data }
  return data
}

export default async function HomePage() {
  const data = await fetchHomeData()

  const mapProducts = (products: any[]) => products.map((p) => ({
    id: p.id, slug: p.slug, name: p.i18n[0]?.name || p.slug,
    priceBdt: Number(p.priceBdt), salePriceBdt: p.salePriceBdt ? Number(p.salePriceBdt) : null,
    image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
    orderCount: p.orderCount, firstSoldYear: p.firstSoldYear, shortDescription: p.i18n[0]?.shortDescription,
  }))

  return (
    <StorefrontShell>
      <HomeHero slides={data.sliderBanners} />
      <div className="content-with-sidebar">
        <HomeSidebar categories={data.sidebarCategories} topProducts={data.topProducts} testimonial={data.testimonial} />
        <main className="content-main">
          <HomeProductSections
            sections={[
              { title: 'Fresh Flowers', products: data.flowers, cols: 3 },
              { title: 'Popular Cakes', products: data.cakes, cols: 4 },
              { title: 'Food Items', products: data.food, cols: 3 },
              { title: 'Anniversary Gifts', products: data.anniversary, cols: 4 },
              { title: 'Gift Baskets & Combos', products: data.giftBaskets, cols: 3 },
            ]}
          />
          <HomeContentSections />
        </main>
      </div>
    </StorefrontShell>
  )
}

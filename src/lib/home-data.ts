// Shared home-page data loader (cached). Used by BOTH:
//   - src/app/page.tsx          (server component → data passed as props, NO loading spinner)
//   - src/app/api/home-data     (API route, kept for any client-side refresh if ever needed)
//
// Centralising here means the homepage shell and the API can never drift apart,
// and both benefit from the same `home`-tagged cache entry.

import { db } from '@/lib/db'
import { cached, cacheKey } from '@/lib/cache'
import { tag, TTL as CACHE_TTL } from '@/lib/cache-tags'

export type HomeData = Awaited<ReturnType<typeof buildHomeData>>

/** Cached home-data aggregate. First caller warms; everyone else gets ~5ms. */
export function getHomeData(locale: string = 'en'): Promise<HomeData> {
  return cached(
    cacheKey('home-data', { locale }),
    [tag.home()],
    CACHE_TTL.HOME,
    () => buildHomeData(locale),
  )
}

async function buildHomeData(LOCALE: string = 'en') {
  // Step 1: All categories in ONE query
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

  const catMap = new Map<string, number[]>()
  const sidebarCategories = allCats.map((c) => {
    catMap.set(c.slug, [c.id, ...c.children.map((ch) => ch.id)])
    return { id: c.id, slug: c.slug, name: c.i18n[0]?.name || c.slug, icon: c.icon, href: `/${c.slug}`, isActive: true }
  })

  // Step 2: All data in parallel
  const sectionSlugs = ['flowers', 'cake', 'food', 'anniversary', 'gift-baskets', 'combo-gifts']
  const [sectionResults, sliderBanners, topProducts, testimonial] = await Promise.all([
    Promise.all(sectionSlugs.map(async (slug) => {
      const catIds = catMap.get(slug) || []
      if (catIds.length === 0) return []
      return db.product.findMany({
        where: { isActive: true, categories: { some: { categoryId: { in: catIds } } } },
        select: { id: true, slug: true, priceBdt: true, salePriceBdt: true, orderCount: true, firstSoldYear: true, i18n: { where: { locale: LOCALE }, select: { name: true, shortDescription: true } }, images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } } },
        orderBy: { orderCount: 'desc' }, take: 6,
      })
    })),
    db.banner.findMany({ where: { placement: 'HOME_SLIDER', isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, title: true, imageUrl: true, link: true } }),
    db.product.findMany({ where: { isActive: true, orderCount: { gt: 0 } }, select: { id: true, slug: true, priceBdt: true, salePriceBdt: true, i18n: { where: { locale: LOCALE }, select: { name: true } }, images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } } }, orderBy: { orderCount: 'desc' }, take: 3 }),
    db.testimonial.findFirst({ where: { approved: true }, orderBy: { createdAt: 'desc' }, select: { name: true, country: true, message: true } }),
  ])

  // Map products for client
  const mapProducts = (products: any[]) => products.map((p) => ({
    id: p.id, slug: p.slug, name: p.i18n[0]?.name || p.slug,
    priceBdt: Number(p.priceBdt), salePriceBdt: p.salePriceBdt ? Number(p.salePriceBdt) : null,
    image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
    orderCount: p.orderCount, firstSoldYear: p.firstSoldYear, shortDescription: p.i18n[0]?.shortDescription,
  }))

  const mappedTop = topProducts.map((p) => ({
    id: p.id, slug: p.slug, name: p.i18n[0]?.name || p.slug,
    priceBdt: Number(p.priceBdt), salePriceBdt: p.salePriceBdt ? Number(p.salePriceBdt) : null,
    image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
  }))

  const data = {
    flowers: mapProducts(sectionResults[0]),
    cakes: mapProducts(sectionResults[1]),
    food: mapProducts(sectionResults[2]),
    anniversary: mapProducts(sectionResults[3]),
    giftBaskets: [...mapProducts(sectionResults[4]), ...mapProducts(sectionResults[5])].slice(0, 6),
    sliderBanners,
    sidebarCategories,
    topProducts: mappedTop,
    testimonial,
    widgets: {
      topSellers: mappedTop.slice(0, 2),
      randomProduct: mappedTop.slice(2, 3),
      testimonials: testimonial ? [testimonial] : [],
      blogHighlights: [
        { title: 'The Complete Guide to Flower Gifting in Bangladesh', slug: 'flower-gifting-guide' },
        { title: 'Gifts-to-Bangladesh', slug: 'gifts-to-bangladesh' },
        { title: 'Online Gift Delivery in Dhaka', slug: 'online-gift-delivery-dhaka' },
        { title: 'Send Gifts to Bangladesh from USA', slug: 'send-gifts-from-usa' },
      ],
      information: [
        { label: 'About Us', href: '/about-us' },
        { label: 'Contact us', href: '/contact-us' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Payments', href: '/how-to-pay-for-order' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Refund & Return Policy', href: '/refund-return-policy' },
        { label: 'Shipping & Returns', href: '/gift-delivery-how-where-and-fees' },
        { label: 'Terms & Conditions', href: '/terms-and-conditions' },
        { label: 'Customer Testimonials', href: '/testimonials' },
      ],
      news: [
        { title: 'Celebrating Connections: BDGiftora.com Gift Delivery', slug: 'about-us' },
        { title: "Valentine's Day Romantic Gifts in Bangladesh", slug: 'valentines-day-gift-packages' },
      ],
    },
  }

  return data
}

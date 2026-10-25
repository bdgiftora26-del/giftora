import { db } from '@/lib/db'
import { getSidebarCategories, type SidebarCategory } from '@/lib/catalog'
import { Sidebar } from '@/components/layout/Sidebar'
import { toNumber } from '@/lib/money'

// Cache sidebar data for 60s to avoid repeated DB hits
let cache: { ts: number; data: any } | null = null
const CACHE_TTL = 60_000

// Server component — fetches all sidebar data for the home page (cached)
export async function HomeSidebar() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return <Sidebar categories={cache.data.categories} widgets={cache.data.widgets} />
  }

  const categories: SidebarCategory[] = await getSidebarCategories('en').catch(() => [])

  // Single optimized query: get top products (reuse for both Top Sellers + Random)
  const products = await db.product.findMany({
    where: { isActive: true },
    select: {
      id: true, slug: true, priceBdt: true, salePriceBdt: true, orderCount: true,
      i18n: { where: { locale: 'en' }, select: { name: true } },
      images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
    },
    orderBy: { orderCount: 'desc' },
    take: 3,
  }).catch(() => [])

  const mappedProducts = products.map((p) => ({
    id: p.id, slug: p.slug,
    name: p.i18n[0]?.name || p.slug,
    priceBdt: toNumber(p.priceBdt),
    salePriceBdt: p.salePriceBdt ? toNumber(p.salePriceBdt) : null,
    image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
  }))

  const testimonial = await db.testimonial.findFirst({
    where: { approved: true },
    orderBy: { createdAt: 'desc' },
    select: { name: true, country: true, message: true },
  }).catch(() => null)

  const widgets = {
    topSellers: mappedProducts.slice(0, 2),
    randomProduct: mappedProducts.slice(2, 3),
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
      { title: 'Celebrating Connections: BDGiftora.com Enables Seamless Gift Delivery', slug: 'about-us' },
      { title: 'Valentine\'s Day Romantic Gifts for Everyone in Bangladesh', slug: 'valentines-day-gift-packages' },
    ],
  }

  cache = { ts: Date.now(), data: { categories, widgets } }

  return <Sidebar categories={categories} widgets={widgets} />
}

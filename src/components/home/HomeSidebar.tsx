import { db } from '@/lib/db'
import { getSidebarCategories, type SidebarCategory } from '@/lib/catalog'
import { Sidebar } from '@/components/layout/Sidebar'
import { toNumber } from '@/lib/money'

// Server component — fetches all sidebar data for the home page
export async function HomeSidebar() {
  const categories: SidebarCategory[] = await getSidebarCategories('en').catch(() => [])

  // Fetch sidebar widget data in parallel
  const [topSellers, randomProduct, testimonials, newsPages] = await Promise.all([
    db.product.findMany({
      where: { isActive: true, orderCount: { gt: 0 } },
      include: { i18n: { where: { locale: 'en' } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
      orderBy: { orderCount: 'desc' },
      take: 2,
    }).catch(() => []),
    db.product.findMany({
      where: { isActive: true },
      include: { i18n: { where: { locale: 'en' } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
      take: 1,
      skip: Math.floor(Math.random() * 50),
    }).catch(() => []),
    db.testimonial.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: 1,
    }).catch(() => []),
    db.cmsPage.findMany({
      where: { locale: 'en' },
      select: { title: true, slug: true },
      take: 3,
    }).catch(() => []),
  ])

  return (
    <Sidebar
      categories={categories}
      widgets={{
        topSellers: topSellers.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.i18n[0]?.name || p.slug,
          priceBdt: toNumber(p.priceBdt),
          salePriceBdt: p.salePriceBdt ? toNumber(p.salePriceBdt) : null,
          image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
        })),
        randomProduct: randomProduct.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.i18n[0]?.name || p.slug,
          priceBdt: toNumber(p.priceBdt),
          salePriceBdt: p.salePriceBdt ? toNumber(p.salePriceBdt) : null,
          image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
        })),
        testimonials: testimonials.map((t) => ({
          name: t.name,
          country: t.country,
          message: t.message,
        })),
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
        news: newsPages.map((p) => ({ title: p.title, slug: p.slug })),
      }}
    />
  )
}

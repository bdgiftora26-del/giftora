import { Sidebar } from '@/components/layout/Sidebar'
import { toNumber } from '@/lib/money'

type SidebarCategory = { id: number; slug: string; name: string; icon?: string | null; href: string; isActive: boolean }

export function HomeSidebar({
  categories,
  topProducts,
  testimonial,
}: {
  categories: SidebarCategory[]
  topProducts: any[]
  testimonial: { name: string; country: string; message: string } | null
}) {
  const mappedTop = topProducts.map((p) => ({
    id: p.id, slug: p.slug, name: p.i18n[0]?.name || p.slug,
    priceBdt: toNumber(p.priceBdt), salePriceBdt: p.salePriceBdt ? toNumber(p.salePriceBdt) : null,
    image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
  }))

  return (
    <Sidebar
      categories={categories}
      widgets={{
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
          { title: 'Valentine\'s Day Romantic Gifts in Bangladesh', slug: 'valentines-day-gift-packages' },
        ],
      }}
    />
  )
}

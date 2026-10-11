import { db } from '@/lib/db'
import { allSettledFallback } from '@/lib/db-resilient'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { PromoMosaic } from '@/components/home/PromoMosaic'
import { Testimonials, type TestimonialData } from '@/components/home/Testimonials'
import { CategoryTiles, type TileData } from '@/components/home/CategoryTiles'
import { AboutSection } from '@/components/home/AboutSection'
import Link from 'next/link'

// Home page is fully static + ISR. No per-request DB hit (resilient + fast).
// Locale for client UI (promo/testimonials labels) is handled client-side via useT().
// CMS 'home-about' + SEO links default to 'en' (acceptable; most traffic is EN).
const LOCALE = 'en'

export const revalidate = 600

export default async function HomePage() {
  const [testimonials, totalApproved, tiles, homeAbout, allCategories] = await allSettledFallback([
    {
      run: () =>
        db.testimonial.findMany({
          where: { approved: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }) as Promise<TestimonialData[]>,
      fallback: [] as TestimonialData[],
    },
    {
      run: () => db.testimonial.count({ where: { approved: true } }),
      fallback: 0 as number,
    },
    {
      run: () =>
        db.banner.findMany({
          where: { placement: 'HOME_TILES', isActive: true },
          orderBy: { sortOrder: 'asc' },
        }),
      fallback: [] as Awaited<ReturnType<typeof db.banner.findMany>>,
    },
    {
      run: () => db.cmsPage.findUnique({ where: { slug_locale: { slug: 'home-about', locale: LOCALE } } }),
      fallback: null as Awaited<ReturnType<typeof db.cmsPage.findUnique>>,
    },
    {
      run: () =>
        db.category.findMany({
          where: { parentId: null, isActive: true },
          include: { i18n: true },
          orderBy: { sortOrder: 'asc' },
        }),
      fallback: [] as Awaited<ReturnType<typeof db.category.findMany>>,
    },
  ])

  const tileData: TileData[] = tiles.map((b, i) => ({
    id: b.id,
    title: b.title,
    href: b.link || '/catalogue',
    imageIndex: i + 1,
  }))

  const seoLinks = allCategories
    .map((c) => {
      const i18n = c.i18n.find((x) => x.locale === LOCALE) || c.i18n.find((x) => x.locale === 'en')
      return { name: i18n?.name || c.slug, href: `/${c.slug}` }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <StorefrontShell>
      <PromoMosaic />

      <Testimonials testimonials={testimonials} totalApproved={totalApproved} />

      <CategoryTiles tiles={tileData} />

      <AboutSection bodyHtml={homeAbout?.body || ''} />

      {/* Payment strip */}
      <div className="payment-strip">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/placeholders/payments.svg" alt="Accepted payment methods" width={600} height={40} />
      </div>

      {/* SEO link list (home only) */}
      {seoLinks.length > 0 && (
        <section className="seo-links" aria-label="All categories">
          <div className="seo-links-grid">
            {seoLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </StorefrontShell>
  )
}

import Link from 'next/link'
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard'
import { toNumber } from '@/lib/money'

export function HomeProductSections({
  sections,
}: {
  sections: { title: string; products: Awaited<ReturnType<typeof import('@/lib/db').db.product.findMany>> }[]
}) {
  return (
    <>
      {sections.map((section) => {
        if (!section.products || section.products.length === 0) return null
        const cards: ProductCardData[] = section.products.map((p) => ({
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
        return (
          <section key={section.title} className="home-section">
            <div className="section-header">{section.title}</div>
            <div className="product-grid">
              {cards.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )
      })}
    </>
  )
}

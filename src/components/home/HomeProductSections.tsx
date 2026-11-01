import { ProductCard, type ProductCardData } from '@/components/product/ProductCard'

type SectionProduct = {
  id: number
  slug: string
  name: string
  priceBdt: number
  salePriceBdt: number | null
  image: string
  orderCount: number
  firstSoldYear?: number | null
  shortDescription?: string
}

export function HomeProductSections({
  sections,
}: {
  sections: { title: string; cols?: number; products: SectionProduct[] }[]
}) {
  return (
    <>
      {sections.map((section) => {
        if (!section.products || section.products.length === 0) return null
        const cards: ProductCardData[] = section.products.map((p) => ({
          id: p.id, slug: p.slug, name: p.name,
          priceBdt: p.priceBdt, salePriceBdt: p.salePriceBdt,
          image: p.image, orderCount: p.orderCount,
          firstSoldYear: p.firstSoldYear, shortDescription: p.shortDescription,
        }))
        const colClass = section.cols === 4 ? 'home-section home-section-4' : 'home-section home-section-3'
        return (
          <section key={section.title} className={colClass}>
            <div className="section-header">{section.title}</div>
            <div className="product-grid">
              {cards.map((p) => (<ProductCard key={p.id} p={p} />))}
            </div>
          </section>
        )
      })}
    </>
  )
}

import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard'
import { db } from '@/lib/db'
import { toNumber } from '@/lib/money'

export const revalidate = 300

export default async function SaleItemsPage() {
  const products = await db.product.findMany({
    where: { isActive: true, salePriceBdt: { not: null } },
    include: { i18n: { where: { locale: 'en' } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
    take: 48,
  })

  const cards: ProductCardData[] = products.map((p) => ({
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
    <StorefrontShell withSidebar>
      <div style={{ padding: '12px 16px' }}>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Sale Items' }]} />
        <h1 className="category-h1">Sale Items — 5%-10% Off</h1>
        <p className="category-desc">Grab these discounted gifts while stocks last!</p>
        {cards.length === 0 ? (
          <p className="muted">No sale items right now. Check back soon!</p>
        ) : (
          <div className="product-grid">
            {cards.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </StorefrontShell>
  )
}

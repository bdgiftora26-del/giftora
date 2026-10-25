import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import Link from 'next/link'
import { db } from '@/lib/db'
import { ProductGridClient } from '@/components/product/ProductGridClient'

export const dynamic = "force-dynamic"

export default async function CataloguePage() {
  const categories = await db.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { i18n: { where: { locale: 'en' } }, children: { include: { i18n: { where: { locale: 'en' } } } } },
  })

  return (
    <StorefrontShell withSidebar>
      <div style={{ padding: '12px 16px' }}>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Catalogue' }]} />
        <h1 className="category-h1">Full Catalogue</h1>
        <p className="category-desc">Browse all our gift categories. Click any category to see products.</p>

        {categories.map((cat) => {
          const name = cat.i18n[0]?.name || cat.slug
          return (
            <div key={cat.id} style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, color: 'var(--c-green-dark)' }}>
                <Link href={`/${cat.slug}`}>{name}</Link>
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
                <Link href={`/${cat.slug}`} className="text-green">All {name} »</Link>
                {cat.children.map((ch) => {
                  const chName = ch.i18n[0]?.name || ch.slug
                  return (
                    <span key={ch.id}>
                      <span className="muted">|</span>{' '}
                      <Link href={`/${cat.slug}/${ch.slug}`} className="text-green">{chName}</Link>
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}

        <h2 className="category-h1 mt-4">All Products</h2>
        <ProductGridClient url="/api/products?sort=default" />
      </div>
    </StorefrontShell>
  )
}

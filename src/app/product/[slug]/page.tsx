import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { Price } from '@/components/Price'
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard'
import { AddToBasket, type VariantData } from '@/components/product/AddToBasket'
import { toNumber } from '@/lib/money'
import type { Metadata } from 'next'

export const revalidate = 600
export const dynamicParams = true
const LOCALE = 'en'


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const locale = LOCALE
  const product = await db.product.findUnique({
    where: { slug },
    include: { i18n: { where: { locale } }, categories: { include: { category: { include: { i18n: true } } } } },
  })
  if (!product) return {}
  const name = product.i18n[0]?.name || product.slug
  const desc = product.i18n[0]?.shortDescription || `${name} — BDGiftora`
  return {
    title: name,
    description: desc,
    openGraph: { title: name, description: desc, images: [] },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const locale = LOCALE

  const product = await db.product.findUnique({
    where: { slug },
    include: {
      i18n: { where: { locale } },
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
      categories: { include: { category: { include: { i18n: true } } } },
      relatedFrom: { include: { to: { include: { i18n: { where: { locale } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } } } } },
    },
  })

  if (!product || !product.isActive) notFound()

  const name = product.i18n[0]?.name || product.slug
  const description = product.i18n[0]?.description || product.i18n[0]?.shortDescription || ''
  const price = product.salePriceBdt ? toNumber(product.salePriceBdt) : toNumber(product.priceBdt)

  // Breadcrumb from first category
  const cat = product.categories[0]?.category
  const crumbs = [
    { label: 'Home', href: '/' },
    ...(cat
      ? [
          {
            label: cat.i18n.find((i) => i.locale === locale)?.name || cat.slug,
            href: `/${cat.slug}`,
          },
        ]
      : []),
    { label: name },
  ]

  const variants: VariantData[] = product.variants.map((v) => ({
    id: v.id,
    label: v.label,
    priceBdt: toNumber(v.priceBdt),
    stockQty: v.stockQty,
  }))

  const related: ProductCardData[] = product.relatedFrom
    .map((r) => r.to)
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.i18n[0]?.name || p.slug,
      priceBdt: toNumber(p.priceBdt),
      salePriceBdt: p.salePriceBdt ? toNumber(p.salePriceBdt) : null,
      image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
      orderCount: p.orderCount,
      firstSoldYear: p.firstSoldYear,
    }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: product.i18n[0]?.shortDescription || name,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: 'BDT',
      availability:
        product.stockMode === 'TRACKED' && (product.stockQty ?? 0) <= 0
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
    },
  }

  return (
    <StorefrontShell withSidebar activeSlug={cat?.slug}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumb items={crumbs} />

      <div className="product-detail-top">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[0]?.url || '/placeholders/products/generic-01.svg'}
            alt={name}
            className="product-main-img"
            width={300}
            height={300}
          />
          {product.images.length > 1 && (
            <div className="product-thumbs">
              {product.images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={img.id} src={img.url} alt={img.alt || name} className="product-thumb" width={60} height={60} />
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="product-detail-h1">{name}</h1>
          <div className="product-info-row">
            <span className="product-info-label">Price:</span>
            <span className="product-price-big">
              <Price bdt={price} />
            </span>
            {product.orderCount > 0 && product.firstSoldYear && (
              <span className="product-orders-small">
                {product.orderCount} orders since {product.firstSoldYear}
              </span>
            )}
          </div>
          <div className="product-info-row">
            <span className="product-info-label">Stock:</span>
            <span>
              {product.stockMode === 'TRACKED'
                ? (product.stockQty ?? 0) > 0
                  ? `In Stock: ${product.stockQty}`
                  : 'Out of Stock'
                : 'In Stock'}
            </span>
          </div>
          <div className="product-info-row">
            <span className="product-info-label">Product Code:</span>
            <span>{product.sku}</span>
          </div>

          <AddToBasket
            productId={product.id}
            slug={product.slug}
            name={name}
            image={product.images[0]?.url || '/placeholders/products/generic-01.svg'}
            basePriceBdt={toNumber(product.priceBdt)}
            isCake={product.isCake}
            type={product.type}
            stockMode={product.stockMode}
            stockQty={product.stockQty}
            variants={variants}
          />
        </div>
      </div>

      <section className="product-section">
        <h2 className="product-section-h2">Product Information</h2>
        {description ? (
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--c-text-soft)' }}>
            {description.split('\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : (
          <p className="muted">No description available.</p>
        )}
        <div className="product-info-row mt-2">
          <span className="product-info-label">🎁 Product Code:</span>
          <span>{product.sku}</span>
        </div>
      </section>

      {related.length > 0 && (
        <section className="product-section">
          <h2 className="product-section-h2">Customers who bought this also bought…</h2>
          <div className="related-grid">
            {related.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
    </StorefrontShell>
  )
}

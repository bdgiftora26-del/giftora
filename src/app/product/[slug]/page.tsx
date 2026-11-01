import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { Price } from '@/components/Price'
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard'
import { AddToBasket, type VariantData, type AddOnProduct } from '@/components/product/AddToBasket'

import { toNumber } from '@/lib/money'
import { cached } from '@/lib/cache'
import { tag, TTL as CACHE_TTL } from '@/lib/cache-tags'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
const LOCALE = 'en'


// Static metadata (no DB query at build time — avoids Vercel build failures)
export const metadata: Metadata = {
  title: 'Product — BDGiftora.com',
  description: 'Send gifts to Bangladesh. Serving since 2004.',
}

// All DB work for this page, cached per-slug (30 min). Invalidation:
//   - product PATCH/DELETE for this slug → bustProduct(slug) drops it.
//   - any product mutation → bustProduct() drops `products` tag (not this one,
//     but cross-sell/add-ons are shared product data so we include `products`).
type ProductDetail = Awaited<ReturnType<typeof loadProductDetail>>
async function loadProductDetail(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      i18n: { where: { locale: LOCALE } },
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
      categories: { include: { category: { include: { i18n: true } } } },
      relatedFrom: { include: { to: { include: { i18n: { where: { locale: LOCALE } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } } } } },
    },
  })
  if (!product || !product.isActive) return null

  const catIds = product.categories.map((c) => c.categoryId)
  const [sameCatProducts, addOnProducts] = await Promise.all([
    db.product.findMany({
      where: { isActive: true, id: { not: product.id }, categories: { some: { categoryId: { in: catIds } } } },
      select: { id: true, slug: true, priceBdt: true, salePriceBdt: true, orderCount: true, firstSoldYear: true, i18n: { where: { locale: LOCALE }, select: { name: true } }, images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } } },
      orderBy: { orderCount: 'desc' }, take: 4,
    }),
    db.product.findMany({
      where: { sku: { startsWith: "ADD-" }, isActive: true },
      select: { id: true, slug: true, priceBdt: true, i18n: { where: { locale: LOCALE }, select: { name: true } } },
      orderBy: { sku: "asc" },
    }),
  ])
  return { product, sameCatProducts, addOnProducts }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const result = await cached(
    `product:${slug}`,
    [tag.product(slug), tag.products()],
    CACHE_TTL.PRODUCT_DETAIL,
    () => loadProductDetail(slug),
  )
  if (!result) notFound()

  const { product, sameCatProducts, addOnProducts } = result
  const locale = LOCALE

  const name = product.i18n[0]?.name || product.slug
  const description = product.i18n[0]?.description || ''
  const featuresStr = product.i18n[0]?.shortDescription || ''
  const features = featuresStr ? featuresStr.split('|').filter(Boolean) : []
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

  // Cross-sell + add-ons are loaded inside the cached loader (no extra DB hits
  // here). `sameCatProducts` → crossSell, `addOnProducts` → addOns.
  const crossSell: ProductCardData[] = sameCatProducts.map((p) => ({
    id: p.id, slug: p.slug, name: p.i18n[0]?.name || p.slug,
    priceBdt: toNumber(p.priceBdt), salePriceBdt: p.salePriceBdt ? toNumber(p.salePriceBdt) : null,
    image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
    orderCount: p.orderCount, firstSoldYear: p.firstSoldYear,
  }))
  const addOns: AddOnProduct[] = addOnProducts.map((p) => ({
    id: p.id, slug: p.slug, name: p.i18n[0]?.name || p.slug, priceBdt: toNumber(p.priceBdt),
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
          {features.length > 0 && (
            <div className="product-features">
              <ul>
                {features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
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
            addOns={addOns}
          />
        </div>
      </div>

      {crossSell.length > 0 && (
        <section className="product-section">
          <h2 className="product-section-h2">Related Products</h2>
          <div className="related-grid">
            {crossSell.slice(0, 4).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
    </StorefrontShell>
  )
}

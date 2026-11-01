import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { Price } from '@/components/Price'
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard'
import { AddToBasket, type VariantData } from '@/components/product/AddToBasket'
import { ProductTabs } from '@/components/product/ProductTabs'
import { toNumber } from '@/lib/money'
import type { Metadata } from 'next'

export const revalidate = 600
export const dynamic = 'force-dynamic'
const LOCALE = 'en'


// Static metadata (no DB query at build time — avoids Vercel build failures)
export const metadata: Metadata = {
  title: 'Product — BDGiftora.com',
  description: 'Send gifts to Bangladesh. Serving since 2004.',
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

  // Fetch cross-sell products (same category, excluding current)
  let crossSell: ProductCardData[] = []
  let alsoBought: ProductCardData[] = []
  try {
    const catIds = product.categories.map((c) => c.categoryId)
    const sameCatProducts = await db.product.findMany({
      where: { isActive: true, id: { not: product.id }, categories: { some: { categoryId: { in: catIds } } } },
      include: { i18n: { where: { locale } }, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
      orderBy: { orderCount: 'desc' },
      take: 4,
    })
    crossSell = sameCatProducts.map((p) => ({
      id: p.id, slug: p.slug, name: p.i18n[0]?.name || p.slug,
      priceBdt: toNumber(p.priceBdt), salePriceBdt: p.salePriceBdt ? toNumber(p.salePriceBdt) : null,
      image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
      orderCount: p.orderCount, firstSoldYear: p.firstSoldYear,
    }))
    alsoBought = related.length > 0 ? related : crossSell.slice().reverse()
  } catch {}

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

      <ProductTabs
        description={description}
        productCode={product.sku}
        crossSell={crossSell}
        alsoBought={alsoBought}
      />
    </StorefrontShell>
  )
}

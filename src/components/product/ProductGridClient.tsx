'use client'

import { useState, useEffect } from 'react'
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard'

export function ProductGridClient({ url }: { url: string }) {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return
        setProducts(
          (d.products || []).map((p: ProductCardData & { salePriceBdt?: number | null }) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            priceBdt: p.priceBdt,
            salePriceBdt: p.salePriceBdt ?? null,
            image: p.image,
            orderCount: p.orderCount,
            firstSoldYear: p.firstSoldYear,
            shortDescription: p.shortDescription,
          })),
        )
        setLoading(false)
      })
      .catch(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [url])

  if (loading) return <p className="muted">Loading…</p>
  if (products.length === 0) return <p className="muted">No products found.</p>
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  )
}

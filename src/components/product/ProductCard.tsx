import Link from 'next/link'
import { Price } from '@/components/Price'
import { toNumber } from '@/lib/money'
import { ShoppingCart, Heart } from 'lucide-react'

export type ProductCardData = {
  id: number
  slug: string
  name: string
  priceBdt: number | string
  salePriceBdt?: number | string | null
  image: string
  orderCount: number
  firstSoldYear?: number | null
  shortDescription?: string | null
}

export function ProductCard({ p }: { p: ProductCardData }) {
  const price = p.salePriceBdt ? toNumber(p.salePriceBdt) : toNumber(p.priceBdt)
  return (
    <Link href={`/product/${p.slug}`} className="product-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.image} alt={p.name} className="product-card-img" />
      <div className="product-card-name">{p.name}</div>
      <div className="product-card-price">
        <Price bdt={price} />
      </div>
      {p.orderCount > 0 && p.firstSoldYear && (
        <div className="product-card-orders">
          {p.orderCount} orders since {p.firstSoldYear}
        </div>
      )}
      <div className="product-card-actions">
        <span className="product-card-action">
          <ShoppingCart size={12} /> Add to
        </span>
        <span className="product-card-action">
          <Heart size={12} /> Save
        </span>
        <span className="product-card-details">Details</span>
      </div>
    </Link>
  )
}

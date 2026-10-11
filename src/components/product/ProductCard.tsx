import Link from 'next/link'
import { Price } from '@/components/Price'
import { toNumber } from '@/lib/money'

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
      <img src={p.image} alt={p.name} className="product-card-img" width={120} height={120} />
      <div className="product-card-name">{p.name}</div>
      <div className="product-card-price">
        <Price bdt={price} />
      </div>
      {p.orderCount > 0 && p.firstSoldYear && (
        <div className="product-card-orders">
          {p.orderCount} orders since {p.firstSoldYear}
        </div>
      )}
      {p.shortDescription && (
        <div className="product-card-desc">
          {p.shortDescription.slice(0, 120)}
          <span className="product-card-details">...Details</span>
        </div>
      )}
    </Link>
  )
}

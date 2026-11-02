import Link from 'next/link'
import Image from 'next/image'
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

// Card thumbnail size — the visible image box in the grid is ~190x190.
// `next/image` will fetch a single optimized webp/avif at this size instead
// of the original JPEG (often 500KB–2MB), cutting image bytes per card by
// ~95% on average. The `sizes` attr tells the browser which srcset entry to
// pick so we don't over-fetch on mobile.
const CARD_IMG_SIZE = 220

export function ProductCard({ p }: { p: ProductCardData }) {
  const price = p.salePriceBdt ? toNumber(p.salePriceBdt) : toNumber(p.priceBdt)
  // Local placeholder SVGs are served from /placeholders/* (same origin).
  // External product images are served from Supabase storage — both are
  // handled by next/image now that `images.remotePatterns` is configured.
  const isPlaceholder = p.image?.startsWith('/placeholders/')
  return (
    <Link href={`/product/${p.slug}`} className="product-card">
      {isPlaceholder ? (
        // Placeholders are tiny SVGs — no benefit running them through the
        // optimizer, and they'd otherwise 404 against /_next/image. Use a
        // plain <img>.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt={p.name} className="product-card-img" />
      ) : (
        <Image
          src={p.image}
          alt={p.name}
          width={CARD_IMG_SIZE}
          height={CARD_IMG_SIZE}
          className="product-card-img"
          sizes="(max-width: 768px) 45vw, (max-width: 1200px) 22vw, 200px"
          loading="lazy"
          // `unoptimized` for non-http(s) paths (data: URLs, etc.) — safe default.
          unoptimized={!p.image.startsWith('http') && !p.image.startsWith('/')}
        />
      )}
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

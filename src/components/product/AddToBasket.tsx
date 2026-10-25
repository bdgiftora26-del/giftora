'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCart } from '@/components/providers'

export type VariantData = {
  id: number
  label: string
  priceBdt: number
  stockQty: number | null
}

export function AddToBasket({
  productId,
  slug,
  name,
  image,
  basePriceBdt,
  isCake,
  type,
  stockMode,
  stockQty,
  variants,
}: {
  productId: number
  slug: string
  name: string
  image: string
  basePriceBdt: number
  isCake: boolean
  type: string
  stockMode: string
  stockQty: number | null
  variants: VariantData[]
}) {
  const cart = useCart()
  const router = useRouter()
  const [variantId, setVariantId] = useState<number | undefined>(variants[0]?.id)
  const [qty, setQty] = useState(1)
  const [cakeMessage, setCakeMessage] = useState('')

  const selectedVariant = variants.find((v) => v.id === variantId)
  const priceBdt = selectedVariant ? selectedVariant.priceBdt : basePriceBdt

  const maxQty =
    stockMode === 'TRACKED'
      ? Math.min(20, selectedVariant?.stockQty ?? stockQty ?? 20)
      : 20

  const outOfStock = stockMode === 'TRACKED' && (selectedVariant?.stockQty ?? stockQty ?? 0) <= 0

  const onAdd = () => {
    if (outOfStock) return
    cart.addItem({
      productId,
      slug,
      name,
      image,
      priceBdt,
      variantId,
      variantLabel: selectedVariant?.label,
      qty,
      cakeMessage: isCake && cakeMessage ? cakeMessage.slice(0, 40) : undefined,
    })
    toast.success(`${name} added to basket`)
    router.push('/cart')
  }

  return (
    <div>
      {variants.length > 0 && (
        <div className="product-info-row">
          <span className="product-info-label">Variant:</span>
          <select
            value={variantId}
            onChange={(e) => setVariantId(Number(e.target.value))}
            className="qty-select"
            style={{ width: 'auto' }}
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {isCake && (
        <div className="product-info-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <label className="product-info-label" style={{ textAlign: 'left', width: 'auto' }}>
            Message on cake <span className="muted">(max 40 chars)</span>
          </label>
          <input
            type="text"
            maxLength={40}
            value={cakeMessage}
            onChange={(e) => setCakeMessage(e.target.value)}
            placeholder="Happy Birthday!"
          />
        </div>
      )}
      <div className="product-info-row">
        <span className="product-info-label">Quantity:</span>
        <select
          className="qty-select"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        >
          {Array.from({ length: Math.max(1, maxQty) }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <button type="button" className="add-basket-btn" onClick={onAdd} disabled={outOfStock}>
        {outOfStock ? 'Out of Stock' : 'Add to Basket'}
      </button>
    </div>
  )
}

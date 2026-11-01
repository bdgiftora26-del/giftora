'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCart, useCurrency } from '@/components/providers'
import { Price } from '@/components/Price'

export type VariantData = { id: number; label: string; priceBdt: number; stockQty: number | null }
export type AddOnProduct = { id: number; slug: string; name: string; priceBdt: number }

export function AddToBasket({
  productId, slug, name, image, basePriceBdt, isCake, type, stockMode, stockQty, variants, addOns,
}: {
  productId: number; slug: string; name: string; image: string; basePriceBdt: number;
  isCake: boolean; type: string; stockMode: string; stockQty: number | null;
  variants: VariantData[]; addOns: AddOnProduct[];
}) {
  const cart = useCart()
  const router = useRouter()
  const [variantId, setVariantId] = useState<number | undefined>(variants[0]?.id)
  const [qty, setQty] = useState(1)
  const [cakeMessage, setCakeMessage] = useState('')
  const [specialInstruction, setSpecialInstruction] = useState('')
  const [selectedAddOns, setSelectedAddOns] = useState<Set<number>>(new Set())

  const selectedVariant = variants.find((v) => v.id === variantId)
  const priceBdt = selectedVariant ? selectedVariant.priceBdt : basePriceBdt
  const maxQty = stockMode === 'TRACKED' ? Math.min(20, selectedVariant?.stockQty ?? stockQty ?? 20) : 20
  const outOfStock = stockMode === 'TRACKED' && (selectedVariant?.stockQty ?? stockQty ?? 0) <= 0

  const toggleAddOn = (id: number) => {
    setSelectedAddOns((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  const onAdd = () => {
    if (outOfStock) return
    cart.addItem({ productId, slug, name, image, priceBdt, variantId, variantLabel: selectedVariant?.label, qty, cakeMessage: isCake && cakeMessage ? cakeMessage.slice(0, 40) : undefined })
    addOns.forEach((a) => { if (selectedAddOns.has(a.id)) cart.addItem({ productId: a.id, slug: a.slug, name: a.name, image: '/placeholders/products/generic-01.svg', priceBdt: a.priceBdt, qty: 1 }) })
    toast.success(`${name} added to basket`)
    router.push('/cart')
  }

  return (
    <div className="product-right-column">
      {variants.length > 0 && (
        <div className="product-info-row"><span className="product-info-label">Variant:</span>
          <select value={variantId} onChange={(e) => setVariantId(Number(e.target.value))} className="qty-select" style={{ width: 'auto' }}>
            {variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
      )}
      {isCake && (
        <div className="product-addon-section">
          <label className="product-addon-label">Message on cake <span className="muted">(max 40 chars)</span></label>
          <input type="text" maxLength={40} value={cakeMessage} onChange={(e) => setCakeMessage(e.target.value)} placeholder="Happy Birthday!" className="product-addon-input" />
        </div>
      )}
      {addOns.length > 0 && (
        <div className="product-addons-section">
          <div className="product-addons-title">Make It Extra Special With:</div>
          <div className="product-addons-list">
            {addOns.map((a) => (
              <label key={a.id} className="product-addon-item">
                <input type="checkbox" checked={selectedAddOns.has(a.id)} onChange={() => toggleAddOn(a.id)} />
                <span className="product-addon-name">{a.name}</span>
                <span className="product-addon-price">+ <Price bdt={a.priceBdt} /></span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="product-addon-section">
        <label className="product-addon-label">Special Instruction</label>
        <textarea value={specialInstruction} onChange={(e) => setSpecialInstruction(e.target.value)} placeholder="Write your message here" rows={2} className="product-addon-textarea" />
      </div>
      <div className="product-info-row" style={{ gap: 10, marginTop: 10 }}>
        <span className="product-info-label">Quantity</span>
        <div className="qty-control">
          <button type="button" className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <input type="text" className="qty-input" value={qty} readOnly />
          <button type="button" className="qty-btn" onClick={() => setQty(Math.min(maxQty, qty + 1))}>+</button>
        </div>
      </div>
      <button type="button" className="add-basket-btn" onClick={onAdd} disabled={outOfStock} style={{ marginTop: 12 }}>
        {outOfStock ? 'Out of Stock' : 'ADD TO CART'}
      </button>
    </div>
  )
}

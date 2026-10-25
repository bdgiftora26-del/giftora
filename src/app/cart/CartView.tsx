'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCart, useCurrency, useT } from '@/components/providers'
import { Price } from '@/components/Price'

export function CartView() {
  const cart = useCart()
  const { currency } = useCurrency()
  const t = useT()
  const [coupon, setCoupon] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent?: number; fixed?: number; error?: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCoupon(cart.couponCode || '')
  }, [cart.couponCode])

  const subtotalBdt = cart.items.reduce((s, i) => s + i.priceBdt * i.qty, 0)

  let discountBdt = 0
  if (appliedCoupon?.percent) discountBdt = (subtotalBdt * appliedCoupon.percent) / 100
  if (appliedCoupon?.fixed) discountBdt = appliedCoupon.fixed
  const totalBdt = Math.max(0, subtotalBdt - discountBdt)

  const applyCoupon = async () => {
    if (!coupon.trim()) return
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon.trim(), subtotalBdt }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAppliedCoupon({ code: coupon, error: data.error || 'Invalid coupon' })
      } else {
        setAppliedCoupon({
          code: data.code,
          percent: data.kind === 'PERCENT' ? Number(data.value) : undefined,
          fixed: data.kind === 'FIXED' ? Number(data.value) : undefined,
        })
        cart.setCoupon(data.code)
      }
    } catch {
      setAppliedCoupon({ code: coupon, error: 'Failed to validate' })
    }
  }

  if (!mounted) return null

  return (
    <div style={{ padding: '12px 16px' }}>
      <div className="checkout-title-row">
        <h1 className="checkout-title">Basket</h1>
        <div className="checkout-steps">
          <span className="step-current">Basket</span> → Checkout → Payment → Complete →
        </div>
      </div>

      {cart.items.length === 0 ? (
        <div className="alert alert-info">
          <p>{t('Cart.Empty')}</p>
          <Link href="/catalogue" className="btn-green mt-2" style={{ display: 'inline-block' }}>
            {t('Cart.ContinueBrowsing')}
          </Link>
        </div>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th>{t('Cart.Image')}</th>
                <th>{t('Cart.Name')}</th>
                <th>{t('Cart.Qty')}</th>
                <th>{t('Cart.UnitPrice')}</th>
                <th>{t('Cart.Total')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={`${item.productId}-${item.variantId ?? 'none'}`}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} width={60} height={60} />
                  </td>
                  <td>
                    <Link href={`/product/${item.slug}`}>{item.name}</Link>
                    {item.variantLabel && <div className="muted">({item.variantLabel})</div>}
                    {item.cakeMessage && <div className="muted">Cake: &ldquo;{item.cakeMessage}&rdquo;</div>}
                  </td>
                  <td>
                    <select
                      className="cart-qty-select"
                      value={item.qty}
                      onChange={(e) =>
                        cart.updateQty(item.productId, item.variantId, Number(e.target.value))
                      }
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <Price bdt={item.priceBdt} />
                  </td>
                  <td>
                    <Price bdt={item.priceBdt * item.qty} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="cart-remove"
                      onClick={() => cart.removeItem(item.productId, item.variantId)}
                    >
                      {t('Cart.Remove')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-coupon-row">
            <label>{t('Cart.CouponCode')}:</label>
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="GIFT, SUMMER, WELCOME, BD50"
              style={{ width: 160 }}
            />
            <button type="button" className="btn-green" onClick={applyCoupon}>
              {t('Cart.Apply')}
            </button>
            {appliedCoupon?.error && <span className="text-red">{appliedCoupon.error}</span>}
            {appliedCoupon && !appliedCoupon.error && (
              <span className="text-green">Coupon &ldquo;{appliedCoupon.code}&rdquo; applied!</span>
            )}
          </div>

          <div className="cart-totals">
            <div className="cart-totals-row">
              <span>{t('Cart.Subtotal')}</span>
              <Price bdt={subtotalBdt} />
            </div>
            {discountBdt > 0 && (
              <div className="cart-totals-row text-green">
                <span>{t('Cart.Discount')}</span>
                <span>-<Price bdt={discountBdt} /></span>
              </div>
            )}
            <div className="cart-totals-row">
              <span>{t('Cart.Delivery')}</span>
              <span className="muted">calculated at checkout</span>
            </div>
            <div className="cart-totals-row cart-totals-grand">
              <span>{t('Cart.GrandTotal')}</span>
              <Price bdt={totalBdt} />
            </div>
          </div>

          <div className="cart-actions">
            <Link href="/catalogue" className="btn-orange">
              {t('Cart.ContinueShopping')}
            </Link>
            <Link href="/checkout/login" className="btn-green">
              {t('Cart.Checkout')}
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, useCurrency } from '@/components/providers'
import { Price } from '@/components/Price'
import Link from 'next/link'

const PROVIDERS = [
  {
    id: 'manual-bank',
    label: 'Bank Deposit',
    desc: 'Transfer to our bank account and upload the deposit slip. We verify and confirm your order.',
    type: 'manual',
  },
  {
    id: 'manual-bkash',
    label: 'bKash (Personal)',
    desc: 'Send money to our personal bKash number and enter the transaction ID.',
    type: 'manual',
  },
  {
    id: 'manual-western-union',
    label: 'Western Union',
    desc: 'Send via Western Union and upload the receipt.',
    type: 'manual',
  },
  {
    id: 'sslcommerz',
    label: 'Online Card (SSLCommerz)',
    desc: 'Pay instantly with Visa/MasterCard via SSLCommerz (simulated in demo).',
    type: 'online',
  },
]

export function CheckoutPaymentView() {
  const cart = useCart()
  const { currency } = useCurrency()
  const router = useRouter()
  const [provider, setProvider] = useState('manual-bank')
  const [txnRef, setTxnRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (cart.items.length === 0) router.replace('/cart')
  }, [cart.items.length, router])

  const subtotalBdt = cart.items.reduce((s, i) => s + i.priceBdt * i.qty, 0)

  const onPay = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          txnRef: txnRef || undefined,
          items: cart.items,
          couponCode: cart.couponCode,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      cart.clear()
      if (data.redirect) {
        // Simulated online provider — go straight to complete
        router.push(`/checkout/complete/${data.orderNo}`)
      } else {
        router.push(`/checkout/complete/${data.orderNo}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  if (cart.items.length === 0) return null

  const selected = PROVIDERS.find((p) => p.id === provider)!

  return (
    <div>
      <div className="checkout-title-row">
        <h1 className="checkout-title">Payment</h1>
        <div className="checkout-steps">
          Basket → Checkout → <span className="step-current">Payment</span> → Complete →
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <h3 className="form-section-title">Select Payment Method</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {PROVIDERS.map((p) => (
          <label
            key={p.id}
            className="privacy-check"
            style={{
              border: `1px solid ${provider === p.id ? 'var(--c-green)' : 'var(--c-line)'}`,
              padding: 10,
              cursor: 'pointer',
              background: provider === p.id ? 'var(--c-green-soft)' : '#fff',
            }}
          >
            <input
              type="radio"
              name="provider"
              value={p.id}
              checked={provider === p.id}
              onChange={() => setProvider(p.id)}
            />
            <span>
              <strong>{p.label}</strong>
              <br />
              <span className="muted" style={{ fontSize: 11 }}>{p.desc}</span>
            </span>
          </label>
        ))}
      </div>

      {selected.type === 'manual' && (
        <div className="alert alert-info">
          <p style={{ fontWeight: 600, marginBottom: 6 }}>How to pay via {selected.label}:</p>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
            <li>Place your order below — you&apos;ll get an order number.</li>
            <li>Send the payment to the details shown on the confirmation page.</li>
            <li>Upload your deposit slip / enter transaction ID in your account or track-order page.</li>
            <li>We verify and mark your order as paid (usually within a few hours).</li>
          </ol>
          <div className="checkout-form-row mt-2" style={{ marginLeft: 0 }}>
            <label style={{ width: 'auto', textAlign: 'left' }}>Transaction ID (optional now)</label>
            <input
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
              placeholder="e.g. bKash TXN123456"
              style={{ maxWidth: 240 }}
            />
          </div>
        </div>
      )}

      <h3 className="form-section-title">Order Summary</h3>
      <div className="cart-totals" style={{ maxWidth: 'none' }}>
        {cart.items.map((item) => (
          <div className="cart-totals-row" key={`${item.productId}-${item.variantId ?? 'n'}`}>
            <span>
              {item.name}
              {item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.qty}
            </span>
            <Price bdt={item.priceBdt * item.qty} />
          </div>
        ))}
        <div className="cart-totals-row cart-totals-grand">
          <span>Total (delivery added on confirmation)</span>
          <Price bdt={subtotalBdt} />
        </div>
      </div>

      <div className="cart-actions">
        <Link href="/checkout/delivery" className="btn-orange">
          « Back
        </Link>
        <button type="button" className="btn-green" onClick={onPay} disabled={loading}>
          {loading ? 'Placing order…' : selected.type === 'online' ? 'Pay Now' : 'Place Order'}
        </button>
      </div>
    </div>
  )
}

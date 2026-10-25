'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type OrderData = {
  orderNo: string
  status: string
  currency: string
  totalBdt: number
  createdAt: string
  items: { nameSnapshot: string; qty: number; unitPriceBdt: number }[]
  delivery?: { recipientName: string; city: { name: string }; deliveryDate: string; timeSlot: string } | null
  events: { type: string; note: string | null; createdAt: string }[]
}

export function TrackOrderView() {
  const sp = useSearchParams()
  const [orderNo, setOrderNo] = useState(sp.get('orderNo') || '')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<OrderData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setOrder(null)
    try {
      const res = await fetch(
        `/api/orders/track?orderNo=${encodeURIComponent(orderNo)}&email=${encodeURIComponent(email)}`,
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Not found')
      setOrder(data.order)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '12px 16px', maxWidth: 700, margin: '0 auto' }}>
      <h1 className="category-h1">Track Your Order</h1>
      <p className="checkout-helper">
        Enter your order number and the email you used at checkout to see your order status.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={onTrack} style={{ marginBottom: 20 }}>
        <div className="checkout-form-row">
          <label>Order Number <span className="req">*</span></label>
          <input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} required placeholder="UB-2025-000001" />
        </div>
        <div className="checkout-form-row">
          <label>Email <span className="req">*</span></label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="submit-row">
          <button type="submit" className="btn-green" disabled={loading}>
            {loading ? 'Tracking…' : 'Track Order'}
          </button>
        </div>
      </form>

      {order && (
        <div>
          <div className="alert alert-info">
            <strong>Order {order.orderNo}</strong> — Status:{' '}
            <strong style={{ color: 'var(--c-green-dark)' }}>{order.status.replace(/_/g, ' ')}</strong>
            <br />
            <span className="muted">Placed on {new Date(order.createdAt).toLocaleString()}</span>
          </div>

          <h3 className="form-section-title">Items</h3>
          <table className="cart-table">
            <tbody>
              {order.items.map((it, i) => (
                <tr key={i}>
                  <td>{it.nameSnapshot}</td>
                  <td>×{it.qty}</td>
                  <td>৳{Number(it.unitPriceBdt).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {order.delivery && (
            <p style={{ fontSize: 12 }}>
              Delivering to <strong>{order.delivery.recipientName}</strong> in{' '}
              <strong>{order.delivery.city.name}</strong> on{' '}
              {new Date(order.delivery.deliveryDate).toLocaleDateString()} ({order.delivery.timeSlot})
            </p>
          )}

          <h3 className="form-section-title">Timeline</h3>
          <ol style={{ fontSize: 12, paddingLeft: 18 }}>
            {order.events.map((ev, i) => (
              <li key={i}>
                <strong>{ev.type.replace(/_/g, ' ')}</strong> — {new Date(ev.createdAt).toLocaleString()}
                {ev.note && <span className="muted"> — {ev.note}</span>}
              </li>
            ))}
          </ol>

          <p style={{ marginTop: 12, fontSize: 12 }}>
            Need to upload a payment slip?{' '}
            <Link href={`/track-order?orderNo=${order.orderNo}`} className="text-green">
              Use the upload form below
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}

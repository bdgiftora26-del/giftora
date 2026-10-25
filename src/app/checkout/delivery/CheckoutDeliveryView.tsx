'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/providers'

export function CheckoutDeliveryView({ cities }: { cities: { id: number; slug: string; name: string; isFreeDelivery: boolean }[] }) {
  const cart = useCart()
  const router = useRouter()
  const [cityId, setCityId] = useState(cities[0]?.id ?? 1)
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [slot, setSlot] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (cart.items.length === 0) router.replace('/cart')
  }, [cart.items.length, router])

  useEffect(() => {
    if (!date) return
    fetch(`/api/delivery/slots?date=${date}&cityId=${cityId}`)
      .then((r) => r.json())
      .then((d) => {
        setSlots(d.slots || [])
        setSlot('')
      })
      .catch(() => setSlots([]))
  }, [date, cityId])

  const today = new Date().toISOString().split('T')[0]

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())
    data.cityId = String(cityId)
    try {
      const res = await fetch('/api/checkout/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      router.push('/checkout/payment')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  if (cart.items.length === 0) return null

  return (
    <div>
      <div className="checkout-title-row">
        <h1 className="checkout-title">Delivery Details</h1>
        <div className="checkout-steps">
          Basket → <span className="step-current">Checkout</span> → Payment → Complete →
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={onSubmit}>
        <h3 className="form-section-title">Recipient Details</h3>
        <div className="checkout-form-row">
          <label>Recipient Name <span className="req">*</span></label>
          <input name="recipientName" required />
        </div>
        <div className="checkout-form-row">
          <label>Recipient Phone <span className="req">*</span></label>
          <input name="recipientPhone" required />
        </div>
        <div className="checkout-form-row">
          <label>Address <span className="req">*</span></label>
          <input name="address" required />
        </div>
        <div className="checkout-form-row">
          <label>Area/Town <span className="req">*</span></label>
          <input name="area" required />
        </div>
        <div className="checkout-form-row">
          <label>City <span className="req">*</span></label>
          <select value={cityId} onChange={(e) => setCityId(Number(e.target.value))}>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isFreeDelivery ? ' (Free delivery)' : ''}
              </option>
            ))}
          </select>
        </div>

        <h3 className="form-section-title">Delivery Schedule</h3>
        <div className="checkout-form-row">
          <label>Delivery Date <span className="req">*</span></label>
          <input
            name="deliveryDate"
            type="date"
            required
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="checkout-form-row">
          <label>Time Slot <span className="req">*</span></label>
          <select
            name="timeSlot"
            required
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            disabled={!date || slots.length === 0}
          >
            <option value="">— Select —</option>
            {slots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {!date && <span className="muted" style={{ fontSize: 11 }}>Pick a date first</span>}
        </div>

        <h3 className="form-section-title">Personal Touch</h3>
        <div className="checkout-form-row" style={{ alignItems: 'flex-start' }}>
          <label style={{ marginTop: 4 }}>Greeting Card Message</label>
          <textarea name="cardMessage" rows={3} style={{ height: 'auto' }} maxLength={200} />
        </div>
        <div className="privacy-check">
          <input type="checkbox" name="hideSender" />
          <span>Hide sender name from recipient</span>
        </div>
        <div className="checkout-form-row" style={{ alignItems: 'flex-start' }}>
          <label style={{ marginTop: 4 }}>Order Notes</label>
          <textarea name="notes" rows={2} style={{ height: 'auto' }} maxLength={300} />
        </div>

        <div className="submit-row">
          <button type="submit" className="btn-green" disabled={loading}>
            {loading ? 'Submitting…' : 'Continue to Payment'}
          </button>
        </div>
      </form>
    </div>
  )
}

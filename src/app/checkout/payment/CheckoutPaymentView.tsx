'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, useCurrency } from '@/components/providers'
import { Price } from '@/components/Price'
import Link from 'next/link'
import { AlertCircle, Phone, Mail, Clock, ShieldCheck } from 'lucide-react'

type ReceiverInfo = {
  label: string
  value: string
  hint?: string
}

type PaymentMethod = {
  id: string
  label: string
  desc: string
  type: 'manual' | 'online' | 'deferred'
  receiver?: ReceiverInfo
}

// Validate a Bangladeshi phone number (bKash sender).
const BKASH_NUMBER_RE = /^(?:\+?880|0)1[3-9]\d{8}$/
const BKASH_TRXID_RE = /^[A-Z0-9]{8,16}$/

export function CheckoutPaymentView() {
  const cart = useCart()
  const { currency } = useCurrency()
  const router = useRouter()

  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [methodsLoading, setMethodsLoading] = useState(true)
  const [provider, setProvider] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // bKash-specific fields (only shown if admin ever enables manual-bkash)
  const [bkashSender, setBkashSender] = useState('')
  const [txnRef, setTxnRef] = useState('')
  const [copied, setCopied] = useState(false)

  // Ref flag: set to true right before we call cart.clear() + navigate to
  // the complete page. Without this, the useEffect below sees the empty
  // cart (after clear) and races our router.push — the user ends up at
  // /cart instead of /checkout/complete/[orderNo].
  const placingOrderRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/payment-methods')
        const data = await res.json()
        if (cancelled) return
        const list: PaymentMethod[] = data.methods || []
        setMethods(list)
        if (list.length > 0 && !provider) setProvider(list[0].id)
      } catch {
        if (!cancelled) setMethods([])
      } finally {
        if (!cancelled) setMethodsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Skip the "empty cart" redirect when we're intentionally clearing
    // the cart as part of order placement — otherwise this fires between
    // cart.clear() and router.push('/checkout/complete/...'), stealing
    // the navigation and sending the user to /cart instead.
    if (placingOrderRef.current) return
    if (cart.items.length === 0) router.replace('/cart')
  }, [cart.items.length, router])

  const subtotalBdt = cart.items.reduce((s, i) => s + i.priceBdt * i.qty, 0)

  const selected = methods.find((m) => m.id === provider)
  const isBkash = selected?.id === 'manual-bkash'
  const isDeferred = selected?.type === 'deferred'

  const validateBkash = (): string | null => {
    if (!isBkash) return null
    const num = bkashSender.trim()
    if (!num) return 'Please enter your bKash sender number.'
    if (!BKASH_NUMBER_RE.test(num)) {
      return 'Enter a valid Bangladeshi mobile number (e.g. 01XXXXXXXXX or +8801XXXXXXXXX).'
    }
    const trx = txnRef.trim()
    if (!trx) return 'Please enter the bKash Transaction ID (TrxID).'
    if (!BKASH_TRXID_RE.test(trx.toUpperCase())) {
      return 'Transaction ID should be 8-16 alphanumeric characters (from your bKash confirmation SMS).'
    }
    return null
  }

  const copyReceiver = async () => {
    if (!selected?.receiver) return
    try {
      await navigator.clipboard.writeText(selected.receiver.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const onPay = async () => {
    setError('')
    const verr = validateBkash()
    if (verr) {
      setError(verr)
      return
    }
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        provider,
        txnRef: txnRef.trim() || undefined,
        items: cart.items,
        couponCode: cart.couponCode,
      }
      if (isBkash) {
        payload.bkashSenderNumber = bkashSender.trim()
      }
      const res = await fetch('/api/checkout/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to place order')
      // Set the flag BEFORE clearing the cart so the empty-cart useEffect
      // doesn't redirect to /cart. Clear it after navigation starts.
      placingOrderRef.current = true
      cart.clear()
      router.push(`/checkout/complete/${data.orderNo}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (cart.items.length === 0) return null

  return (
    <div>
      <div className="checkout-title-row">
        <h1 className="checkout-title">Payment</h1>
        <div className="checkout-steps">
          Basket → Checkout → <span className="step-current">Payment</span> → Complete →
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <h3 className="form-section-title">Select Payment Method</h3>

      {methodsLoading ? (
        <p className="muted" style={{ fontSize: 12 }}>Loading payment methods…</p>
      ) : methods.length === 0 ? (
        <div className="alert alert-error">
          No payment methods are currently enabled. Please contact us to complete your order.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {methods.map((m) => (
            <label
              key={m.id}
              className="privacy-check"
              style={{
                border: `1px solid ${provider === m.id ? 'var(--c-green)' : 'var(--c-line)'}`,
                padding: 10,
                cursor: 'pointer',
                background: provider === m.id ? 'var(--c-green-soft)' : '#fff',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}
            >
              <input
                type="radio"
                name="provider"
                value={m.id}
                checked={provider === m.id}
                onChange={() => {
                  setProvider(m.id)
                  setError('')
                }}
                style={{ marginTop: 3 }}
              />
              <span>
                <strong>{m.label}</strong>
                <br />
                <span className="muted" style={{ fontSize: 11 }}>{m.desc}</span>
              </span>
            </label>
          ))}
        </div>
      )}

      {/* === DEFERRED (pay-on-contact) — the default flow ===
          Customer places the order now. Admin contacts them to arrange
          payment. Order is confirmed once payment is received. No payment
          form, no receiver number — just a clear explainer + Place Order. */}
      {selected && isDeferred && (
        <div
          className="alert alert-info"
          style={{ padding: 16, marginBottom: 16, lineHeight: 1.6 }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--c-brand-red)' }}>
            How this works
          </h3>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#444' }}>
            <li>
              <strong>Place your order now</strong> — you won&apos;t be asked to pay
              at this step. Just review and submit.
            </li>
            <li>
              <strong>Our team contacts you</strong> within a few hours (usually
              much faster during business hours) on the phone number or email you
              provided at checkout.
            </li>
            <li>
              <strong>Choose how to pay</strong> when we contact you — bKash, bank
              transfer, or another method we offer.
            </li>
            <li>
              <strong>Your order is confirmed</strong> once we receive your payment.
              You&apos;ll get a confirmation update by email/SMS.
            </li>
          </ol>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px dashed var(--c-line)',
              fontSize: 11,
              color: '#666',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> Reply within hours
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Phone size={12} /> By phone or email
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={12} /> No payment until you confirm
            </span>
          </div>
        </div>
      )}

      {/* === MANUAL (bKash / bank / WU) — only shown if admin enables one === */}
      {selected?.type === 'manual' && selected.receiver && (
        <div className="alert alert-info" style={{ padding: 14, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>
            How to pay via {selected.label}:
          </p>

          <div
            style={{
              background: '#fff',
              border: '1px solid var(--c-line)',
              borderRadius: 4,
              padding: 10,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <strong style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>
                {selected.receiver.label}
              </strong>
              <button
                type="button"
                onClick={copyReceiver}
                style={{
                  background: 'none',
                  border: '1px solid var(--c-line)',
                  borderRadius: 3,
                  padding: '2px 8px',
                  fontSize: 10,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div
              style={{
                fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--c-brand-red)',
                whiteSpace: 'pre-line',
                lineHeight: 1.5,
              }}
            >
              {selected.receiver.value}
            </div>
            {selected.receiver.hint && (
              <p style={{ marginTop: 8, fontSize: 11, color: '#666', marginBottom: 0 }}>
                💡 {selected.receiver.hint}
              </p>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 0',
              fontSize: 13,
              borderBottom: '1px dashed var(--c-line)',
              marginBottom: 10,
            }}
          >
            <span>Amount to send:</span>
            <strong style={{ fontSize: 16 }}>
              <Price bdt={subtotalBdt} />
            </strong>
          </div>

          {isBkash && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label
                  htmlFor="bkash-sender"
                  style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}
                >
                  Your bKash Number (sender) <span style={{ color: 'var(--c-brand-red)' }}>*</span>
                </label>
                <input
                  id="bkash-sender"
                  value={bkashSender}
                  onChange={(e) => setBkashSender(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  inputMode="tel"
                  autoComplete="tel"
                  style={{
                    width: '100%',
                    maxWidth: 280,
                    padding: '6px 8px',
                    border: '1px solid var(--c-line)',
                    borderRadius: 3,
                    fontSize: 13,
                  }}
                />
                <p style={{ fontSize: 11, color: '#666', marginTop: 4, marginBottom: 0 }}>
                  The bKash number you sent the money <em>from</em>. We&apos;ll match it against our records.
                </p>
              </div>
              <div>
                <label
                  htmlFor="bkash-trxid"
                  style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}
                >
                  bKash Transaction ID (TrxID) <span style={{ color: 'var(--c-brand-red)' }}>*</span>
                </label>
                <input
                  id="bkash-trxid"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  placeholder="e.g. 9X7K5P3B2N"
                  autoComplete="off"
                  style={{
                    width: '100%',
                    maxWidth: 280,
                    padding: '6px 8px',
                    border: '1px solid var(--c-line)',
                    borderRadius: 3,
                    fontSize: 13,
                    fontFamily: 'ui-monospace, Menlo, monospace',
                    textTransform: 'uppercase',
                  }}
                />
                <p style={{ fontSize: 11, color: '#666', marginTop: 4, marginBottom: 0 }}>
                  Found in your bKash confirmation SMS or app &quot;Transactions&quot; tab.
                </p>
              </div>
            </div>
          )}

          {selected.type === 'manual' && !isBkash && (
            <div>
              <label
                htmlFor="txn-ref"
                style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}
              >
                Reference / Slip Number
              </label>
              <input
                id="txn-ref"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                placeholder="Deposit slip or transfer reference"
                style={{
                  width: '100%',
                  maxWidth: 280,
                  padding: '6px 8px',
                  border: '1px solid var(--c-line)',
                  borderRadius: 3,
                  fontSize: 13,
                }}
              />
            </div>
          )}

          <p style={{ marginTop: 10, marginBottom: 0, fontSize: 11, color: '#666' }}>
            After placing the order, our team will verify your payment (usually within a few hours)
            and confirm it. You&apos;ll receive an email update.
          </p>
        </div>
      )}

      {/* Order Summary */}
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
        <button
          type="button"
          className="btn-green"
          onClick={onPay}
          disabled={loading || methods.length === 0}
        >
          {loading ? 'Placing order…' : selected?.type === 'online' ? 'Pay Now' : 'Place Order'}
        </button>
      </div>
    </div>
  )
}

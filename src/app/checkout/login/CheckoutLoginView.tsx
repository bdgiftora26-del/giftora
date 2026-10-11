'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Paperclip, Gift } from 'lucide-react'
import { useCart, useT } from '@/components/providers'

export function CheckoutLoginView() {
  const t = useT()
  const cart = useCart()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      router.push('/checkout/invoice')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="alert alert-info">
        Your basket is empty. <Link href="/catalogue">Browse our catalogue</Link>.
      </div>
    )
  }

  return (
    <div>
      <div className="checkout-title-row">
        <h1 className="checkout-title">Repeat Customer?</h1>
        <div className="checkout-steps">
          Basket → <span className="step-current">Checkout</span> → Payment → Complete →
        </div>
      </div>

      <div className="checkout-cols">
        <div className="checkout-col">
          <h2 className="checkout-block-title">
            <Clock size={20} /> Login
          </h2>
          <p className="checkout-helper">
            If you have shopped with us before, please login to continue.
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={onLogin}>
            <div className="checkout-form-row">
              <label>Email:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="checkout-form-row">
              <label>Password:</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="submit-row">
              <button type="submit" className="btn-redorange" disabled={loading}>
                {loading ? 'Logging in…' : 'Login'}
              </button>
            </div>
          </form>
          <div className="mt-2" style={{ fontSize: 12 }}>
            <Link href="/forgot-password" className="text-green">Forgot your password?</Link>
            <span className="muted"> | </span>
            <Link href="/register" className="text-green">Need to register?</Link>
          </div>
        </div>

        <div className="checkout-col checkout-divider">
          <h2 className="checkout-block-title">
            <Paperclip size={20} /> I do not have an account.
          </h2>
          <p className="checkout-helper">
            You can checkout as a guest — we&apos;ll create your account at the invoice step so you
            can track your order and reorder easily.
          </p>
          <div className="submit-row">
            <Link href="/checkout/invoice" className="btn-green">
              Continue to Checkout »
            </Link>
          </div>

          <h2 className="checkout-block-title mt-4">
            <Gift size={20} /> Continue Shopping?
          </h2>
          <p className="checkout-helper">
            Keep browsing our catalogue without checking out. Your basket will be saved.
          </p>
          <div className="submit-row">
            <Link href="/catalogue" className="btn-orange">
              Continue Shopping »
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

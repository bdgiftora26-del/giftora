'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, useT } from '@/components/providers'

const COUNTRIES = [
  { code: 'BD', name: 'Bangladesh', regions: ['Dhaka', 'Chittagong', 'Sylhet', 'Khulna', 'Rajshahi', 'Barisal', 'Rangpur', 'Mymensingh'] },
  { code: 'US', name: 'United States', regions: ['California', 'New York', 'Texas', 'Florida', 'Other'] },
  { code: 'GB', name: 'United Kingdom', regions: ['England', 'Scotland', 'Wales', 'Northern Ireland'] },
  { code: 'AU', name: 'Australia', regions: ['NSW', 'Victoria', 'Queensland', 'Other'] },
  { code: 'CA', name: 'Canada', regions: ['Ontario', 'Quebec', 'BC', 'Other'] },
  { code: 'AE', name: 'United Arab Emirates', regions: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Other'] },
  { code: 'SA', name: 'Saudi Arabia', regions: ['Riyadh', 'Jeddah', 'Mecca', 'Other'] },
  { code: 'MY', name: 'Malaysia', regions: ['Kuala Lumpur', 'Selangor', 'Other'] },
  { code: 'SG', name: 'Singapore', regions: ['Singapore'] },
  { code: 'Other', name: 'Other', regions: ['Other'] },
]

export function CheckoutInvoiceView({ loggedIn }: { loggedIn: boolean }) {
  const t = useT()
  const cart = useCart()
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [country, setCountry] = useState('BD')

  useEffect(() => {
    if (cart.items.length === 0) router.replace('/cart')
  }, [cart.items.length, router])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())
    try {
      const res = await fetch('/api/checkout/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      router.push('/checkout/delivery')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const regions = COUNTRIES.find((c) => c.code === country)?.regions || []

  if (cart.items.length === 0) return null

  return (
    <div>
      <div className="checkout-title-row">
        <h1 className="checkout-title">Your Invoice Information</h1>
        <div className="checkout-steps">
          Basket → <span className="step-current">Checkout</span> → Payment → Complete →
        </div>
      </div>

      <p className="form-note">
        Please note that all fields that have an asterisk (<span className="req">*</span>) are
        required in order to continue.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={onSubmit}>
        <h3 className="form-section-title">Your Personal Details</h3>
        <div className="checkout-form-row">
          <label>Title</label>
          <select name="invTitle" defaultValue="">
            <option value="">— Select —</option>
            <option>Mr</option>
            <option>Mrs</option>
            <option>Ms</option>
            <option>Dr</option>
          </select>
        </div>
        <div className="checkout-form-row">
          <label>First Name <span className="req">*</span></label>
          <input name="invFirstName" required />
        </div>
        <div className="checkout-form-row">
          <label>Last Name <span className="req">*</span></label>
          <input name="invLastName" required />
        </div>
        <div className="checkout-form-row">
          <label>Email Address <span className="req">*</span></label>
          <input name="invEmail" type="email" required />
        </div>
        <div className="checkout-form-row">
          <label>Phone No 1 <span className="req">*</span></label>
          <input name="invPhone1" required />
        </div>
        <div className="checkout-form-row">
          <label>Phone No 2</label>
          <input name="invPhone2" />
        </div>

        {!loggedIn && (
          <>
            <h3 className="form-section-title">Security Details</h3>
            <div className="checkout-form-row">
              <label>Choose Password <span className="req">*</span></label>
              <input name="password" type="password" required minLength={6} />
            </div>
            <div className="checkout-form-row">
              <label>Confirm Password <span className="req">*</span></label>
              <input name="confirmPassword" type="password" required minLength={6} />
            </div>
          </>
        )}

        <h3 className="form-section-title">Your Address</h3>
        <div className="checkout-form-row">
          <label>Address <span className="req">*</span></label>
          <input name="invAddress1" required />
        </div>
        <div className="checkout-form-row">
          <label>Address (line 2)</label>
          <input name="invAddress2" />
        </div>
        <div className="checkout-form-row">
          <label>Area/Town <span className="req">*</span></label>
          <input name="invArea" required />
        </div>
        <div className="checkout-form-row">
          <label>Post/Zip Code</label>
          <input name="invPostcode" />
        </div>
        <div className="checkout-form-row">
          <label>Country <span className="req">*</span></label>
          <select
            name="invCountry"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="checkout-form-row">
          <label>State/District/County <span className="req">*</span></label>
          <select name="invRegion" required>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Simple captcha placeholder (env-switchable in production) */}
        <div className="checkout-form-row">
          <label>Security check <span className="req">*</span></label>
          <input
            name="captcha"
            required
            placeholder="Type: BDGIFT"
            pattern="BDGIFT"
            title="Please type BDGIFT"
            style={{ maxWidth: 200 }}
          />
        </div>

        <h3 className="form-section-title">Privacy Settings</h3>
        <div className="privacy-check">
          <input type="checkbox" name="agree" required defaultChecked />
          <span>
            I have read, agree and understood the{' '}
            <Link href="/terms-and-conditions" className="text-green">terms &amp; conditions</Link>
          </span>
        </div>

        <div className="submit-row">
          <button type="submit" className="btn-green" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit & Continue'}
          </button>
        </div>
      </form>
    </div>
  )
}

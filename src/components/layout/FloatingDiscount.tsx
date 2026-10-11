'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const DISMISS_KEY = 'ub_discount_dismissed'

export function FloatingDiscount() {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )ub_discount_dismissed=([^;]+)/)
    if (m) setDismissed(true)
  }, [])

  const dismiss = () => {
    setDismissed(true)
    document.cookie = `${DISMISS_KEY}=1; path=/; max-age=${60 * 60 * 24 * 7}`
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/newsletter/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed')
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  if (dismissed) return null

  return (
    <>
      <button
        type="button"
        className="discount-tab"
        onClick={() => setOpen(true)}
        aria-label="Get discount"
      >
        GET DISCOUNT!
      </button>
      {open && (
        <div className="discount-modal-overlay" onClick={() => setOpen(false)} aria-hidden="true">
          <div className="discount-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="discount-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <h3 className="discount-title">Get 5% Off Your First Order!</h3>
            <p className="discount-sub">Enter your email to receive a discount code.</p>
            {done ? (
              <p className="discount-done">
                Thank you! Your discount code <strong>WELCOME</strong> has been e-mailed to you.
              </p>
            ) : (
              <form className="discount-form" onSubmit={submit}>
                <input
                  type="email"
                  required
                  className="discount-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className="discount-submit">Get Code</button>
              </form>
            )}
            {error && <p className="discount-error">{error}</p>}
            <button type="button" className="discount-dismiss" onClick={dismiss}>
              Don&apos;t show this again
            </button>
          </div>
        </div>
      )}
    </>
  )
}

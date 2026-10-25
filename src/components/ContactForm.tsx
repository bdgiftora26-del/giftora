'use client'

import { useState } from 'react'

export function ContactForm() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to send')
      setSent(true)
    } catch {
      setError('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return <div className="alert alert-success">Thank you! Your message has been sent. We&apos;ll reply soon.</div>

  return (
    <form onSubmit={onSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="checkout-form-row">
        <label>Name <span className="req">*</span></label>
        <input name="name" required />
      </div>
      <div className="checkout-form-row">
        <label>Email <span className="req">*</span></label>
        <input name="email" type="email" required />
      </div>
      <div className="checkout-form-row">
        <label>Subject</label>
        <input name="subject" />
      </div>
      <div className="checkout-form-row" style={{ alignItems: 'flex-start' }}>
        <label style={{ marginTop: 4 }}>Message <span className="req">*</span></label>
        <textarea name="message" required rows={5} style={{ height: 'auto' }} />
      </div>
      <div className="submit-row">
        <button type="submit" className="btn-green" disabled={loading}>
          {loading ? 'Sending…' : 'Send Message'}
        </button>
      </div>
    </form>
  )
}

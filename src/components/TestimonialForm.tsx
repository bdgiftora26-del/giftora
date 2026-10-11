'use client'

import { useState } from 'react'

export function TestimonialForm() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      setSent(true)
      ;(e.target as HTMLFormElement).reset()
    } catch {
      setError('Failed to submit. Please try again.')
    }
  }

  if (sent) return <div className="alert alert-success">Thank you! Your testimonial will appear after approval.</div>

  return (
    <form onSubmit={onSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="checkout-form-row">
        <label>Name <span className="req">*</span></label>
        <input name="name" required />
      </div>
      <div className="checkout-form-row">
        <label>Country <span className="req">*</span></label>
        <input name="country" required />
      </div>
      <div className="checkout-form-row" style={{ alignItems: 'flex-start' }}>
        <label style={{ marginTop: 4 }}>Message <span className="req">*</span></label>
        <textarea name="message" required rows={4} style={{ height: 'auto' }} maxLength={300} />
      </div>
      <div className="submit-row">
        <button type="submit" className="btn-green">Submit Testimonial</button>
      </div>
    </form>
  )
}

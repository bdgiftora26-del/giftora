'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      router.push(mode === 'login' ? '/account' : '/login')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '12px 16px', maxWidth: 460, margin: '0 auto' }}>
      <h1 className="category-h1">{mode === 'login' ? 'Login' : 'Register'}</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={onSubmit}>
        {mode === 'register' && (
          <>
            <div className="checkout-form-row">
              <label>First Name</label>
              <input name="firstName" required />
            </div>
            <div className="checkout-form-row">
              <label>Last Name</label>
              <input name="lastName" required />
            </div>
            <div className="checkout-form-row">
              <label>Phone</label>
              <input name="phone1" />
            </div>
          </>
        )}
        <div className="checkout-form-row">
          <label>Email <span className="req">*</span></label>
          <input name="email" type="email" required />
        </div>
        <div className="checkout-form-row">
          <label>Password <span className="req">*</span></label>
          <input name="password" type="password" required minLength={6} />
        </div>
        {mode === 'register' && (
          <div className="checkout-form-row">
            <label>Confirm Password <span className="req">*</span></label>
            <input name="confirmPassword" type="password" required minLength={6} />
          </div>
        )}
        <div className="submit-row">
          <button type="submit" className="btn-green" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </div>
      </form>
      <p className="mt-2" style={{ fontSize: 12 }}>
        {mode === 'login' ? (
          <>Need to register? <Link href="/register" className="text-green">Register here</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="text-green">Login here</Link></>
        )}
      </p>
    </div>
  )
}

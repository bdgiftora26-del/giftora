'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, User, ShieldCheck } from 'lucide-react'

export function AdminLoginForm({ validSecret }: { validSecret: boolean }) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!validSecret) return null

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      router.push('/admin')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, #4a1f6e 0%, #5b2a86 50%, #2d1247 100%)',
        padding: 20,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: '36px 32px',
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 14px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #5b2a86, #4a1f6e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: 20, color: '#4a1f6e', margin: '0 0 4px', fontWeight: 700 }}>
            Admin Access
          </h1>
          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
            BDGiftora.com Control Panel
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#fdecea',
              border: '1px solid #f5c6c0',
              color: '#a33',
              padding: '10px 12px',
              borderRadius: 4,
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#555',
                marginBottom: 6,
              }}
            >
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                }}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
                placeholder="admin username"
              />
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#555',
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #5b2a86, #4a1f6e)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Authenticating…' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <p
          style={{
            fontSize: 10,
            color: '#aaa',
            textAlign: 'center',
            marginTop: 20,
            marginBottom: 0,
          }}
        >
          Authorized personnel only · All access is logged
        </p>
      </div>
    </div>
  )
}

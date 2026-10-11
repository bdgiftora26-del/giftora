'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Server error caught by boundary:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 22, color: '#4a9c2e', marginBottom: 8 }}>Something went wrong</h1>
      <p style={{ fontSize: 13, color: '#666', maxWidth: 460, marginBottom: 20 }}>
        We hit a temporary issue while loading this page. This is usually a brief connection hiccup
        with our database. Please try again — it typically works on the next attempt.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={reset}
          style={{
            background: '#4a9c2e',
            color: '#fff',
            border: 'none',
            padding: '8px 18px',
            borderRadius: 2,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            background: '#f08a24',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: 2,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          Back to Home
        </Link>
      </div>
      {error.digest && (
        <p style={{ fontSize: 10, color: '#999', marginTop: 20 }}>
          Error reference: {error.digest}
        </p>
      )}
    </div>
  )
}

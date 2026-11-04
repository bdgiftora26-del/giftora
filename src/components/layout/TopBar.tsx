'use client'

import Link from 'next/link'
import { useLocale, useT, useCart, useCurrency } from '@/components/providers'
import { useEffect, useState, useRef } from 'react'
import { Phone, Search, User, ShoppingCart, ChevronDown, Check } from 'lucide-react'

// Map currency code → flag emoji for the dropdown trigger + each option.
// ISO 4217 doesn't ship with a flag, so we map to the issuing country.
const CURRENCY_FLAG: Record<string, string> = {
  USD: '🇺🇸',
  BDT: '🇧🇩',
  GBP: '🇬🇧',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  EUR: '🇪🇺',
  INR: '🇮🇳',
  SGD: '🇸🇬',
}

function flagFor(code: string): string {
  return CURRENCY_FLAG[code] || '🌐'
}

function CurrencyDropdown() {
  const { currency, currencies, setCurrency, loading } = useCurrency()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // While currencies are loading from /api/currency/rates, show the
  // fallback so the bar doesn't flicker or shift layout.
  const currentCode = currency?.code || 'USD'

  return (
    <div className="topbar-currency-wrap" ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="topbar-currency"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Select currency. Current: ${currentCode}`}
        disabled={loading}
        style={{
          background: 'none',
          border: 'none',
          cursor: loading ? 'wait' : 'pointer',
          padding: '0 4px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color: 'inherit',
          fontSize: 'inherit',
        }}
      >
        <span aria-hidden="true">{flagFor(currentCode)}</span>
        <span>{currentCode}</span>
        <ChevronDown
          size={10}
          style={{
            transition: 'transform 0.15s',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="topbar-currency-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 50,
            background: '#fff',
            border: '1px solid var(--c-line)',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            minWidth: 140,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {currencies.length === 0 && (
            <li style={{ padding: '8px 12px', fontSize: 11, color: '#999' }}>
              No currencies available
            </li>
          )}
          {currencies.map((c) => {
            const selected = c.code === currentCode
            return (
              <li key={c.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrency(c.code)
                    setOpen(false)
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: selected ? 'var(--c-green-soft)' : 'transparent',
                    border: 'none',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#333',
                  }}
                >
                  <span aria-hidden="true">{flagFor(c.code)}</span>
                  <span style={{ fontWeight: selected ? 700 : 400 }}>{c.code}</span>
                  <span style={{ color: '#999', marginLeft: 'auto', fontSize: 10 }}>
                    {c.symbol}
                  </span>
                  {selected && <Check size={12} style={{ color: 'var(--c-green)' }} />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function TopBar() {
  const t = useT()
  const { locale, setLocale } = useLocale()
  const cart = useCart()
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => setCount(cart.count())
    update()
    window.addEventListener('ub-cart-change', update)
    return () => window.removeEventListener('ub-cart-change', update)
  }, [cart])

  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="topbar-left">
          <CurrencyDropdown />
          <span className="topbar-sep">|</span>
          <Link href="/" className="topbar-link">{t('Nav.Home')}</Link>
          <Link href="/catalogue" className="topbar-link">All Categories</Link>
          <Link href="/how-to-order-gift" className="topbar-link">How to Order</Link>
          <Link href="/track-order" className="topbar-link">Track Order</Link>
          <Link href="/faq" className="topbar-link">FAQ</Link>
        </div>
        <div className="topbar-right">
          <Link href="/login" className="topbar-link">Login</Link>
          <span className="topbar-sep">|</span>
          <Link href="/register" className="topbar-link">Register</Link>
          <span className="topbar-sep">|</span>
          <Link href="/account" className="topbar-link">My Account</Link>
          <span className="topbar-sep">|</span>
          <Link href="/cart" className="topbar-link">
            <ShoppingCart size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Cart ({count})
          </Link>
          <span className="topbar-sep">|</span>
          <button
            type="button"
            className="topbar-locale"
            onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
            aria-label="Toggle language"
          >
            {locale === 'en' ? 'বাংলা' : 'English'}
          </button>
        </div>
      </div>
    </div>
  )
}

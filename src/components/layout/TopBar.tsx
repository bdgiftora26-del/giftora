'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useT, useCart, useCurrency } from '@/components/providers'
import { useEffect, useState, useRef } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'

// Map currency code → flag emoji for the dropdown.
const CURRENCY_FLAG: Record<string, string> = {
  USD: '🇺🇸', BDT: '🇧🇩', GBP: '🇬🇧', AUD: '🇦🇺', CAD: '🇨🇦', EUR: '🇪🇺', INR: '🇮🇳', SGD: '🇸🇬',
}
function flagFor(code: string): string {
  return CURRENCY_FLAG[code] || '🌐'
}

function CurrencyDropdown() {
  const { currency, currencies, setCurrency, loading } = useCurrency()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const currentCode = currency?.code || 'USD'

  return (
    <div className="topbar-currency-wrap" ref={ref}>
      <button
        type="button"
        className="topbar-currency-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={loading}
      >
        <span aria-hidden="true">{flagFor(currentCode)}</span>
        <span>{currentCode}</span>
        <ChevronDown size={10} style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <ul role="listbox" className="topbar-currency-menu">
          {currencies.length === 0 && (
            <li style={{ padding: '8px 12px', fontSize: 11, color: '#999' }}>No currencies available</li>
          )}
          {currencies.map((c) => {
            const selected = c.code === currentCode
            return (
              <li key={c.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => { setCurrency(c.code); setOpen(false) }}
                  className={selected ? 'selected' : ''}
                >
                  <span aria-hidden="true">{flagFor(c.code)}</span>
                  <span style={{ fontWeight: selected ? 700 : 400 }}>{c.code}</span>
                  <span className="symbol">{c.symbol}</span>
                  {selected && <Check size={12} />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// Compact search widget — sits in the blue top bar, right after the
// currency dropdown. Matches the reference screenshot: white input + blue
// square button with magnifying glass, joined as one widget.
function TopBarSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <form className="topbar-search" onSubmit={onSearch} role="search">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="search this site"
        aria-label="Search"
      />
      <button type="submit" aria-label="Search">
        <Search size={14} />
      </button>
    </form>
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
        {/* Left: currency dropdown + search widget */}
        <div className="topbar-left">
          <CurrencyDropdown />
          <TopBarSearch />
        </div>
        {/* Right: language toggle (compact) */}
        <div className="topbar-right">
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

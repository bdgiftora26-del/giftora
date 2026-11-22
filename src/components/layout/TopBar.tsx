'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useT, useCart, useCurrency } from '@/components/providers'
import { useEffect, useState, useRef } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'

// Map currency code → flag emoji for the dropdown.
const CURRENCY_FLAG: Record<string, string> = {
  USD: '🇺🇸', BDT: '🇧🇩', GBP: '🇬🇧', AUD: '🇦🇺', CAD: '🇨🇦', EUR: '🇪🇺', INR: '🇮🇳', SGD: '🇸🇬', AED: '🇦🇪',
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
//
// Dynamic behaviour: as the user types, a debounced (250 ms) request goes
// to /api/search and a dropdown of matching products appears below the
// input, with a small spinner while the request is in-flight. Keyboard
// navigation (↑/↓/Enter/Esc) is supported. Clicking outside closes the
// dropdown. Submitting the form (Enter on the input, or clicking the
// magnifier) goes to the full search results page.
type Suggestion = {
  slug: string
  name: string
  priceBdt: number
  salePriceBdt: number | null
  image: string
}

function TopBarSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)

  // Debounced fetch — fires 250 ms after the last keystroke. A guard
  // (reqSeq) makes sure a slow earlier response can't overwrite a newer
  // one (race condition).
  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) {
      setSuggestions([])
      setShow(false)
      setLoading(false)
      setActive(-1)
      return
    }
    setLoading(true)
    const seq = ++reqSeq
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`)
        const data = await res.json()
        // Stale-response guard — discard if a newer request started.
        if (seq !== reqSeq) return
        setSuggestions(data.products || [])
        setShow(true)
        setLoading(false)
        setActive(-1)
      } catch {
        if (seq !== reqSeq) return
        setSuggestions([])
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [q])

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) {
      setShow(false)
      router.push(`/search?q=${encodeURIComponent(q.trim())}`)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!show || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      router.push(`/product/${suggestions[active].slug}`)
      setShow(false)
    } else if (e.key === 'Escape') {
      setShow(false)
      setActive(-1)
    }
  }

  return (
    <div className="topbar-search" ref={ref}>
      <form onSubmit={onSearch} role="search" style={{ display: 'flex' }}>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShow(true)}
          onKeyDown={onKeyDown}
          placeholder="search this site"
          aria-label="Search"
          aria-expanded={show}
          aria-autocomplete="list"
          autoComplete="off"
        />
        <button type="submit" aria-label="Search">
          {loading ? <Spinner /> : <Search size={14} />}
        </button>
      </form>

      {show && (loading || suggestions.length > 0) && (
        <div className="topbar-search-dropdown" role="listbox">
          {loading && suggestions.length === 0 && (
            <div className="topbar-search-loading">
              <Spinner /> <span>Searching…</span>
            </div>
          )}
          {suggestions.map((s, i) => (
            <a
              key={s.slug}
              href={`/product/${s.slug}`}
              className={`topbar-search-item ${i === active ? 'topbar-search-item-active' : ''}`}
              onMouseEnter={() => setActive(i)}
              role="option"
              aria-selected={i === active}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.image}
                alt=""
                width={32}
                height={32}
                loading="lazy"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src = '/placeholders/products/generic-01.svg'
                }}
              />
              <span className="topbar-search-item-name">{s.name}</span>
              <span className="topbar-search-item-price">
                {(s.salePriceBdt ?? s.priceBdt).toFixed(0)} ৳
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// Tiny inline spinner — shown in the search button and the loading row.
// A CSS-only spinner avoids a heavy icon dependency and animates smoothly.
function Spinner() {
  return <span className="topbar-search-spinner" aria-hidden="true" />
}

// Shared sequence counter lives at module scope so every TopBarSearch
// instance increments the same guard. (There's only one instance in the
// app, but a module-scoped counter is simplest and avoids stale closures.)
let reqSeq = 0

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

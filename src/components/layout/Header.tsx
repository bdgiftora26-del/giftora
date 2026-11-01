'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { useT } from '@/components/providers'

type Suggestion = { slug: string; name: string; priceBdt: number; image: string }

export function Header() {
  const t = useT()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) {
      setShowSuggestions(false)
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  // Fetch suggestions as user types
  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&limit=6`)
        const data = await res.json()
        setSuggestions(data.products || [])
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function onKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      router.push(`/product/${suggestions[activeIndex].slug}`)
      setShowSuggestions(false)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-left">
          <Link href="/" className="logo-block" aria-label="BDGiftora.com">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-logo.jpg" alt="BDGiftora.com" className="logo-img" width={150} height={80} />
            <div className="logo-meta">
              <span className="logo-tagline">Gift Delivery in Bangladesh</span>
              <a href="tel:+8801719818182" className="header-phone">
                <Search size={12} /> +880 1719-818182
              </a>
              <div className="header-socials">
                <a href="https://facebook.com" aria-label="Facebook" className="social-mini">f</a>
                <a href="https://wa.me/8801719818182" aria-label="WhatsApp" className="social-mini">w</a>
              </div>
            </div>
          </Link>
        </div>
        <div className="header-right">
          <div className="search-wrapper" ref={searchRef}>
            <form className="search-form" onSubmit={onSearch} role="search" style={{ position: 'relative' }}>
              <input
                type="search"
                className="search-input"
                placeholder={t('Header.SearchGift')}
                value={q}
                onChange={(e) => { setQ(e.target.value); setActiveIndex(-1) }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyDown={onKeyDown}
                aria-label={t('Header.SearchGift')}
                autoComplete="off"
              />
              <button type="submit" className="search-btn" aria-label="Search">
                <Search size={14} />
              </button>

              {/* Search suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions">
                  {suggestions.map((s, i) => (
                    <Link
                      key={s.slug}
                      href={`/product/${s.slug}`}
                      className={`search-suggestion-item ${i === activeIndex ? 'active' : ''}`}
                      onClick={() => { setShowSuggestions(false); setQ('') }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.image} alt={s.name} className="search-suggestion-img" width={40} height={40} />
                      <div className="search-suggestion-info">
                        <div className="search-suggestion-name">{s.name}</div>
                      </div>
                    </Link>
                  ))}
                  <Link href={`/search?q=${encodeURIComponent(q)}`} className="search-suggestion-all" onClick={() => setShowSuggestions(false)}>
                    See all results for &ldquo;{q}&rdquo; →
                  </Link>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}

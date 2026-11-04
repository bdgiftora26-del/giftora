'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { useCart, useCurrency, useT } from '@/components/providers'

type Suggestion = { slug: string; name: string; priceBdt: number; image: string }

// WhatsApp + Viber + Phone icons — matching the reference screenshot's
// left-side contact cluster. Inlined as SVGs so we don't need icon deps.
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
function ViberIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.4.034C9.473.084 5.33.388 3.015 2.526 1.298 4.235.697 6.815.632 10.13c-.06 3.297-.13 9.396 5.05 11.05v2.454s-.04.99.617 1.19c.78.265 1.237-.503 1.237-.503l.034-2.58c4.18.81 7.814.62 8.61.45 1.81-.45 2.81-1.5 3.39-3.51.61-2.16.51-6.49.51-6.49s.18-3.51-.27-5.06C19.7 4.42 18.4 3.32 16.5 2.66c-2.31-.84-5.1-.63-5.1-.63zm.21 1.62c1.89-.06 4.36.21 6.13 1.38 1.49.98 2.04 2.66 2.1 5.04.06 2.37.12 5.06-.27 6.4-.39 1.34-1.14 2.28-2.55 2.67-1.41.39-4.69.51-7.62-.27-.21-.06-.45-.12-.66-.24l-.03 3.06c-.06.18-.21.27-.39.21-.18-.06-.24-.24-.21-.42v-3.03c-2.04-.78-3.27-2.04-3.78-3.81-.51-1.77-.51-5.04-.45-7.2.06-2.16.61-4.17 2.16-5.49 1.55-1.32 4.5-1.62 6.39-1.68zm-.27 3.09c-.27 0-.27.39 0 .42 1.62.12 2.49.81 2.64 2.55.03.27.42.24.39-.03-.15-2.04-1.29-2.94-3.03-2.94zm-.66 1.02c-.27 0-.27.39 0 .42 1.17.09 1.71.66 1.77 1.83.03.27.42.24.39-.03-.06-1.41-.81-2.16-2.16-2.22zm-3.18 1.08c-.42-.06-.84.03-1.17.33-.51.48-.54 1.26-.21 1.86.18.33.51.51.84.45.36-.06.6-.39.66-.81.06-.39.27-.69.57-.96.24-.21.21-.48-.03-.6-.21-.12-.45-.21-.66-.27zm.33.66c.12 0 .24.06.33.15.12.12.15.27.06.42-.06.15-.21.24-.36.18-.15-.06-.24-.21-.18-.36.03-.12.09-.21.18-.24-.03-.12-.03-.15-.03-.15zm1.05 1.35c-.12.15-.33.18-.48.06-.15-.12-.18-.33-.06-.48.12-.15.33-.18.48-.06.15.12.18.33.06.48zm-.6 1.17c-.06.09-.18.12-.27.06-.09-.06-.12-.18-.06-.27.06-.09.18-.12.27-.06.09.06.12.18.06.27zm.99-.15c-.06.09-.18.12-.27.06-.09-.06-.12-.18-.06-.27.06-.09.18-.12.27-.06.09.06.12.18.06.27zm.69.81c-.06.09-.18.12-.27.06-.09-.06-.12-.18-.06-.27.06-.09.18-.12.27-.06.09.06.12.18.06.27zm1.59.12c-.18.06-.36 0-.42-.18-.06-.18 0-.36.18-.42.18-.06.36 0 .42.18.06.18 0 .36-.18.42zm.78-.21c-.12.03-.24-.03-.27-.15-.03-.12.03-.24.15-.27.12-.03.24.03.27.15.03.12-.03.24-.15.27zm-.06-1.02c-.09.03-.21-.03-.24-.12-.03-.09.03-.21.12-.24.09-.03.21.03.24.12.03.09-.03.21-.12.24zm.99-.33c-.06.15-.21.24-.36.18-.15-.06-.24-.21-.18-.36.06-.15.21-.24.36-.18.15.06.24.21.18.36zm.81-.18c-.06.15-.21.21-.36.15-.15-.06-.21-.21-.15-.36.06-.15.21-.21.36-.15.15.06.21.21.15.36zm-.18-1.08c-.12.06-.27.03-.33-.09-.06-.12-.03-.27.09-.33.12-.06.27-.03.33.09.06.12.03.27-.09.33zm-.99-1.08c-.15.06-.27.03-.36-.09-.06-.12-.03-.27.09-.33.12-.06.27-.03.33.09.06.12.03.27-.06.33z"/>
    </svg>
  )
}

export function Header() {
  const t = useT()
  const router = useRouter()
  const cart = useCart()
  const { currency } = useCurrency()
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [count, setCount] = useState(0)
  const [subtotal, setSubtotal] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)

  // Track cart count + subtotal for the right-side cart info block
  useEffect(() => {
    const update = () => {
      setCount(cart.count())
      setSubtotal(cart.items.reduce((s, i) => s + i.priceBdt * i.qty, 0))
    }
    update()
    window.addEventListener('ub-cart-change', update)
    return () => window.removeEventListener('ub-cart-change', update)
  }, [cart])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) {
      setShowSuggestions(false)
      router.push(`/search?q=${encodeURIComponent(q.trim())}`)
    }
  }

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
        {/* === LEFT: logo + tagline + social + phone === */}
        <div className="header-left">
          <Link href="/" className="logo-block" aria-label="BDGiftora.com — Home">
            <Image
              src="/brand-logo.jpg"
              alt="BDGiftora.com"
              width={200}
              height={110}
              className="logo-img"
              sizes="200px"
              priority
            />
          </Link>
          <div className="logo-meta">
            <span className="logo-tagline">Serving Since 2004</span>
            <div className="header-socials">
              <a
                href="https://wa.me/8801719818182"
                aria-label="WhatsApp"
                className="social-icon social-whatsapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon size={14} />
              </a>
              <a
                href="viber://chat?number=%2B8801719818182"
                aria-label="Viber"
                className="social-icon social-viber"
              >
                <ViberIcon size={14} />
              </a>
            </div>
            <a href="tel:+8801719818182" className="header-phone">
              +880 1719-818182
            </a>
          </div>
        </div>

        {/* === RIGHT: welcome + links + cart info === */}
        <div className="header-right">
          <div className="header-welcome">
            <span>Welcome, Guest</span>
            <span className="header-links">
              <Link href="/account">My Account</Link>
              <span className="sep">|</span>
              <Link href="/cart">View Cart</Link>
              <span className="sep">|</span>
              <Link href="/login">Login</Link>
            </span>
          </div>
          <div className="header-cart-info">
            <span>Shopping Cart Items: {count}</span>
            <span className="cart-subtotal">
              Sub-Total: {currency?.symbol || '$'}
              {(subtotal * (currency?.rateFromBdt || 0.0091)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

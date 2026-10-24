'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { siteConfig } from '@/config/site'
import { useT, useCart } from '@/components/providers'
import { Phone, Search, Facebook, MessageCircle } from 'lucide-react'

export function Header() {
  const t = useT()
  const cart = useCart()
  const router = useRouter()
  const [q, setQ] = useState('')

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-left">
          <Link href="/" className="logo-block" aria-label={siteConfig.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={siteConfig.logoUrl}
              alt={siteConfig.brand}
              className="logo-img"
              width={150}
              height={70}
            />
            <div className="logo-meta">
              <span className="logo-tagline">{siteConfig.tagline}</span>
              <a href="tel:+8801312597437" className="header-phone">
                <Phone size={12} /> +880 1312 597437
              </a>
              <div className="header-socials">
                <a href={siteConfig.social.facebook} aria-label="Facebook" className="social-mini"><Facebook size={11} /></a>
                <a href="https://wa.me/8801312597437" aria-label="WhatsApp" className="social-mini"><MessageCircle size={11} /></a>
              </div>
            </div>
          </Link>
        </div>
        <div className="header-right">
          <div className="header-cart-summary">
            <Link href="/cart" className="cart-summary-link">
              <ShoppingCart size={16} />
              <span>Items: {cart.count()} | Subtotal: <Price /></span>
            </Link>
          </div>
          <form className="search-form" onSubmit={onSearch} role="search">
            <input
              type="search"
              className="search-input"
              placeholder={t('Header.SearchGift')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t('Header.SearchGift')}
            />
            <button type="submit" className="search-btn" aria-label="Search">
              <Search size={14} />
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}

function Price() {
  // lightweight inline to avoid extra import cycle; cart subtotal in USD for display
  return <span>US$0.00</span>
}

function ShoppingCart({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

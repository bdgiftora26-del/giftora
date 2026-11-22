'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useCart, useCurrency } from '@/components/providers'

// WhatsApp icon — the header's single contact CTA. Inlined as SVG so we
// don't need an icon dependency for one glyph.
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export function Header() {
  const cart = useCart()
  const { currency } = useCurrency()
  const [count, setCount] = useState(0)
  const [subtotal, setSubtotal] = useState(0)

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

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* === LEFT: logo + WhatsApp CTA === */}
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
            <a
              href="https://wa.me/8801719818182"
              aria-label="Chat on WhatsApp"
              className="header-whatsapp-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="header-whatsapp-icon">
                <WhatsAppIcon size={22} />
              </span>
              <span className="header-whatsapp-text">
                <span className="header-whatsapp-label">Chat on WhatsApp</span>
                <small className="header-whatsapp-number">+880 1719-818182</small>
              </span>
            </a>
          </div>
        </div>

        {/* === MIDDLE: brand slogan (desktop + responsive) === */}
        <div className="header-slogan" aria-label="Brand slogan">
          <span className="header-slogan-text">আপনার পছন্দ, প্রিয়জনের আনন্দ</span>
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

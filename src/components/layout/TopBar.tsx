'use client'

import Link from 'next/link'
import { useLocale, useT, useCart } from '@/components/providers'
import { useEffect, useState } from 'react'
import { Phone, Search, User, ShoppingCart } from 'lucide-react'

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
          <span className="topbar-currency">
            <span className="flag-us" aria-hidden="true" /> USD
          </span>
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

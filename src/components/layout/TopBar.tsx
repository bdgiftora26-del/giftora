'use client'

import Link from 'next/link'
import { useLocale, useT, useCart } from '@/components/providers'
import { siteConfig } from '@/config/site'
import { useEffect, useState } from 'react'

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
          {siteConfig.nav.top.map((item) => (
            <Link key={item.href} href={item.href} className="topbar-link">
              {t(`Nav.${item.label.replace(/[^A-Za-z]/g, '')}`) !== `Nav.${item.label.replace(/[^A-Za-z]/g, '')}`
                ? t(`Nav.${labelKey(item.label)}`)
                : item.label}
            </Link>
          ))}
        </div>
        <div className="topbar-right">
          <Link href="/login" className="topbar-link">{t('Nav.Login')}</Link>
          <Link href="/register" className="topbar-link">{t('Nav.Register')}</Link>
          <Link href="/contact-us" className="topbar-link">{t('Nav.ContactUs')}</Link>
          <button
            type="button"
            className="topbar-locale"
            onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
            aria-label="Toggle language"
          >
            <span className="flag-bd" aria-hidden="true" />
            {locale === 'en' ? 'বাংলা' : 'English'}
          </button>
          <Link href="/cart" className="topbar-cart">
            {t('Nav.ShoppingCart')}
            {count > 0 && <span className="topbar-cart-count">({count})</span>}
          </Link>
        </div>
      </div>
    </div>
  )
}

function labelKey(label: string): string {
  const map: Record<string, string> = {
    Home: 'Home',
    'View Catalog': 'ViewCatalog',
    'How to Order': 'HowToOrder',
    'How to Pay': 'HowToPay',
    FAQ: 'FAQ',
    'Track Order': 'TrackOrder',
  }
  return map[label] || label.replace(/\s/g, '')
}

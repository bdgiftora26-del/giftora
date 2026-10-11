'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { siteConfig } from '@/config/site'
import { useT } from '@/components/providers'

export function Header() {
  const t = useT()
  const router = useRouter()
  const [q, setQ] = useState('')

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="logo-block" aria-label={siteConfig.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={siteConfig.logoUrl}
            alt={siteConfig.brand}
            className="logo-img"
            width={52}
            height={52}
          />
          <span className="logo-wordmark">
            <span className="logo-first" style={{ color: siteConfig.brandColors.first }}>BD</span>
            <span className="logo-second" style={{ color: siteConfig.brandColors.second }}>Giftora</span>
            <span className="logo-third" style={{ color: siteConfig.brandColors.third }}>.com</span>
          </span>
        </Link>
        <form className="search-form" onSubmit={onSearch} role="search">
          <input
            type="search"
            className="search-input"
            placeholder={t('Header.SearchGift')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t('Header.SearchGift')}
          />
          <button type="submit" className="search-btn">{t('Header.Search')}</button>
        </form>
      </div>
    </header>
  )
}

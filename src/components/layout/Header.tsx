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
          <img src="/placeholders/logo.svg" alt={siteConfig.brand} width={120} height={40} />
          <span className="logo-word">
            <span className="logo-first">{siteConfig.brandParts.first}</span>
            <span className="logo-second">{siteConfig.brandParts.second}</span>
          </span>
          <span className="logo-tag">{siteConfig.tagline}</span>
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

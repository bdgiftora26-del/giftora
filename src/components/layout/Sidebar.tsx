'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CategoryIcon } from '@/components/CategoryIcon'
import { useCurrency } from '@/components/providers'
import { siteConfig } from '@/config/site'

export type SidebarCategory = {
  id: number
  slug: string
  name: string
  icon?: string | null
  href: string
  isActive: boolean
}

export function Sidebar({
  categories,
  activeSlug,
}: {
  categories: SidebarCategory[]
  activeSlug?: string
}) {
  const pathname = usePathname()
  const { currency, currencies, setCurrency } = useCurrency()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)
  }, [pathname])

  return (
    <>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setOpen(true)}
        aria-label="Open categories"
      >
        ☰ Categories
      </button>
      {open && (
        <div className="sidebar-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      )}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-label="Categories">
        <div className="sidebar-head">
          <span>Categories</span>
          <button type="button" className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>
        <nav className="sidebar-nav">
          {categories.map((c) => {
            const active = activeSlug ? c.slug === activeSlug : false
            return (
              <Link
                key={c.id}
                href={c.href}
                className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}
              >
                <span className="sidebar-icon">
                  <CategoryIcon icon={c.icon} />
                </span>
                <span className="sidebar-label">{c.name}</span>
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-currency">
          <label htmlFor="currency-select" className="sidebar-currency-label">
            Currency
          </label>
          <select
            id="currency-select"
            className="sidebar-currency-select"
            value={currency?.code ?? 'USD'}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code === 'USD'
                  ? 'US Dollars (US$)'
                  : c.code === 'BDT'
                    ? 'Bangladeshi Taka (৳)'
                    : `${c.name} (${c.symbol})`}
              </option>
            ))}
          </select>
        </div>
      </aside>
    </>
  )
}

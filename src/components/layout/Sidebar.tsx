'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CategoryIcon } from '@/components/CategoryIcon'
import { useCurrency } from '@/components/providers'
import { Price } from '@/components/Price'
import { toNumber } from '@/lib/money'

export type SidebarCategory = {
  id: number
  slug: string
  name: string
  icon?: string | null
  href: string
  isActive: boolean
}

type WidgetProduct = {
  id: number
  slug: string
  name: string
  priceBdt: number
  salePriceBdt: number | null
  image: string
}

type SidebarWidgets = {
  topSellers?: WidgetProduct[]
  randomProduct?: WidgetProduct[]
  testimonials?: { name: string; country: string; message: string }[]
  blogHighlights?: { title: string; slug: string }[]
  information?: { label: string; href: string }[]
  news?: { title: string; slug: string }[]
}

export function Sidebar({
  categories,
  activeSlug,
  widgets,
}: {
  categories: SidebarCategory[]
  activeSlug?: string
  widgets?: SidebarWidgets
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
        {/* Categories widget */}
        <div className="sidebar-widget">
          <div className="sidebar-widget-head">Categories</div>
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
        </div>

        {/* Change Currency widget */}
        <div className="sidebar-widget">
          <div className="sidebar-widget-head">Change Currency</div>
          <div className="sidebar-widget-body">
            <select
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
        </div>

        {/* Top Sellers widget */}
        {widgets?.topSellers && widgets.topSellers.length > 0 && (
          <div className="sidebar-widget">
            <div className="sidebar-widget-head">Top Sellers</div>
            <div className="sidebar-widget-body">
              {widgets.topSellers.map((p) => (
                <SidebarProduct key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Blog Highlights widget */}
        {widgets?.blogHighlights && widgets.blogHighlights.length > 0 && (
          <div className="sidebar-widget">
            <div className="sidebar-widget-head">Blog Highlights</div>
            <div className="sidebar-widget-body">
              <ul className="sidebar-link-list">
                {widgets.blogHighlights.map((b) => (
                  <li key={b.slug}>
                    <Link href={`/${b.slug}`}>{b.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Information widget */}
        {widgets?.information && widgets.information.length > 0 && (
          <div className="sidebar-widget">
            <div className="sidebar-widget-head">Information</div>
            <div className="sidebar-widget-body">
              <ul className="sidebar-link-list">
                {widgets.information.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Random Products widget */}
        {widgets?.randomProduct && widgets.randomProduct.length > 0 && (
          <div className="sidebar-widget">
            <div className="sidebar-widget-head">Random Products</div>
            <div className="sidebar-widget-body">
              {widgets.randomProduct.map((p) => (
                <SidebarProduct key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Customer Testimonials widget */}
        {widgets?.testimonials && widgets.testimonials.length > 0 && (
          <div className="sidebar-widget">
            <div className="sidebar-widget-head">Customer Testimonials</div>
            <div className="sidebar-widget-body">
              {widgets.testimonials.map((t, i) => (
                <div key={i} className="sidebar-testimonial">
                  <p className="sidebar-testimonial-text">&ldquo;{t.message}&rdquo;</p>
                  <p className="sidebar-testimonial-author">— {t.name}, {t.country}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* News widget */}
        {widgets?.news && widgets.news.length > 0 && (
          <div className="sidebar-widget">
            <div className="sidebar-widget-head">News</div>
            <div className="sidebar-widget-body">
              <ul className="sidebar-link-list">
                {widgets.news.map((n) => (
                  <li key={n.slug}>
                    <Link href={`/${n.slug}`}>{n.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Mobile close button */}
        <div className="sidebar-head">
          <button type="button" className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close">
            ✕ Close
          </button>
        </div>
      </aside>
    </>
  )
}

function SidebarProduct({ product }: { product: WidgetProduct }) {
  const price = product.salePriceBdt || product.priceBdt
  return (
    <div className="sidebar-product">
      <Link href={`/product/${product.slug}`} className="sidebar-product-link">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="sidebar-product-img" width={80} height={80} />
        <div className="sidebar-product-info">
          <div className="sidebar-product-name">{product.name}</div>
          <div className="sidebar-product-price">
            {product.salePriceBdt && (
              <span className="sidebar-product-old-price">
                <Price bdt={product.priceBdt} />
              </span>
            )}
            <Price bdt={price} />
          </div>
        </div>
      </Link>
    </div>
  )
}

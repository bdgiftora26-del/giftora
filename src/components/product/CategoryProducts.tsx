'use client'

import { useEffect, useState, useMemo } from 'react'
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard'

const PER_PAGE = 48

const SORTS = ['default', 'price-asc', 'price-desc', 'name-asc', 'popular', 'newest'] as const
type Sort = (typeof SORTS)[number]

export function CategoryProducts({ categorySlug }: { categorySlug: string }) {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sort, setSort] = useState<Sort>('default')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let active = true
    // Fetch products for this category from the API (already fast + resilient).
    const url = `/api/products?category=${encodeURIComponent(categorySlug)}&sort=default`
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((d) => {
        if (!active) return
        setProducts(d.products || [])
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setError(true)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [categorySlug])

  const sorted = useMemo(() => {
    const arr = [...products]
    if (sort === 'price-asc') arr.sort((a, b) => a.priceBdt - b.priceBdt)
    else if (sort === 'price-desc') arr.sort((a, b) => b.priceBdt - a.priceBdt)
    else if (sort === 'name-asc') arr.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'popular') arr.sort((a, b) => b.orderCount - a.orderCount)
    else if (sort === 'newest') arr.sort((a, b) => (b.firstSoldYear || 0) - (a.firstSoldYear || 0))
    return arr
  }, [products, sort])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <>
      <div className="category-toolbar">
        <span>Total {loading ? '…' : total} Products</span>
        <label>
          Sort By:{' '}
          <select
            className="sort-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as Sort)
              setPage(1)
            }}
            disabled={loading}
          >
            <option value="default">Default</option>
            <option value="price-asc">Price low→high</option>
            <option value="price-desc">Price high→low</option>
            <option value="name-asc">Name A→Z</option>
            <option value="popular">Most ordered</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p className="muted">Loading products…</p>
      ) : error ? (
        <p className="muted">Could not load products right now. Please refresh the page.</p>
      ) : paged.length === 0 ? (
        <p className="muted">No products in this category yet.</p>
      ) : (
        <div className="product-grid">
          {paged.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {!loading && (
        <div className="product-footer-bar">Showing {paged.length} products</div>
      )}

      {totalPages > 1 && (
        <div className="pager">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setPage(n)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={n === safePage ? 'pager-current' : ''}
              style={{ background: 'none', cursor: 'pointer' }}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

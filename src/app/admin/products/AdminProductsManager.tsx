'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, Edit2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { ProductEditModal } from './ProductEditModal'

type Product = {
  id: number
  sku: string
  slug: string
  name: string
  priceBdt: number
  salePriceBdt: number | null
  isActive: boolean
  image: string
}

export function AdminProductsManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [modalState, setModalState] = useState<{ open: boolean; productId: number | null; isNew: boolean }>({
    open: false, productId: null, isNew: false,
  })

  const fetchPage = useCallback(async (pageNum: number, search: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pageNum) })
    if (search) params.set('q', search)
    const res = await fetch(`/api/admin/products?${params}`)
    const data = await res.json()
    setProducts(data.products || [])
    setTotal(data.total || 0)
    setTotalPages(data.totalPages || 1)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchPage(page, q), 300)
    return () => clearTimeout(timer)
  }, [page, q, fetchPage])

  async function toggleActive(id: number, current: boolean) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) {
      setProducts(products.map((p) => (p.id === id ? { ...p, isActive: !current } : p)))
    }
  }

  function openEdit(id: number) {
    setModalState({ open: true, productId: id, isNew: false })
  }

  function openAdd() {
    setModalState({ open: true, productId: null, isNew: true })
  }

  function closeModal() {
    setModalState({ open: false, productId: null, isNew: false })
  }

  function onSaved() {
    closeModal()
    fetchPage(page, q)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 className="admin-page-title">Products ({total})</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openAdd}>
          <Plus size={14} /> Add Product
        </button>
      </div>

      <Link href="/admin" className="admin-back-link">← Back to Dashboard</Link>

      <div className="admin-search">
        <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#999' }} />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          placeholder="Search by name or SKU..."
        />
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading products...</p>
      ) : products.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>No products found.</p>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Price (BDT)</th>
                <th>Sale</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} width={40} height={40} style={{ objectFit: 'contain' }} />
                  </td>
                  <td>
                    <Link href={`/product/${p.slug}`} target="_blank" style={{ color: '#4f46e5' }}>{p.name}</Link>
                  </td>
                  <td style={{ fontSize: 11 }}>{p.sku}</td>
                  <td>৳{p.priceBdt}</td>
                  <td>{p.salePriceBdt ? `৳${p.salePriceBdt}` : '—'}</td>
                  <td>
                    <button type="button" onClick={() => toggleActive(p.id, p.isActive)}
                      className={p.isActive ? 'admin-btn admin-btn-success' : 'admin-btn admin-btn-outline'}
                      style={{ padding: '2px 8px', fontSize: 11 }}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <button type="button" onClick={() => openEdit(p.id)}
                      className="admin-btn admin-btn-outline" style={{ padding: '3px 10px' }}>
                      <Edit2 size={13} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <button type="button" className="admin-btn admin-btn-outline" disabled={page === 1 || loading}
                onClick={() => setPage(page - 1)} style={{ padding: '4px 10px' }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <span style={{ fontSize: 13, color: '#555' }}>
                Page {page} of {totalPages} ({total} total)
              </span>
              <button type="button" className="admin-btn admin-btn-outline" disabled={page === totalPages || loading}
                onClick={() => setPage(page + 1)} style={{ padding: '4px 10px' }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Product edit/add modal */}
      {modalState.open && (
        <ProductEditModal
          productId={modalState.productId}
          isNew={modalState.isNew}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

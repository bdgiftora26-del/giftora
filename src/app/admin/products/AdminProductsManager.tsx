'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Trash2, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const PER_PAGE = 15

type Product = {
  id: number
  sku: string
  slug: string
  name: string
  priceBdt: number
  salePriceBdt: number | null
  isActive: boolean
  image: string
  categories: string[]
}

export function AdminProductsManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)
    const res = await fetch('/api/admin/products')
    const data = await res.json()
    setProducts(data.products || [])
    setLoading(false)
  }

  const filtered = useMemo(() =>
    products.filter((p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())
    ), [products, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1) }, [q])

  async function deleteProduct(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Product deleted')
      setProducts(products.filter((p) => p.id !== id))
    } else { toast.error('Failed to delete') }
  }

  async function toggleActive(id: number, current: boolean) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) setProducts(products.map((p) => (p.id === id ? { ...p, isActive: !current } : p)))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 className="admin-page-title">Products ({products.length})</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={14} /> Add Product
        </button>
      </div>

      <Link href="/admin" className="admin-back-link">← Back to Dashboard</Link>

      {showAdd && <AddProductForm onAdded={() => { fetchProducts(); setShowAdd(false) }} />}

      <div className="admin-search">
        <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#999' }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or SKU..." />
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
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
              {paged.map((p) => (
                <tr key={p.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} width={40} height={40} style={{ objectFit: 'contain' }} />
                  </td>
                  <td>
                    <Link href={`/product/${p.slug}`} target="_blank" style={{ color: '#4f46e5' }}>{p.name}</Link>
                    <div style={{ fontSize: 10, color: '#999' }}>{p.categories.join(', ')}</div>
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
                    <button type="button" onClick={() => deleteProduct(p.id, p.name)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <button type="button" className="admin-btn admin-btn-outline" disabled={safePage === 1}
                onClick={() => setPage(safePage - 1)} style={{ padding: '4px 10px' }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <span style={{ fontSize: 13, color: '#555' }}>
                Page {safePage} of {totalPages} ({filtered.length} total)
              </span>
              <button type="button" className="admin-btn admin-btn-outline" disabled={safePage === totalPages}
                onClick={() => setPage(safePage + 1)} style={{ padding: '4px 10px' }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AddProductForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, priceBdt: Number(price), imageUrl, categorySlug: category, description }),
    })
    setSaving(false)
    if (res.ok) { toast.success('Product added!'); onAdded() }
    else { toast.error('Failed to add product') }
  }

  return (
    <form onSubmit={submit} className="admin-form">
      <h3>Add New Product</h3>
      <div className="admin-form-row"><label>Name *</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div className="admin-form-row"><label>Price (BDT) *</label><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
      <div className="admin-form-row"><label>Image URL</label><input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="/products/photo.jpg" /></div>
      <div className="admin-form-row"><label>Category</label><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="flowers / cake / food..." /></div>
      <div className="admin-form-row" style={{ alignItems: 'flex-start' }}><label style={{ marginTop: 4 }}>Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ height: 'auto' }} /></div>
      <div style={{ textAlign: 'right' }}>
        <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
      </div>
    </form>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

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

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    const res = await fetch('/api/admin/products')
    const data = await res.json()
    setProducts(data.products || [])
    setLoading(false)
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()),
  )

  async function deleteProduct(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Product deleted')
      setProducts(products.filter((p) => p.id !== id))
    } else {
      toast.error('Failed to delete')
    }
  }

  async function toggleActive(id: number, current: boolean) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) {
      setProducts(products.map((p) => (p.id === id ? { ...p, isActive: !current } : p)))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 className="category-h1" style={{ margin: 0 }}>Products ({products.length})</h2>
        <button type="button" className="btn-green" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Add Product
        </button>
      </div>

      <p className="checkout-helper">
        <Link href="/admin" className="text-green">← Back to Dashboard</Link>
      </p>

      {showAdd && <AddProductForm onAdded={() => { fetchProducts(); setShowAdd(false) }} />}

      <form style={{ marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#999' }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or SKU..."
            style={{ width: '100%', padding: '6px 10px 6px 32px', height: 32 }}
          />
        </div>
      </form>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="cart-table">
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
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} width={40} height={40} style={{ objectFit: 'contain' }} />
                  </td>
                  <td>
                    <Link href={`/product/${p.slug}`} className="text-green" target="_blank">{p.name}</Link>
                    <div className="muted" style={{ fontSize: 10 }}>{p.categories.join(', ')}</div>
                  </td>
                  <td style={{ fontSize: 11 }}>{p.sku}</td>
                  <td>৳{p.priceBdt}</td>
                  <td>{p.salePriceBdt ? `৳${p.salePriceBdt}` : '—'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleActive(p.id, p.isActive)}
                      style={{
                        background: p.isActive ? 'var(--c-brand-green)' : '#ccc',
                        color: '#fff', border: 'none', padding: '2px 8px',
                        borderRadius: 2, fontSize: 11, cursor: 'pointer',
                      }}
                    >
                      {p.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => deleteProduct(p.id, p.name)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-brand-red)' }}
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, priceBdt: Number(price), imageUrl, categorySlug: category, description,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Product added!')
      onAdded()
    } else {
      toast.error('Failed to add product')
    }
  }

  return (
    <form onSubmit={submit} style={{ background: '#f9f9f9', padding: 16, marginBottom: 16, border: '1px solid var(--c-line)' }}>
      <h3 style={{ marginTop: 0 }}>Add New Product</h3>
      <div className="checkout-form-row">
        <label>Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="checkout-form-row">
        <label>Price (BDT) *</label>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </div>
      <div className="checkout-form-row">
        <label>Image URL</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="/products/photo.jpg" />
      </div>
      <div className="checkout-form-row">
        <label>Category</label>
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="flowers / cake / food..." />
      </div>
      <div className="checkout-form-row" style={{ alignItems: 'flex-start' }}>
        <label style={{ marginTop: 4 }}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ height: 'auto' }} />
      </div>
      <div className="submit-row">
        <button type="submit" className="btn-green" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
      </div>
    </form>
  )
}

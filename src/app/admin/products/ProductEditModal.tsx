'use client'

import { useState, useEffect } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type ProductFormData = {
  id?: number
  name: string
  priceBdt: string
  salePriceBdt: string
  imageUrl: string
  description: string
  categorySlug: string
  isActive: boolean
  isCake: boolean
}

const EMPTY: ProductFormData = {
  name: '', priceBdt: '', salePriceBdt: '', imageUrl: '', description: '',
  categorySlug: '', isActive: true, isCake: false,
}

export function ProductEditModal({
  productId,
  isNew,
  onClose,
  onSaved,
}: {
  productId: number | null
  isNew: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [data, setData] = useState<ProductFormData>(EMPTY)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) {
      setData(EMPTY)
      setLoading(false)
      return
    }
    if (productId === null) return
    setLoading(true)
    fetch(`/api/admin/products/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.product) {
          setData({
            id: d.product.id,
            name: d.product.name || '',
            priceBdt: String(d.product.priceBdt || ''),
            salePriceBdt: d.product.salePriceBdt ? String(d.product.salePriceBdt) : '',
            imageUrl: d.product.imageUrl || '',
            description: d.product.description || '',
            categorySlug: d.product.categories?.[0]?.slug || '',
            isActive: d.product.isActive,
            isCake: d.product.isCake,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [productId, isNew])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: data.name,
      priceBdt: Number(data.priceBdt),
      salePriceBdt: data.salePriceBdt ? Number(data.salePriceBdt) : null,
      imageUrl: data.imageUrl,
      description: data.description,
      isActive: data.isActive,
      isCake: data.isCake,
    }

    try {
      let res
      if (isNew) {
        res = await fetch('/api/admin/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, categorySlug: data.categorySlug }),
        })
      } else {
        res = await fetch(`/api/admin/products/${productId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      if (res.ok) {
        toast.success(isNew ? 'Product added!' : 'Product updated!')
        onSaved()
      } else {
        toast.error('Failed to save')
      }
    } catch {
      toast.error('Error saving product')
    }
    setSaving(false)
  }

  async function deleteProduct() {
    if (!data.id || !confirm('Delete this product?')) return
    const res = await fetch(`/api/admin/products/${data.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Product deleted')
      onSaved()
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 8, maxWidth: 600, width: '100%',
          maxHeight: '85vh', overflowY: 'auto', padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#1a1a2e' }}>
            {isNew ? 'Add New Product' : 'Edit Product'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Loading...</p>
        ) : (
          <form onSubmit={save}>
            {/* Image preview */}
            {data.imageUrl && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.imageUrl} alt="Preview" style={{ width: 120, height: 120, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 4 }} />
              </div>
            )}

            <div className="admin-form-row">
              <label>Product Name *</label>
              <input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} required />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="admin-form-row" style={{ flex: 1 }}>
                <label style={{ width: 80 }}>Price (BDT) *</label>
                <input type="number" value={data.priceBdt} onChange={(e) => setData({ ...data, priceBdt: e.target.value })} required />
              </div>
              <div className="admin-form-row" style={{ flex: 1 }}>
                <label style={{ width: 80 }}>Sale Price</label>
                <input type="number" value={data.salePriceBdt} onChange={(e) => setData({ ...data, salePriceBdt: e.target.value })} placeholder="Optional" />
              </div>
            </div>

            <div className="admin-form-row">
              <label>Image URL</label>
              <input value={data.imageUrl} onChange={(e) => setData({ ...data, imageUrl: e.target.value })} placeholder="/products/photo.jpg" />
            </div>

            {isNew && (
              <div className="admin-form-row">
                <label>Category Slug</label>
                <input value={data.categorySlug} onChange={(e) => setData({ ...data, categorySlug: e.target.value })} placeholder="flowers / cake / food..." />
              </div>
            )}

            <div className="admin-form-row" style={{ alignItems: 'flex-start' }}>
              <label style={{ marginTop: 4, width: 100 }}>Description</label>
              <textarea value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} rows={4} style={{ height: 'auto' }} />
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
                <input type="checkbox" checked={data.isActive} onChange={(e) => setData({ ...data, isActive: e.target.checked })} style={{ width: 'auto' }} />
                Active
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
                <input type="checkbox" checked={data.isCake} onChange={(e) => setData({ ...data, isCake: e.target.checked })} style={{ width: 'auto' }} />
                Is Cake
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {!isNew && data.id ? (
                <button type="button" onClick={deleteProduct} className="admin-btn admin-btn-danger">
                  <Trash2 size={14} /> Delete
                </button>
              ) : <div />}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={onClose} className="admin-btn admin-btn-outline">Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : (isNew ? 'Add Product' : 'Save Changes')}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

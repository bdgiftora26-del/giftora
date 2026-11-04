'use client'

import { useState, useEffect } from 'react'
import { X, Save, Trash2, Plus, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/admin/ImageUpload'

type Category = { id: number; slug: string; name: string; parentId: number | null; parentName?: string }

type ProductFormData = {
  id?: number
  name: string
  slug: string
  priceBdt: string
  salePriceBdt: string
  imageUrl: string
  description: string
  categorySlug: string
  isActive: boolean
  isCake: boolean
  features: string[]
  stockQty: string
  weightGrams: string
  metaTitle: string
  metaDescription: string
}

const EMPTY: ProductFormData = {
  name: '', slug: '', priceBdt: '', salePriceBdt: '', imageUrl: '', description: '',
  categorySlug: '', isActive: true, isCake: false, features: [],
  stockQty: '', weightGrams: '', metaTitle: '', metaDescription: '',
}

// Generate a URL-safe slug from a product name. Used as a default when
// the admin hasn't manually set a slug.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
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
  const [categories, setCategories] = useState<Category[]>([])

  // Load categories from API
  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((d) => {
        const cats: Category[] = []
        ;(d.categories || []).forEach((c: any) => {
          cats.push({ id: c.id, slug: c.slug, name: c.name, parentId: null })
          ;(c.children || []).forEach((ch: any) => {
            cats.push({ id: ch.id, slug: ch.slug, name: ch.name, parentId: c.id, parentName: c.name })
          })
        })
        setCategories(cats)
      })
      .catch(() => {})
  }, [])

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
            slug: d.product.slug || '',
            priceBdt: String(d.product.priceBdt || ''),
            salePriceBdt: d.product.salePriceBdt ? String(d.product.salePriceBdt) : '',
            imageUrl: d.product.imageUrl || '',
            description: d.product.description || '',
            categorySlug: d.product.categories?.[0]?.slug || '',
            isActive: d.product.isActive,
            isCake: d.product.isCake,
            features: d.product.shortDescription ? d.product.shortDescription.split('|').filter(Boolean) : [],
            stockQty: d.product.stockQty != null ? String(d.product.stockQty) : '',
            weightGrams: d.product.weightGrams != null ? String(d.product.weightGrams) : '',
            metaTitle: d.product.metaTitle || '',
            metaDescription: d.product.metaDescription || '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [productId, isNew])

  // Auto-generate slug from name when adding a new product (only if slug
  // is empty or matches the previous auto-generated value).
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  function onNameChange(name: string) {
    if (isNew && !slugManuallyEdited) {
      setData((d) => ({ ...d, name, slug: slugify(name) }))
    } else {
      setData((d) => ({ ...d, name }))
    }
  }
  function onSlugChange(slug: string) {
    setSlugManuallyEdited(true)
    setData((d) => ({ ...d, slug: slugify(slug) }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    // Validate slug for new products — it must be non-empty and unique.
    // For existing products, the slug can be changed but must remain unique.
    const finalSlug = data.slug || slugify(data.name)
    if (!finalSlug) {
      toast.error('Please enter a product name (used to generate the URL slug).')
      setSaving(false)
      return
    }

    const payload = {
      name: data.name,
      slug: finalSlug,
      priceBdt: Number(data.priceBdt),
      salePriceBdt: data.salePriceBdt ? Number(data.salePriceBdt) : null,
      imageUrl: data.imageUrl,
      description: data.description,
      isActive: data.isActive,
      isCake: data.isCake,
      features: data.features.filter(Boolean),
      categorySlug: data.categorySlug,
      stockQty: data.stockQty ? Number(data.stockQty) : null,
      weightGrams: data.weightGrams ? Number(data.weightGrams) : null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
    }

    try {
      let res
      if (isNew) {
        res = await fetch('/api/admin/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to save')
      }
    } catch {
      toast.error('Error saving product')
    }
    setSaving(false)
  }

  async function deleteProduct() {
    if (!data.id || !confirm('Delete this product? It will be removed from all categories.')) return
    const res = await fetch(`/api/admin/products/${data.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Product deleted')
      onSaved()
    } else {
      toast.error('Failed to delete')
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 8, maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#1a1a2e' }}>{isNew ? 'Add New Product' : 'Edit Product'}</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {loading ? (
          <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Loading...</p>
        ) : (
          <form onSubmit={save}>
            <div style={{ marginBottom: 16 }}>
              <ImageUpload value={data.imageUrl} onChange={(url) => setData({ ...data, imageUrl: url })} label="Product Image" hint="JPG, PNG, WebP — max 2MB" />
            </div>

            <div className="admin-form-row">
              <label>Product Name *</label>
              <input value={data.name} onChange={(e) => onNameChange(e.target.value)} required />
            </div>

            {/* URL slug — auto-generated from name, manually editable */}
            <div className="admin-form-row" style={{ alignItems: 'center' }}>
              <label style={{ width: 100 }}>URL Slug</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <span style={{ fontSize: 12, color: '#999' }}>/product/</span>
                <input
                  value={data.slug}
                  onChange={(e) => onSlugChange(e.target.value)}
                  placeholder="auto-generated-from-name"
                  style={{ flex: 1, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="admin-form-row" style={{ flex: 1 }}>
                <label style={{ width: 80 }}>Price (BDT) *</label>
                <input type="number" step="0.01" value={data.priceBdt} onChange={(e) => setData({ ...data, priceBdt: e.target.value })} required />
              </div>
              <div className="admin-form-row" style={{ flex: 1 }}>
                <label style={{ width: 80 }}>Sale Price</label>
                <input type="number" step="0.01" value={data.salePriceBdt} onChange={(e) => setData({ ...data, salePriceBdt: e.target.value })} placeholder="Optional" />
              </div>
            </div>

            {/* Stock quantity + weight (grams) — side by side */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="admin-form-row" style={{ flex: 1 }}>
                <label style={{ width: 100 }}>Stock Qty</label>
                <input
                  type="number"
                  min="0"
                  value={data.stockQty}
                  onChange={(e) => setData({ ...data, stockQty: e.target.value })}
                  placeholder="Leave empty = unlimited"
                />
              </div>
              <div className="admin-form-row" style={{ flex: 1 }}>
                <label style={{ width: 100 }}>Weight (g)</label>
                <input
                  type="number"
                  min="0"
                  value={data.weightGrams}
                  onChange={(e) => setData({ ...data, weightGrams: e.target.value })}
                  placeholder="e.g. 500 for 500g cake"
                />
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#999', margin: '-8px 0 12px 100px' }}>
              Weight is shown on the product page (e.g. &quot;Weight: 500g&quot;) and is optional.
            </p>

            {/* Category dropdown — always shown (add + edit) */}
            <div className="admin-form-row">
              <label>Category *</label>
              <select
                value={data.categorySlug}
                onChange={(e) => setData({ ...data, categorySlug: e.target.value })}
                required
                style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
              >
                <option value="">— Select Category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.parentName ? `${c.parentName} → ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-row" style={{ alignItems: 'flex-start' }}>
              <label style={{ marginTop: 4, width: 100 }}>Description</label>
              <textarea value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} rows={4} style={{ height: 'auto' }} />
            </div>

            {/* Product Features */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8 }}>
                Product Features (shown below price on product page)
              </label>
              {data.features.map((feature, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input
                    value={feature}
                    onChange={(e) => { const features = [...data.features]; features[i] = e.target.value; setData({ ...data, features }) }}
                    placeholder={`Feature ${i + 1}`}
                    style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
                  />
                  <button type="button" onClick={() => setData({ ...data, features: data.features.filter((_, idx) => idx !== i) })}
                    style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setData({ ...data, features: [...data.features, ''] })} className="admin-btn admin-btn-outline" style={{ padding: '5px 12px', fontSize: 12 }}>
                <Plus size={12} /> Add Feature
              </button>
            </div>

            {/* === SEO Section === */}
            <div
              style={{
                marginBottom: 16,
                padding: 14,
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Globe size={14} style={{ color: '#0284c7' }} />
                <strong style={{ fontSize: 13, color: '#0c4a6e' }}>SEO Settings (optional)</strong>
              </div>
              <p style={{ fontSize: 11, color: '#075985', margin: '0 0 12px' }}>
                Custom meta title + description for search engines and social sharing.
                Leave blank to auto-generate from the product name + description.
              </p>

              <div className="admin-form-row" style={{ marginBottom: 8 }}>
                <label style={{ width: 120 }}>Meta Title</label>
                <input
                  value={data.metaTitle}
                  onChange={(e) => setData({ ...data, metaTitle: e.target.value })}
                  placeholder="Auto: {Product Name} — BDGiftora.com"
                  maxLength={70}
                  style={{ flex: 1 }}
                />
              </div>
              <p style={{ fontSize: 10, color: '#0284c7', margin: '-4px 0 8px 120px' }}>
                {(data.metaTitle || '').length}/70 chars — keep under 60 for best Google display.
              </p>

              <div className="admin-form-row" style={{ alignItems: 'flex-start', marginBottom: 0 }}>
                <label style={{ width: 120, marginTop: 4 }}>Meta Description</label>
                <textarea
                  value={data.metaDescription}
                  onChange={(e) => setData({ ...data, metaDescription: e.target.value })}
                  placeholder="Auto: first 160 chars of product description"
                  maxLength={170}
                  rows={2}
                  style={{ flex: 1, height: 'auto', resize: 'vertical' }}
                />
              </div>
              <p style={{ fontSize: 10, color: '#0284c7', margin: '4px 0 0 120px' }}>
                {(data.metaDescription || '').length}/170 chars — keep under 160 for best Google display.
              </p>
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
                <button type="button" onClick={deleteProduct} className="admin-btn admin-btn-danger"><Trash2 size={14} /> Delete</button>
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

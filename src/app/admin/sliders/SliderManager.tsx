'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'

type Banner = {
  id: number
  placement: string
  title: string
  imageUrl: string | null
  link: string | null
  sortOrder: number
  isActive: boolean
}

export function SliderManager() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => { fetchBanners() }, [])

  async function fetchBanners() {
    setLoading(true)
    const res = await fetch('/api/admin/banners?placement=HOME_SLIDER')
    const data = await res.json()
    setBanners(data.banners || [])
    setLoading(false)
  }

  async function deleteBanner(id: number) {
    if (!confirm('Delete this slider?')) return
    await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
    toast.success('Slider deleted')
    setBanners(banners.filter((b) => b.id !== id))
  }

  async function toggleActive(id: number, current: boolean) {
    await fetch(`/api/admin/banners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    setBanners(banners.map((b) => (b.id === id ? { ...b, isActive: !current } : b)))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 className="category-h1" style={{ margin: 0 }}>Home Slider Banners</h2>
        <button type="button" className="btn-green" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Add Slide
        </button>
      </div>
      <p className="checkout-helper">
        <Link href="/admin" className="text-green">← Back to Dashboard</Link>
        {' | '}These banners appear in the homepage hero slider.
      </p>

      {showAdd && <AddSlideForm onAdded={() => { fetchBanners(); setShowAdd(false) }} />}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : banners.length === 0 ? (
        <p className="muted">No slider banners yet. Click "Add Slide" to create one.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {banners.map((b) => (
            <div key={b.id} style={{ border: '1px solid var(--c-line)', padding: 12, background: '#fff' }}>
              {b.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: 120, objectFit: 'cover', marginBottom: 8 }} />
              )}
              <div style={{ fontWeight: 700, fontSize: 13 }}>{b.title}</div>
              {b.link && <div className="muted" style={{ fontSize: 11 }}>→ {b.link}</div>}
              <div className="muted" style={{ fontSize: 11 }}>Order: {b.sortOrder} • {b.isActive ? 'Active' : 'Inactive'}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => toggleActive(b.id, b.isActive)}
                  className="btn-blue"
                  style={{ fontSize: 11 }}
                >
                  {b.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteBanner(b.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-brand-red)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddSlideForm({ onAdded }: { onAdded: () => void }) {
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [link, setLink] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placement: 'HOME_SLIDER', title, imageUrl, link, isActive: true }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Slider added!')
      onAdded()
    } else {
      toast.error('Failed')
    }
  }

  return (
    <form onSubmit={submit} style={{ background: '#f9f9f9', padding: 16, marginBottom: 16, border: '1px solid var(--c-line)' }}>
      <h3 style={{ marginTop: 0 }}>Add Slider Slide</h3>
      <div className="checkout-form-row">
        <label>Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="5% OFF — Code: GIFT" />
      </div>
      <div className="checkout-form-row">
        <label>Image URL *</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required placeholder="/products/promo1.jpg" />
      </div>
      <div className="checkout-form-row">
        <label>Link (optional)</label>
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/saleitems" />
      </div>
      <div className="submit-row">
        <button type="submit" className="btn-green" disabled={saving}>{saving ? 'Saving...' : 'Add Slide'}</button>
      </div>
    </form>
  )
}

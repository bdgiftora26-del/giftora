'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Trash2, X, ChevronRight, FolderPlus } from 'lucide-react'
import { toast } from 'sonner'

type Category = {
  id: number
  slug: string
  name: string
  description: string
  icon: string | null
  showInSidebar: boolean
  sortOrder: number
  children: { id: number; slug: string; name: string; icon: string | null; showInSidebar: boolean; sortOrder: number }[]
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; category: Category | null; parentId: number | null; isNew: boolean }>({
    open: false, category: null, parentId: null, isNew: false,
  })

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/categories')
    const data = await res.json()
    setCategories(data.categories || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  function openAdd(parentId: number | null = null) {
    setModal({ open: true, category: null, parentId, isNew: true })
  }

  function openEdit(cat: Category, isChild = false) {
    setModal({ open: true, category: { ...cat, parentId: isChild ? undefined : undefined } as any, parentId: null, isNew: false })
  }

  function closeModal() {
    setModal({ open: false, category: null, parentId: null, isNew: false })
  }

  async function deleteCategory(id: number, name: string, hasChildren: boolean) {
    if (hasChildren) {
      toast.error('Cannot delete — this category has children. Delete children first.')
      return
    }
    if (!confirm(`Delete "${name}"? Products in this category will be unlinked.`)) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Category deleted')
      fetchCategories()
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error || 'Failed to delete')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 className="admin-page-title">Categories ({categories.length})</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => openAdd(null)}>
          <Plus size={14} /> Add Category
        </button>
      </div>

      <Link href="/admin" className="admin-back-link">← Back to Dashboard</Link>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading categories...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.map((cat) => (
            <div key={cat.id} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, overflow: 'hidden' }}>
              {/* Top-level category */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: '#f8f9fa', borderBottom: cat.children.length ? '1px solid #e0e0e0' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{cat.name}</span>
                  <span style={{ fontSize: 11, color: '#999' }}>/ {cat.slug}</span>
                  {!cat.showInSidebar && <span style={{ fontSize: 10, color: '#dc3545', background: '#fde8e8', padding: '1px 6px', borderRadius: 3 }}>hidden</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => openAdd(cat.id)} className="admin-btn admin-btn-outline" style={{ padding: '3px 8px', fontSize: 11 }}>
                    <FolderPlus size={12} /> Add Child
                  </button>
                  <button type="button" onClick={() => openEdit(cat)} className="admin-btn admin-btn-outline" style={{ padding: '3px 8px' }}>
                    <Edit2 size={13} />
                  </button>
                  <button type="button" onClick={() => deleteCategory(cat.id, cat.name, cat.children.length > 0)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', padding: '3px 8px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {/* Children */}
              {cat.children.length > 0 && (
                <div style={{ padding: '4px 0' }}>
                  {cat.children.map((child) => (
                    <div key={child.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 16px 8px 36px', borderBottom: '1px solid #f0f0f0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ChevronRight size={12} style={{ color: '#ccc' }} />
                        <span style={{ fontSize: 13, color: '#555' }}>{child.name}</span>
                        <span style={{ fontSize: 11, color: '#bbb' }}>/ {child.slug}</span>
                        {!child.showInSidebar && <span style={{ fontSize: 10, color: '#dc3545', background: '#fde8e8', padding: '1px 6px', borderRadius: 3 }}>hidden</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" onClick={() => openEdit(child as any)} className="admin-btn admin-btn-outline" style={{ padding: '2px 8px' }}>
                          <Edit2 size={12} />
                        </button>
                        <button type="button" onClick={() => deleteCategory(child.id, child.name, false)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', padding: '2px 8px' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category edit/add modal */}
      {modal.open && (
        <CategoryEditModal
          category={modal.category}
          parentId={modal.parentId}
          isNew={modal.isNew}
          onClose={closeModal}
          onSaved={() => { closeModal(); fetchCategories() }}
        />
      )}
    </div>
  )
}

function CategoryEditModal({
  category,
  parentId,
  isNew,
  onClose,
  onSaved,
}: {
  category: any
  parentId: number | null
  isNew: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(category?.name || '')
  const [icon, setIcon] = useState(category?.icon || '')
  const [showInSidebar, setShowInSidebar] = useState(category?.showInSidebar !== false)
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      let res
      if (isNew) {
        res = await fetch('/api/admin/categories', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, parentId, icon: icon || null, showInSidebar }),
        })
      } else {
        res = await fetch(`/api/admin/categories/${category.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, icon: icon || null, showInSidebar }),
        })
      }
      if (res.ok) {
        toast.success(isNew ? 'Category added!' : 'Category updated!')
        onSaved()
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Failed to save')
      }
    } catch {
      toast.error('Error saving category')
    }
    setSaving(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 8, maxWidth: 480, width: '100%', padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#1a1a2e' }}>{isNew ? 'Add Category' : 'Edit Category'}</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={save}>
          <div className="admin-form-row">
            <label>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. New Year Gifts" />
          </div>
          <div className="admin-form-row">
            <label>Icon Key</label>
            <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="gift / cake / flower / food..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
              <input type="checkbox" checked={showInSidebar} onChange={(e) => setShowInSidebar(e.target.checked)} style={{ width: 'auto' }} />
              Show in sidebar
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onClose} className="admin-btn admin-btn-outline">Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (isNew ? 'Add Category' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

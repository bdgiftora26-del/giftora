'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ImageUpload({
  value,
  onChange,
  label = 'Image',
  hint,
}: {
  value: string
  onChange: (url: string) => void
  label?: string
  hint?: string
}) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.url) {
        onChange(data.url)
        toast.success('Image uploaded!')
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    }
    setUploading(false)
    // Reset input so same file can be uploaded again
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, color: '#555', fontWeight: 500, marginBottom: 6 }}>
        {label} {hint && <span style={{ color: '#999', fontWeight: 400 }}>({hint})</span>}
      </label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Preview */}
        {value && (
          <div style={{ position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />
            <button
              type="button"
              onClick={() => onChange('')}
              style={{
                position: 'absolute', top: -6, right: -6, background: '#dc3545', color: '#fff',
                border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Upload + URL input */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Paste image URL or upload..."
              style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="admin-btn admin-btn-outline"
              style={{ padding: '5px 12px', whiteSpace: 'nowrap' }}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}

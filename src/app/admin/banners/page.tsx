import Link from 'next/link'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { StorefrontShell } from '@/components/layout/StorefrontShell'

export const dynamic = 'force-dynamic'

export default async function AdminBannersPage() {
  await requireAdminSession()

  const [mosaic, tiles] = await Promise.all([
    db.banner.findMany({ where: { placement: 'HOME_MOSAIC' }, orderBy: { sortOrder: 'asc' } }),
    db.banner.findMany({ where: { placement: 'HOME_TILES' }, orderBy: { sortOrder: 'asc' } }),
  ])

  return (
    <StorefrontShell>
      <div style={{ padding: '12px 16px' }}>
        <h1 className="category-h1">Banners & Home Layout</h1>
        <p className="checkout-helper">
          <Link href="/admin" className="text-green">← Back to Dashboard</Link>
        </p>

        <h2 className="form-section-title">Home Mosaic ({mosaic.length})</h2>
        <table className="cart-table">
          <thead>
            <tr><th>Title</th><th>Link</th><th>Active</th><th>Order</th></tr>
          </thead>
          <tbody>
            {mosaic.map((b) => (
              <tr key={b.id}>
                <td>{b.title}</td>
                <td>{b.link || '—'}</td>
                <td>{b.isActive ? '✓' : '✗'}</td>
                <td>{b.sortOrder}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="form-section-title mt-4">Home Tiles ({tiles.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {tiles.map((b) => (
            <div key={b.id} style={{ border: '1px solid var(--c-line)', padding: 8, background: '#fff' }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{b.title}</div>
              <div className="muted" style={{ fontSize: 10 }}>{b.link}</div>
              <div className="muted" style={{ fontSize: 10 }}>Order: {b.sortOrder} {b.isActive ? '• Active' : '• Inactive'}</div>
            </div>
          ))}
        </div>
        <p className="muted mt-2" style={{ fontSize: 11 }}>
          Note: Full banner editing (upload, reorder, toggle) is available in the complete admin build.
        </p>
      </div>
    </StorefrontShell>
  )
}

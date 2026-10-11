import Link from 'next/link'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { CategoryIcon } from '@/components/CategoryIcon'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  await requireAdminSession()

  const categories = await db.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: { i18n: { where: { locale: 'en' } }, children: { include: { i18n: { where: { locale: 'en' } } } } },
  })

  return (
    <StorefrontShell>
      <div style={{ padding: '12px 16px' }}>
        <h1 className="category-h1">Categories</h1>
        <p className="checkout-helper">
          <Link href="/admin" className="text-green">← Back to Dashboard</Link>
        </p>

        <div style={{ border: '1px solid var(--c-line)', background: '#fff' }}>
          {categories.map((cat) => {
            const name = cat.i18n[0]?.name || cat.slug
            return (
              <div key={cat.id} style={{ borderBottom: '1px solid var(--c-line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--c-green-soft)' }}>
                  <span style={{ color: 'var(--c-text-soft)' }}><CategoryIcon icon={cat.icon} /></span>
                  <strong>{name}</strong>
                  <span className="muted" style={{ fontSize: 11 }}>/ {cat.slug}</span>
                  {cat.cityId && <span className="muted" style={{ fontSize: 11 }}>(city-specific)</span>}
                  <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{cat.children.length} subcategories</span>
                </div>
                {cat.children.length > 0 && (
                  <div style={{ paddingLeft: 32 }}>
                    {cat.children.map((ch) => (
                      <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderBottom: '1px solid var(--c-line)' }}>
                        <span style={{ color: 'var(--c-text-muted)' }}><CategoryIcon icon={ch.icon} /></span>
                        <span style={{ fontSize: 12 }}>{ch.i18n[0]?.name || ch.slug}</span>
                        <span className="muted" style={{ fontSize: 10 }}>/ {ch.slug}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="muted mt-2" style={{ fontSize: 11 }}>
          Note: Full drag-and-drop editing is available in the complete admin build. This view shows the current tree.
        </p>
      </div>
    </StorefrontShell>
  )
}

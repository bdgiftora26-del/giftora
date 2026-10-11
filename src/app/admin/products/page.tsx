import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { toNumber } from '@/lib/money'
import { StorefrontShell } from '@/components/layout/StorefrontShell'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'EDITOR') redirect('/account')

  const sp = await searchParams
  const q = sp.q || ''
  const products = await db.product.findMany({
    where: q
      ? { OR: [{ sku: { contains: q } }, { slug: { contains: q } }, { i18n: { some: { name: { contains: q } } } }] }
      : undefined,
    include: { i18n: { where: { locale: 'en' } }, images: { take: 1, orderBy: { sortOrder: 'asc' } }, categories: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <StorefrontShell>
      <div style={{ padding: '12px 16px' }}>
        <h1 className="category-h1">Products ({products.length})</h1>
        <p className="checkout-helper">
          <Link href="/admin" className="text-green">← Back to Dashboard</Link>
        </p>

        <form style={{ marginBottom: 12 }}>
          <input name="q" defaultValue={q} placeholder="Search by name or SKU" style={{ width: 240 }} />
          <button type="submit" className="btn-green" style={{ marginLeft: 6 }}>Search</button>
        </form>

        <div style={{ overflowX: 'auto' }}>
          <table className="cart-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Price (BDT)</th>
                <th>Sale</th>
                <th>Stock</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.sku}</td>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images[0]?.url || '/placeholders/products/generic-01.svg'} alt="" width={30} height={30} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
                    {p.i18n[0]?.name || p.slug}
                  </td>
                  <td>৳{toNumber(p.priceBdt).toFixed(0)}</td>
                  <td>{p.salePriceBdt ? `৳${toNumber(p.salePriceBdt).toFixed(0)}` : '—'}</td>
                  <td>{p.stockMode === 'TRACKED' ? p.stockQty : '∞'}</td>
                  <td>{p.isActive ? '✓' : '✗'}</td>
                  <td>
                    <ToggleActive id={p.id} active={p.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </StorefrontShell>
  )
}

function ToggleActive({ id, active }: { id: number; active: boolean }) {
  return (
    <form
      action={async () => {
        'use server'
        await db.product.update({ where: { id }, data: { isActive: !active } })
      }}
      style={{ display: 'inline' }}
    >
      <button type="submit" className="btn-green" style={{ padding: '2px 8px', fontSize: 11 }}>
        {active ? 'Deactivate' : 'Activate'}
      </button>
    </form>
  )
}

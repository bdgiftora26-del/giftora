import Link from 'next/link'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { allSettledFallback } from '@/lib/db-resilient'
import { toNumber } from '@/lib/money'
import { AdminShell } from '@/components/admin/AdminShell'
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  await requireAdminSession()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [ordersToday, totalRevenue, pendingPayment, awaitingPayment, lowStock, totalProducts, totalOrders, recentOrders] = (await allSettledFallback([
    { run: () => db.order.count({ where: { createdAt: { gte: today } } }), fallback: 0 as any },
    { run: () => db.order.aggregate({ where: { status: 'PAID' }, _sum: { totalBdt: true } }), fallback: { _sum: { totalBdt: 0 } } as any },
    { run: () => db.order.count({ where: { status: 'PROCESSING' } }), fallback: 0 as any },
    { run: () => db.order.count({ where: { status: 'AWAITING_PAYMENT' } }), fallback: 0 as any },
    { run: () => db.product.count({ where: { stockMode: 'TRACKED', stockQty: { lt: 5 } } }), fallback: 0 as any },
    { run: () => db.product.count(), fallback: 0 as any },
    { run: () => db.order.count(), fallback: 0 as any },
    {
      run: () => db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { delivery: { include: { city: true } } } }),
      fallback: [] as any,
    },
  ])) as any

  return (
    <AdminShell>
      <div style={{ padding: '12px 16px' }}>
        <h1 className="category-h1">Admin Dashboard</h1>
        <p className="checkout-helper">
          Welcome, Administrator. Manage your store below.
          <AdminLogoutButton />
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard label="Orders Today" value={String(ordersToday)} />
          <StatCard label="Total Orders" value={String(totalOrders)} />
          <StatCard label="Revenue (PAID)" value={`৳${toNumber(totalRevenue._sum.totalBdt || 0).toFixed(0)}`} />
          <StatCard label="Awaiting Payment" value={String(awaitingPayment)} />
          <StatCard label="Processing" value={String(pendingPayment)} />
          <StatCard label="Low Stock" value={String(lowStock)} />
          <StatCard label="Products" value={String(totalProducts)} />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <Link href="/admin/products" className="btn-green">Manage Products</Link>
          <Link href="/admin/orders" className="btn-green">Manage Orders</Link>
          <Link href="/admin/sliders" className="btn-green">Home Sliders</Link>
          <Link href="/admin/categories" className="btn-green">Categories</Link>
          <Link href="/admin/banners" className="btn-green">Banners</Link>
        </div>

        <h2 className="form-section-title">Recent Orders</h2>
        <table className="cart-table">
          <thead>
            <tr>
              <th>Order No</th>
              <th>Customer</th>
              <th>City</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id}>
                <td>{o.orderNo}</td>
                <td>{o.invFirstName} {o.invLastName}</td>
                <td>{o.delivery?.city.name || '—'}</td>
                <td>৳{toNumber(o.totalBdt).toFixed(0)}</td>
                <td>{o.status.replace(/_/g, ' ')}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid var(--c-line)', padding: 12, background: '#fff', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-green-dark)' }}>{value}</div>
    </div>
  )
}

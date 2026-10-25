import Link from 'next/link'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { toNumber } from '@/lib/money'
import { AdminShell } from '@/components/admin/AdminShell'
import { OrderStatusChanger } from './OrderStatusChanger'

export const dynamic = 'force-dynamic'

const STATUSES = ['AWAITING_PAYMENT', 'PAID', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireAdminSession()

  const sp = await searchParams
  const statusFilter = sp.status && (STATUSES as readonly string[]).includes(sp.status) ? sp.status : undefined

  const orders = await db.order.findMany({
    where: statusFilter ? { status: statusFilter as (typeof STATUSES)[number] } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { delivery: { include: { city: true } }, items: true, events: { orderBy: { createdAt: 'asc' } } },
  })

  return (
    <AdminShell>
      <div style={{ padding: '12px 16px' }}>
        <h1 className="category-h1">Orders ({orders.length})</h1>
        <p className="checkout-helper">
          <Link href="/admin" className="text-green">← Back to Dashboard</Link>
          {' | '}Filter:{' '}
          <Link href="/admin/orders" className="text-green">All</Link>
          {STATUSES.map((s) => (
            <span key={s}> | <Link href={`/admin/orders?status=${s}`} className="text-green">{s.replace(/_/g, ' ')}</Link></span>
          ))}
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Customer</th>
                <th>Recipient</th>
                <th>City</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.orderNo}</td>
                  <td>
                    {o.invFirstName} {o.invLastName}<br />
                    <span className="muted" style={{ fontSize: 10 }}>{o.invEmail}</span>
                  </td>
                  <td>{o.delivery?.recipientName}<br /><span className="muted" style={{ fontSize: 10 }}>{o.delivery?.recipientPhone}</span></td>
                  <td>{o.delivery?.city.name || '—'}</td>
                  <td>৳{toNumber(o.totalBdt).toFixed(0)}</td>
                  <td>
                    <OrderStatusChanger orderId={o.id} current={o.status} statuses={STATUSES as unknown as string[]} />
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/checkout/complete/${o.orderNo}`} className="text-green" style={{ fontSize: 11 }}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  )
}

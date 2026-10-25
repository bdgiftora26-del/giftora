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
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  await requireAdminSession()

  const sp = await searchParams
  const statusFilter = sp.status && (STATUSES as readonly string[]).includes(sp.status) ? sp.status : undefined
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1)
  const PER_PAGE = 15

  const where = statusFilter ? { status: statusFilter as (typeof STATUSES)[number] } : undefined
  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true, orderNo: true, status: true, totalBdt: true, createdAt: true,
        invFirstName: true, invLastName: true, invEmail: true,
        delivery: { select: { recipientName: true, recipientPhone: true, city: { select: { name: true } } } },
      },
    }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

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

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
              {page > 1 && (
                <Link href={`/admin/orders?${statusFilter ? 'status=' + statusFilter + '&' : ''}page=${page - 1}`} className="admin-btn admin-btn-outline" style={{ padding: '4px 12px', textDecoration: 'none' }}>
                  ← Prev
                </Link>
              )}
              <span style={{ fontSize: 13, color: '#555' }}>Page {page} of {totalPages} ({total} orders)</span>
              {page < totalPages && (
                <Link href={`/admin/orders?${statusFilter ? 'status=' + statusFilter + '&' : ''}page=${page + 1}`} className="admin-btn admin-btn-outline" style={{ padding: '4px 12px', textDecoration: 'none' }}>
                  Next →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  )
}

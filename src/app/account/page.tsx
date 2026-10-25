import Link from 'next/link'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { toNumber } from '@/lib/money'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return (
    <StorefrontShell withSidebar>
      <div style={{ padding: '12px 16px' }}>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'My Account' }]} />
        <h1 className="category-h1">My Account</h1>
        <p>
          Welcome, <strong>{user.firstName || user.email}</strong> ({user.email}) —{' '}
          <Link href="/api/auth/logout" className="text-green">Logout</Link>
        </p>

        <h2 className="form-section-title">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="muted">You have no orders yet. <Link href="/catalogue" className="text-green">Start shopping</Link>.</p>
        ) : (
          <table className="cart-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total (BDT)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.orderNo}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>{o.status.replace(/_/g, ' ')}</td>
                  <td>৳{toNumber(o.totalBdt).toFixed(2)}</td>
                  <td>
                    <Link href={`/checkout/complete/${o.orderNo}`} className="text-green">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {user.role === 'ADMIN' && (
          <div className="alert alert-info mt-4">
            <p>You are an admin. <Link href="/admin" className="text-green">Go to Admin Panel →</Link></p>
          </div>
        )}
      </div>
    </StorefrontShell>
  )
}

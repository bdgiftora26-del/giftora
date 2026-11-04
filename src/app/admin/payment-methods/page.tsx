import { requireAdminSession } from '@/lib/admin-auth'
import { AdminShell } from '@/components/admin/AdminShell'
import { PaymentMethodsManager } from './PaymentMethodsManager'

export const dynamic = 'force-dynamic'

export default async function AdminPaymentMethodsPage() {
  await requireAdminSession()
  return (
    <AdminShell>
      <div style={{ padding: '12px 16px' }}>
        <h1 className="category-h1">Payment Methods</h1>
        <p className="checkout-helper">
          Enable or disable the payment methods shown to customers at checkout.
        </p>
        <PaymentMethodsManager />
      </div>
    </AdminShell>
  )
}

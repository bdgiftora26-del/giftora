import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { CheckoutInvoiceView } from './CheckoutInvoiceView'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const user = await getCurrentUser()
  return (
    <StorefrontShell withSidebar>
      <div style={{ padding: '12px 16px' }}>
        <CheckoutInvoiceView loggedIn={!!user} />
      </div>
    </StorefrontShell>
  )
}

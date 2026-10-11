import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { CheckoutPaymentView } from './CheckoutPaymentView'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <StorefrontShell withSidebar>
      <div style={{ padding: '12px 16px' }}>
        <CheckoutPaymentView />
      </div>
    </StorefrontShell>
  )
}

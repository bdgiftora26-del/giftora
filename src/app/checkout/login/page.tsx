import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { CheckoutLoginView } from './CheckoutLoginView'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <StorefrontShell withSidebar>
      <div style={{ padding: '12px 16px' }}>
        <CheckoutLoginView />
      </div>
    </StorefrontShell>
  )
}

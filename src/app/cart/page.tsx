import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { CartView } from './CartView'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <StorefrontShell withSidebar>
      <CartView />
    </StorefrontShell>
  )
}

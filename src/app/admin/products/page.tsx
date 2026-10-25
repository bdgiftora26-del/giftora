import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { requireAdminSession } from '@/lib/admin-auth'
import { AdminProductsManager } from './AdminProductsManager'

export const dynamic = 'force-dynamic'

export default async function Page() {
  await requireAdminSession()
  return (
    <StorefrontShell>
      <div style={{ padding: '12px 16px' }}>
        <AdminProductsManager />
      </div>
    </StorefrontShell>
  )
}

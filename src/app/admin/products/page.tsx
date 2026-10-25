import { AdminShell } from '@/components/admin/AdminShell'
import { requireAdminSession } from '@/lib/admin-auth'
import { AdminProductsManager } from './AdminProductsManager'

export const dynamic = 'force-dynamic'

export default async function Page() {
  await requireAdminSession()
  return (
    <AdminShell>
      <div style={{ padding: '12px 16px' }}>
        <AdminProductsManager />
      </div>
    </AdminShell>
  )
}

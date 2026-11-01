import { AdminShell } from '@/components/admin/AdminShell'
import { requireAdminSession } from '@/lib/admin-auth'
import { CategoryManager } from './CategoryManager'

export const dynamic = 'force-dynamic'

export default async function Page() {
  await requireAdminSession()
  return (
    <AdminShell>
      <div style={{ padding: '24px' }}>
        <CategoryManager />
      </div>
    </AdminShell>
  )
}

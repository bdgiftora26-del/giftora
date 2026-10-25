import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { CheckoutDeliveryView } from './CheckoutDeliveryView'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const cities = await db.city.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, slug: true, name: true, isFreeDelivery: true },
  })
  return (
    <StorefrontShell withSidebar>
      <div style={{ padding: '12px 16px' }}>
        <CheckoutDeliveryView cities={cities} />
      </div>
    </StorefrontShell>
  )
}

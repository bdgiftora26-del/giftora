import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { TrackOrderView } from './TrackOrderView'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <StorefrontShell>
      <Suspense fallback={<div style={{ padding: 20 }}>Loading…</div>}>
        <TrackOrderView />
      </Suspense>
    </StorefrontShell>
  )
}

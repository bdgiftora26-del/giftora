import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { HomeClient } from '@/components/home/HomeClient'

// Static shell — no DB query at build or request time
// All data fetched client-side via API (cached by browser + CDN)
export const dynamic = 'force-static'

export default function HomePage() {
  return (
    <StorefrontShell>
      <HomeClient />
    </StorefrontShell>
  )
}

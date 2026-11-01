import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { HomeClient } from '@/components/home/HomeClient'
import { getHomeData } from '@/lib/home-data'

// Server-rendered homepage. Data is loaded SERVER-SIDE here (using the cached
// `home` loader) and passed to <HomeClient> as props — so the browser receives
// a COMPLETE page (header + slider + product sections + footer) in a single
// HTML response. No client-side loading spinner in the middle.
//
// Cache behaviour:
//   - First visitor after a bust: server pays the DB cost (~5s) but renders the
//     FULL page. The user sees the browser's native page-load indicator, then
//     the entire page appears at once.
//   - Every subsequent visitor: cache hit (~6ms) → instant full page.
export const dynamic = 'force-dynamic'
// Re-render at most every 15 min even without a mutation (matches cache TTL).
export const revalidate = 900

export default async function HomePage() {
  const data = await getHomeData('en')
  return (
    <StorefrontShell>
      <HomeClient data={data} />
    </StorefrontShell>
  )
}

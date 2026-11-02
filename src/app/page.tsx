import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { HomeClient } from '@/components/home/HomeClient'
import { getHomeData } from '@/lib/home-data'

// ISR homepage — the page HTML is cached at the CDN edge and regenerated at
// most every 15 minutes (or immediately when an admin mutation calls
// `bustProduct`/`bustBanner`/`bustCategory`, which triggers `revalidateTag`).
//
// Why NOT `force-dynamic`: that mode made every request render from scratch
// on the server. On Vercel Hobby that means a fresh serverless invocation per
// visitor — and a cold-start + DB round-trip could push TTFB to 5-28s. With
// ISR, the CDN serves the cached HTML in ~50ms for the vast majority of hits.
//
// Data still flows through the two-tier cache in src/lib/cache.ts (L1 in-mem +
// L2 Next.js Data Cache), so even the rare regeneration is fast.
export const revalidate = 900 // 15 min — matches the HOME cache TTL

export default async function HomePage() {
  const data = await getHomeData('en')
  return (
    <StorefrontShell>
      <HomeClient data={data} />
    </StorefrontShell>
  )
}

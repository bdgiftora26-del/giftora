// scripts/prewarm-cache.ts
// -------------------------
// Hits the most-visited pages on the live site so the ISR cache stays warm
// and the serverless function doesn't go cold between real visitors.
//
// Run as a Vercel Cron Job (configured in vercel.json — every 10 minutes).
// Vercel Cron invokes /api/cron/prewarm which calls this module.
//
// Without pre-warming:
//   - Home page cache expires every 15 min (ISR revalidate).
//   - If 15+ min pass with no visitors, the NEXT visitor hits a cold regen
//     (~5-10s on Vercel Hobby). Same for category + product pages.
//
// With pre-warming every 10 min:
//   - The cache is refreshed BEFORE it expires for any human visitor.
//   - Real visitors almost always hit a warm cache (~50-300ms TTFB).
//   - The serverless function stays warm (Vercel keeps instances alive
//     briefly after a request — pre-warming extends that indefinitely).
//
// Pages warmed:
//   - Home (TTL 15 min, warmed every 10 min → never expires for users)
//   - Top 6 category pages (flowers, cake, food, anniversary, gift-baskets, combo-gifts)
//   - A few popular product detail pages
//
// The list can be tuned. Each request adds ~50-300ms of work; total run
// time ~5-10s for ~15 URLs. Vercel Hobby allows cron jobs (free tier: 2 jobs).

const PREWARM_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bdgiftora.com'

const PREWARM_PATHS: string[] = [
  '/',
  '/flowers',
  '/cake',
  '/food',
  '/anniversary',
  '/gift-baskets',
  '/combo-gifts',
  '/catalogue',
  '/saleitems',
  '/testimonials',
  // Popular product slugs — refresh periodically from analytics
  '/product/mixed-roses-bouquet',
  '/product/strawberry-cream-cake-1lb',
  '/product/ice-cream-tubs-assorted',
]

export async function prewarmCache(): Promise<{ ok: number; fail: number; details: string[] }> {
  const details: string[] = []
  let ok = 0
  let fail = 0

  // Hit pages sequentially (parallel would create a thundering herd of
  // simultaneous cold regenerations — better to stagger them so Vercel
  // can reuse the same warm function instance).
  for (const p of PREWARM_PATHS) {
    const url = PREWARM_BASE_URL + p
    const t0 = Date.now()
    try {
      const res = await fetch(url, {
        // Cache-bust: 'no-cache' forces Vercel's edge to check the origin,
        // which triggers an ISR revalidation if the cache is stale.
        cache: 'no-cache',
        // Don't follow redirects (we want to know the raw status).
        redirect: 'manual',
        // Generous timeout for cold-regen requests.
        signal: AbortSignal.timeout(30_000),
      })
      const dt = Date.now() - t0
      if (res.status >= 200 && res.status < 400) {
        ok++
        details.push(`  ✓ ${p}  ${res.status}  ${dt}ms`)
      } else {
        fail++
        details.push(`  ✗ ${p}  ${res.status}  ${dt}ms`)
      }
    } catch (err: unknown) {
      const dt = Date.now() - t0
      fail++
      const msg = err instanceof Error ? err.message : String(err)
      details.push(`  ✗ ${p}  ERR  ${dt}ms  ${msg}`)
    }
  }
  return { ok, fail, details }
}

// Direct CLI execution: `bun run scripts/prewarm-cache.ts`
// (Vercel Cron route also imports this module — see src/app/api/cron/prewarm/route.ts)
if (import.meta.url === `file://${process.argv[1]}`) {
  prewarmCache()
    .then(({ ok, fail, details }) => {
      console.log(`Pre-warm complete: ${ok} ok, ${fail} fail`)
      details.forEach((d) => console.log(d))
      process.exit(fail > 0 ? 1 : 0)
    })
    .catch((err) => {
      console.error('Fatal:', err)
      process.exit(1)
    })
}

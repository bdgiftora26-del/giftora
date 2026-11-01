// Runs ONCE when the Next.js server starts (dev: on `bun run dev`; prod: on
// cold start of the serverless function). We use it to:
//   1. Ensure the Supabase Storage 'uploads' bucket exists.
//   2. PRE-WARM the homepage + category cache so the FIRST real visitor never
//      waits for a cold DB query — they get a warm cache hit (~6ms) and the
//      full page renders in one shot with NO loading state.
//
// This is the key piece that makes "no loading state on ANY cache scenario"
// possible: by the time a user hits the site, the data is already cached.

export async function register() {
  // Only run on the server (not during build / edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureUploadsBucket } = await import('./lib/supabase-storage')
    const { getHomeData } = await import('./lib/home-data')
    const { getCategoryProducts } = await import('./lib/category-products')
    const { getSidebarCategories } = await import('./lib/catalog')
    const { getCurrencies } = await import('./lib/currency')

    // Fire and forget — don't block server startup
    ;(async () => {
      try {
        console.log('[instrumentation] pre-warming caches...')
        await ensureUploadsBucket()
        // Warm these in parallel — they're the most-hit surfaces
        await Promise.allSettled([
          getHomeData('en'),
          getSidebarCategories('en'),
          getCurrencies(),
          // Warm the most popular category pages
          getCategoryProducts({ category: 'flowers', sort: 'default' }),
          getCategoryProducts({ category: 'cake', sort: 'default' }),
          getCategoryProducts({ category: 'food', sort: 'default' }),
        ])
        console.log('[instrumentation] cache pre-warm complete')
      } catch (e) {
        console.warn('[instrumentation] pre-warm failed (non-fatal):', e)
      }
    })()
  }
}

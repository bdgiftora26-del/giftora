// Two-tier cache for server-side data.
//
// WHY TWO TIERS
//   L1 = process-local in-memory Map. Microseconds. Survives within a single
//        Node.js process (dev mode, warm Vercel function instance).
//   L2 = Next.js Data Cache via `unstable_cache`. Persists across serverless
//        invocations on Vercel (keyed + tagged, invalidated by `revalidateTag`).
//
// On Vercel Hobby, every serverless invocation may be a fresh process — so L1
// alone gives ~0% hit rate in production. Adding L2 means cached data survives
// between invocations and is served from the persistent Data Cache (~5-50ms
// instead of re-running the DB query).
//
// PUBLIC API (unchanged from old in-memory version)
//   cached<T>(key, tags, ttlMs, loader)   — read-through, two-tier
//   invalidateTags(...tags)               — drop L1 + revalidateTag L2
//   invalidateAll()                       — drop L1 (Next.js has no "purge all")
//   cacheStats()                          — L1 introspection
//
// Tag strings used here are the SAME as those passed to `revalidateTag` —
// so admin mutation handlers don't need any changes (they already call
// `bustProduct`/`bustCategory`/etc. in src/lib/cache-tags.ts).

import { unstable_cache, revalidateTag } from 'next/cache'

type Entry = { data: unknown; ts: number; ttl: number; tags: string[] }

// Use globalThis so the L1 store is shared across all route module instances
// within a single Node.js process (Next.js dev + warm serverless instances).
type GlobalWithCache = typeof globalThis & { __APP_CACHE_STORE?: Map<string, Entry> }
const g = globalThis as GlobalWithCache
const store: Map<string, Entry> = g.__APP_CACHE_STORE ?? (g.__APP_CACHE_STORE = new Map())

// Periodic sweep so long-TTL entries don't leak memory forever.
function sweep(now = Date.now()) {
  if (store.size < 200) return
  for (const [k, e] of store) {
    if (now - e.ts > e.ttl) store.delete(k)
  }
}

/**
 * Read-through two-tier cache.
 *
 * - L1 hit → return in microseconds (no async work, no DB).
 * - L1 miss → consult L2 (Next.js Data Cache). L2 hit → populate L1, return.
 * - L2 miss → run `loader`, write both L1 + L2, return.
 *
 * `ttlMs` is converted to seconds for L2 (Next.js uses seconds).
 */
export async function cached<T>(
  key: string,
  tags: string[],
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now()

  // ---- L1 (in-memory) ---------------------------------------------------
  const hit = store.get(key)
  if (hit && now - hit.ts < hit.ttl) {
    return hit.data as T
  }

  // ---- L2 (Next.js Data Cache, persistent on Vercel) --------------------
  // `unstable_cache` requires the key parts to be passed at call time. We
  // encode our full key as the single key part. Tags are passed via options
  // so `revalidateTag(tag)` can bust them from admin routes.
  const ttlSec = Math.max(1, Math.floor(ttlMs / 1000))
  const runWithL2 = unstable_cache(
    async () => loader(),
    [key],
    { revalidate: ttlSec, tags },
  )
  const data = await runWithL2()

  // populate L1 so the next request in the same process is a µs hit
  store.set(key, { data, ts: now, ttl: ttlMs, tags })
  sweep(now)
  return data
}

/**
 * Drop every L1 entry whose tag set intersects `tags`, and ask Next.js to
 * drop the matching L2 entries via `revalidateTag`.
 *
 * Returns the L1 count removed (L2 count is not knowable from here).
 */
export function invalidateTags(...tags: string[]): number {
  if (tags.length === 0) return 0

  // L1: drop matching entries
  const want = new Set(tags)
  let removed = 0
  for (const [k, e] of store) {
    if (e.tags.some((t) => want.has(t))) {
      store.delete(k)
      removed++
    }
  }

  // L2: revalidateTag schedules a purge of every Data Cache entry that was
  // tagged with this string. Safe to call from route handlers / server actions.
  // In Next.js 16 the second arg (`profile`) is required — `'default'` matches
  // our cache life profile for unstable_cache entries.
  for (const t of tags) {
    try {
      revalidateTag(t, 'default')
    } catch {
      // `revalidateTag` can throw if called outside a request context (e.g.
      // during build). We don't want to crash admin mutations because of it.
    }
  }

  if (removed > 0) {
    console.log(`[cache] invalidated ${removed} L1 entries for tags: ${tags.join(', ')}`)
  }
  return removed
}

/** Drop L1 only. (Next.js has no equivalent "purge everything" for L2 — use
 *  `revalidateTag` per tag, or wait for TTL expiry.) */
export function invalidateAll(): number {
  const n = store.size
  store.clear()
  return n
}

/** L1 introspection for an admin debug panel. */
export function cacheStats() {
  const now = Date.now()
  let expired = 0
  const keys: { key: string; ageS: number; ttlS: number; tags: string[] }[] = []
  for (const [k, e] of store) {
    const ageS = Math.round((now - e.ts) / 1000)
    const ttlS = Math.round(e.ttl / 1000)
    if (now - e.ts > e.ttl) expired++
    keys.push({ key: k, ageS, ttlS, tags: e.tags })
  }
  return { size: store.size, expired, keys }
}

/** Build a stable cache key from a base + arbitrary params object. */
export function cacheKey(base: string, params?: Record<string, unknown>): string {
  if (!params) return base
  const parts = Object.keys(params)
    .sort()
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map((k) => `${k}=${String(params[k])}`)
  return parts.length ? `${base}?${parts.join('&')}` : base
}

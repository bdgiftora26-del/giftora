// Tag-based in-memory cache for server-side data.
//
// Design goals (per product owner's request):
//   1. First visitor to a route pays the DB cost and warms the cache.
//   2. Every subsequent visitor gets the cached result in ~microseconds.
//   3. When a product/category/banner/order is mutated in the admin, ONLY the
//      affected cache entries are dropped — so the next visitor re-warms just
//      that slice, not the whole site.
//
// This is a process-local cache (single Next.js server instance). It is NOT
// the Next.js Data Cache (which `force-dynamic` disables). Because every API
// route in this app is `force-dynamic`, we can't rely on `revalidateTag`; we
// manage our own tag graph here.
//
// Public API:
//   cached<T>(key, tags, ttlMs, loader)   — read-through cache helper
//   invalidateTags(...tags)               — drop entries whose tags intersect
//   invalidateAll()                       — drop everything (admin "purge" button)
//   cacheStats()                          — introspection (size, keys)
//
// Tags used across the app (see src/lib/cache-tags.ts for the central map):
//   home, products, product:<slug>, category, category:<slug>,
//   banners, banner:<placement>, orders, admin:dashboard,
//   admin:products, admin:categories, admin:orders, admin:banners, currencies

type Entry = { data: unknown; ts: number; ttl: number; tags: string[] }

// Use globalThis so the store is shared across all route module instances.
// In Next.js dev mode (and serverless), each route may get its own module
// graph; a module-scoped `const store = new Map()` would be a DIFFERENT map per
// route, defeating cross-route tag invalidation. globalThis survives module
// re-instantiation within a single Node.js process.
type GlobalWithCache = typeof globalThis & { __APP_CACHE_STORE?: Map<string, Entry> }
const g = globalThis as GlobalWithCache
const store: Map<string, Entry> = g.__APP_CACHE_STORE ?? (g.__APP_CACHE_STORE = new Map())

// Periodic sweep so long-TTL entries don't leak memory forever. Runs on every
// read/write; cheap because we only iterate when the map is sizeable.
function sweep(now = Date.now()) {
  if (store.size < 200) return
  for (const [k, e] of store) {
    if (now - e.ts > e.ttl) store.delete(k)
  }
}

/** Read-through cache: return cached value if fresh, else run `loader`, cache, return. */
export async function cached<T>(
  key: string,
  tags: string[],
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && now - hit.ts < hit.ttl) {
    return hit.data as T
  }
  const data = await loader()
  store.set(key, { data, ts: now, ttl: ttlMs, tags })
  sweep(now)
  return data
}

/**
 * Drop every entry whose tag set intersects `tags`.
 * Returns the number of entries removed (useful for logs / admin UI).
 */
export function invalidateTags(...tags: string[]): number {
  if (tags.length === 0) return 0
  const want = new Set(tags)
  let removed = 0
  for (const [k, e] of store) {
    if (e.tags.some((t) => want.has(t))) {
      store.delete(k)
      removed++
    }
  }
  if (removed > 0) {
    console.log(`[cache] invalidated ${removed} entries for tags: ${tags.join(', ')}`)
  }
  return removed
}

/** Drop everything. */
export function invalidateAll(): number {
  const n = store.size
  store.clear()
  return n
}

/** Introspection for an admin debug panel. */
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

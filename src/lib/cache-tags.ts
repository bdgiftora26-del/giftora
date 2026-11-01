// Central registry of cache tags, TTLs, and invalidation rules.
//
// Keep this as the single source of truth so that API routes that READ use the
// same tag strings that API routes that WRITE invalidate. Adding a new cached
// surface = add a helper here and call it from both sides.
//
// TTL philosophy: list/dashboard data changes only on admin action, so a long
// TTL (10–15 min) is fine — the admin mutation handler busts the cache
// immediately, so users never see stale data for more than one request after a
// change. Per-entity detail pages (product:<slug>) get a longer TTL because
// they're individually invalidated.

import { invalidateTags } from './cache'

// ---- TTLs (milliseconds) --------------------------------------------------
export const TTL = {
  HOME: 15 * 60_000, // 15 min — home-data aggregate
  CATEGORY_LIST: 15 * 60_000, // public sidebar + admin tree
  CATEGORY_PAGE: 10 * 60_000, // products-in-a-category list
  PRODUCT_DETAIL: 30 * 60_000, // single product page
  PRODUCT_LIST: 10 * 60_000, // generic /api/products list
  BANNER_LIST: 15 * 60_000, // banners by placement
  ORDER_LIST: 5 * 60_000, // admin orders list
  ADMIN_DASHBOARD: 5 * 60_000, // /admin overview stats
  ADMIN_PRODUCTS: 5 * 60_000, // /admin products list
  ADMIN_CATEGORIES: 10 * 60_000, // /admin categories tree
  ADMIN_BANNERS: 10 * 60_000, // /admin banners list
} as const

// ---- Tag builders ---------------------------------------------------------
// Use functions for entity-scoped tags so the slug/id is always included.
export const tag = {
  home: () => 'home',
  products: () => 'products',
  product: (slug: string) => `product:${slug}`,
  category: () => 'category',
  categorySlug: (slug: string) => `category:${slug}`,
  // synthetic tag attached to every "products in a category" cache entry so a
  // category tree change busts all category pages at once.
  categoryPage: () => 'category-page',
  banners: () => 'banners',
  bannerPlacement: (placement: string) => `banner:${placement}`,
  orders: () => 'orders',
  adminDashboard: () => 'admin:dashboard',
  adminProducts: () => 'admin:products',
  adminCategories: () => 'admin:categories',
  adminOrders: () => 'admin:orders',
  adminBanners: () => 'admin:banners',
  currencies: () => 'currencies',
} as const

// ---- Invalidation helpers (call from admin mutation handlers) -------------
// Each helper encodes "what changes when X is mutated" and returns the count
// of dropped cache entries, so handlers can log it.

/** A product was created/updated/deleted. `slug` = product slug (if known),
 *  `categorySlugs` = categories it belongs to (so their list pages bust). */
export function bustProduct(slug?: string, categorySlugs: string[] = []) {
  return invalidateTags(
    tag.home(),
    tag.products(),
    tag.adminProducts(),
    tag.adminDashboard(),
    ...(slug ? [tag.product(slug)] : []),
    ...categorySlugs.map((s) => tag.categorySlug(s)),
  )
}

/** A category was created/updated/deleted. `slug` = category slug,
 *  `parentSlug` = parent (so its children list busts too). */
export function bustCategory(slug?: string, parentSlug?: string) {
  return invalidateTags(
    tag.home(),
    tag.category(),
    tag.adminCategories(),
    tag.products(), // products-in-category lists reference category tree
    tag.categoryPage(), // any category page may be affected
    ...(slug ? [tag.categorySlug(slug)] : []),
    ...(parentSlug ? [tag.categorySlug(parentSlug)] : []),
  )
}

/** A banner was created/updated/deleted. `placement` = banner placement. */
export function bustBanner(placement?: string) {
  return invalidateTags(
    tag.home(),
    tag.banners(),
    tag.adminBanners(),
    ...(placement ? [tag.bannerPlacement(placement)] : []),
  )
}

/** An order's status (or other field) changed. */
export function bustOrder() {
  return invalidateTags(tag.orders(), tag.adminOrders(), tag.adminDashboard())
}

/** Currency rates changed. */
export function bustCurrencies() {
  return invalidateTags(tag.currencies())
}

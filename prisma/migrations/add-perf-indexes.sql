-- ===========================================================================
-- BDGiftora — performance indexes migration
-- ===========================================================================
-- Apply this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- OR via psql: `psql "$DATABASE_URL" -f prisma/migrations/add-perf-indexes.sql`
--
-- These indexes match the @@index() declarations added to prisma/schema.prisma
-- in the perf-optimization branch. They are additive (no data loss, no schema
-- changes to columns) and speed up the hot query paths:
--
--   - Product list queries (WHERE isActive ORDER BY orderCount/priceBdt/createdAt/slug)
--   - Category tree traversal (WHERE parentId, WHERE showInSidebar)
--   - Category path resolution (WHERE slug AND parentId)
--   - Products-in-category reverse lookup (ProductCategory.categoryId)
--   - Banner placement query (WHERE placement AND isActive ORDER BY sortOrder)
--   - Testimonial "latest approved" (WHERE approved ORDER BY createdAt DESC)
--
-- Run is IDEMPOTENT — `IF NOT EXISTS` means re-running is safe. Estimated
-- time on a 123-row products / 108-row categories dataset: <1 second.
-- On larger datasets, CREATE INDEX CONCURRENTLY is preferable (run each
-- statement separately without the IF NOT EXISTS shortcut).
-- ===========================================================================

-- Product: hot list queries (home sections + category page sorts)
CREATE INDEX IF NOT EXISTS "Product_isActive_orderCount_idx"
  ON "Product" ("isActive", "orderCount");

CREATE INDEX IF NOT EXISTS "Product_isActive_priceBdt_idx"
  ON "Product" ("isActive", "priceBdt");

CREATE INDEX IF NOT EXISTS "Product_isActive_createdAt_idx"
  ON "Product" ("isActive", "createdAt");

CREATE INDEX IF NOT EXISTS "Product_isActive_slug_idx"
  ON "Product" ("isActive", "slug");

-- Category: tree traversal + sidebar/footer + path resolution
CREATE INDEX IF NOT EXISTS "Category_parentId_isActive_idx"
  ON "Category" ("parentId", "isActive");

CREATE INDEX IF NOT EXISTS "Category_showInSidebar_isActive_sortOrder_idx"
  ON "Category" ("showInSidebar", "isActive", "sortOrder");

CREATE INDEX IF NOT EXISTS "Category_slug_parentId_idx"
  ON "Category" ("slug", "parentId");

-- ProductCategory: reverse lookup "all products in category X"
CREATE INDEX IF NOT EXISTS "ProductCategory_categoryId_idx"
  ON "ProductCategory" ("categoryId");

-- Banner: home slider placement query
CREATE INDEX IF NOT EXISTS "Banner_placement_isActive_sortOrder_idx"
  ON "Banner" ("placement", "isActive", "sortOrder");

-- Testimonial: latest-approved query on home page
CREATE INDEX IF NOT EXISTS "Testimonial_approved_createdAt_idx"
  ON "Testimonial" ("approved", "createdAt");

-- ===========================================================================
-- Verification (optional — run after to confirm):
--   SELECT indexname, tablename FROM pg_indexes
--   WHERE schemaname = 'public'
--   ORDER BY tablename, indexname;
-- ===========================================================================

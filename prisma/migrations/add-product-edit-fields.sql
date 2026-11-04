-- ===========================================================================
-- BDGiftora — product edit enhancements migration
-- ===========================================================================
-- Adds 3 new optional columns to support the enhanced product edit modal:
--   1. Product.weightGrams   — weight in grams (for cakes, food, etc.)
--   2. ProductI18n.metaTitle        — per-locale SEO meta title
--   3. ProductI18n.metaDescription  — per-locale SEO meta description
--
-- Apply in Supabase SQL Editor (Dashboard → SQL Editor → New query) OR via
-- psql: `psql "$DATABASE_URL" -f prisma/migrations/add-product-edit-fields.sql`
--
-- Idempotent — uses IF NOT EXISTS so re-running is safe.
-- No data loss — all new columns are nullable / have defaults.
-- ===========================================================================

-- Product: weight in grams (nullable — null for non-weighted products)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER;

-- ProductI18n: SEO fields (nullable — fall back to name/description if null)
ALTER TABLE "ProductI18n" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "ProductI18n" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;

-- ===========================================================================
-- Verification (optional):
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name IN ('Product', 'ProductI18n')
--   AND column_name IN ('weightGrams', 'metaTitle', 'metaDescription');
-- ===========================================================================

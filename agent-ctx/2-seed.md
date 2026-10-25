# Task 2 — full-stack-developer (seed)

## Task
Generate `prisma/seed.ts` with comprehensive sample data for the UpoharBd clone (Bangladesh gift-delivery e-commerce). Idempotent. Verified with `bun run db:seed`.

## Work Log
- Read worklog.md (Task 0 bootstrap), prisma/schema.prisma, upload/PROJECT_INSTRUCTIONS.md (full).
- Confirmed schema uses SQLite; Json-typed fields are actually `String?` in this schema — store `JSON.stringify(...)`.
- Edited package.json to add `"db:seed": "bun run prisma/seed.ts"` and `"prisma": { "seed": "bun run prisma/seed.ts" }`.
- Wrote `/home/z/my-project/prisma/seed.ts` (~960 lines) with:
  - Helper functions: `slugify` (mirrors `src/lib/slug.ts`), `pad`, deterministic `rng`/`ri`/`maybe` for reproducible pseudo-random values, `imagesFor` placeholder URL cycler, `createCategory` recursive helper, `createProduct` helper.
  - Delete-in-dependency-order block (children first): OrderEvent → Payment → Delivery → OrderItem → Order → CartItem → Cart → Address → BlockedDate → DeliverySlotRule → RelatedProduct → ProductVariant → ProductImage → ProductI18n → ProductCategory → Product → CategoryI18n → Category → Testimonial → Banner → Coupon → CmsPage → Setting → Currency → Vendor → City → User.
  - Cities: Dhaka, Chittagong (free), Sylhet (free) with nameBn + sameDayCutoff '14:00'.
  - Currencies: USD, BDT, GBP, AUD, CAD, EUR with rateFromBdt and updatedAt.
  - Vendors: 10 (Coopers, Well Food, Mr. Baker, Kings, Shumis Hot Cake, Puro, Bread & Beyond, Dulce, Pizza Hut, KFC) with slugs.
  - Categories: 41 top-level from spec §5 (skipping Chittagong which is added separately as a city tree) + their children (Coopers 6, Food Court 12, Sweets 8, Her 5, Eid 6, Him 3, Kids 7, Music 6 = 53 children) + Chittagong city tree (1 top + 6 children) + Sylhet city tree (1 top + 6 children) = 108 categories. Each has EN + BN CategoryI18n (216 rows). Icons assigned per spec.
  - Products: 123 total with full i18n (EN+BN), 1-2 images each, variants for cakes (1 lb + 2 lb = 48 variants), ProductCategory links (169 total), manual RelatedProduct pairs for teddy→teddy and cake→cake (48 relations). Distribution:
    - Teddy Bear: **25** (≥22 required) ✓
    - Fresh Flower: 10
    - Coopers cakes: 12 (with sub-category links to cartoon/round/square/heart/special-art/urgent) — isCake true
    - Well Food cakes: 6 — isCake true, vendor=Well Food
    - Mr. Baker cakes: 6 — isCake true, vendor=Mr. Baker
    - Food Court: 12 (linked to parent + sub-category)
    - Chocolate/Ice Cream: 8
    - Gifts for Her: 8 (with sub-category links)
    - Gifts for Him: 6
    - Personalised Gifts: 6 — type=PERSONALISED
    - Mobile Recharge: 4 — type=DIGITAL
    - Sweets: 8 (with sub-category links)
    - Fruit baskets: 6
    - Groceries: 6
  - Product SKUs: `UB-{TLD|FLW|COP|WEL|MRB|FOD|CHC|HER|HIM|PER|MOB|SWT|FRT|GRO}-NNN` and variant suffix `-V1/-V2`.
  - Banners: HOME_MOSAIC = 7 blocks (free-list, overlapping-circles payload, fresh-flower promo, sale-items promo, personalised promo, Chittagong promo, Bengali tagline block) with payload as JSON string; HOME_TILES = 37 tiles from spec §2.2.3 with link + imageUrl `/placeholders/tiles/tile-NN.svg`.
  - Testimonials: 12 approved + 2 unapproved = 14. Names mix Bangladeshi + diaspora, countries include USA/UK/Australia/Canada/UAE/Saudi Arabia/Malaysia.
  - CMS pages: 7 slugs × 2 locales = 14 rows. Slugs: about-us, how-to-order-gift, how-to-pay-for-order, gift-delivery-how-where-and-fees, terms-and-conditions, home-about, faq. Body stored as HTML.
  - DeliverySlotRule: Dhaka 5 slots (7-10/10-1/1-4/4-7/7-9), Generic null 5 slots, Chittagong 2 slots (10-1/1-5) = 12.
  - Coupons: GIFT (PERCENT 5, min 0), SUMMER (PERCENT 10), WELCOME (PERCENT 5), BD50 (FIXED 50, min 500). All active. appliesTo stored as `JSON.stringify('ALL_PACKAGES')`.
  - Admin user: admin@example.com, role ADMIN, firstName Site, lastName Admin, passwordHash from `bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12)`.
  - Settings: 5 rows (site.brand, site.phone, site.email, site.tagline, site.legalName) — values stored as JSON strings.
- First run hit a subtle bug: `catBySlug[slug] = cat` overwrote the top-level "Teddy Bear and Soft Toys" lookup with the kids→teddy sub-category (same slug, different parent). Fixed with `if (!catBySlug[slug]) catBySlug[slug] = cat` so the top-level (created first) wins.
- Re-ran `bun run db:seed` — clean. Re-verified: teddy category now has 25 products linked, 24 cake products, 4 digital, 6 personalised, 7 mosaic + 37 tile banners, 12 approved testimonials, 5/5/5/2 slot counts, admin user role=ADMIN with bcrypt hash, GIFT coupon appliesTo='"ALL_PACKAGES"', Sylhet city tree has 6 children.
- Ran `bun run lint` — clean (no warnings, no errors).

## Stage Summary — Final Counts
| Table | Rows |
|---|---|
| cities | 3 |
| currencies | 6 |
| vendors | 10 |
| categories | 108 |
| categoryI18n | 216 |
| products | 123 (incl. 25 teddy, 24 cake, 6 personalised, 4 digital) |
| productI18n | 246 |
| productImages | 184 |
| productVariants | 48 (2 per cake) |
| productCategories | 169 |
| relatedProducts | 48 (teddy↔teddy + cake↔cake) |
| banners | 44 (7 mosaic + 37 tiles) |
| testimonials | 14 (12 approved + 2 pending) |
| cmsPages | 14 (7 slugs × EN+BN) |
| deliverySlotRules | 12 |
| coupons | 4 |
| users | 1 (admin@example.com / admin123) |
| settings | 5 |

## Notes for Downstream Agents
- Run `bun run db:seed` to (re)populate. The script is idempotent — it clears all tables first.
- Admin login: `admin@example.com` / `admin123` (override via `ADMIN_PASSWORD` env var).
- Currency cookie should default to USD; BDT rateFromBdt=1; prices stored in BDT as Decimal.
- Product slugs are unique and equal to `slugify(name)`. Category slugs use the same slugify; top-level categories' slugs are the canonical lookup keys (sub-categories with the same slug — e.g. `teddy-bear-and-soft-toys` under Gifts for Kids — do NOT shadow the top-level).
- Banner payload is a JSON-encoded STRING (not a Json field per the actual schema). Decoders must `JSON.parse(banner.payload)`.
- Setting.value is also a JSON-encoded STRING. `JSON.parse('"UpoharBd"')` returns the bare string.
- Coupon.appliesTo stored as `JSON.stringify("ALL_PACKAGES")` (i.e. `'"ALL_PACKAGES"'`).
- Placeholder image URLs referenced (not yet existing as files in `/public/placeholders/`):
  - `/placeholders/products/{teddy|flower|cake|food|sweets|dress|generic}-NN.svg`
  - `/placeholders/mosaic/{roses|flowers|sale|personalised|chittagong|teddy}.svg`
  - `/placeholders/tiles/tile-NN.svg` (1–37)
  A future SVG-asset agent should create these. Until then, image slots will 404 but the app will still render.

# Project Worklog — UpoharBd Clone (Gift Delivery E-commerce)

Reference site (structure only): https://www.upoharbd.com/
Instructions: /home/z/my-project/upload/PROJECT_INSTRUCTIONS.md

## Sandbox adaptation notes
- DB: SQLite + Prisma (not PostgreSQL). Decimal/Json/Enum all supported via Prisma on SQLite.
- No Redis → in-memory cache for rates/rate-limit.
- No real email → console.log via Mailer adapter.
- Payments → manual (bank/bKash with proof upload) + simulated online provider.
- Storage → local /public uploads via StorageProvider adapter.
- Auth → lightweight bcrypt + httpOnly cookie session (NextAuth v4 available but custom is simpler & robust here).
- i18n → cookie-based locale provider (EN default, BN available) to keep / route clean.

---
Task ID: 0
Agent: main
Task: Bootstrap — set up worklog, todos, schema, config, design tokens, lib utilities.

Work Log:
- Read PROJECT_INSTRUCTIONS.md fully.
- Visited upoharbd.com via page_reader to confirm structure.
- Decided sandbox adaptations (above).

Stage Summary:
- Plan: build foundation → dispatch subagents for seed data + SVG assets in parallel → build shell + home + catalog + cart + checkout + admin + APIs → lint → run dev → browser-verify.

---
Task ID: 3
Agent: general-purpose (svg assets)
Task: Generate placeholder SVG assets

Work Log:
- Read worklog.md for context (UpoharBd clone, sandbox adaptation notes).
- Created directories: public/placeholders/{products,mosaic,tiles}.
- Authored a single generator script at scripts/generate-placeholders.mjs (Node ESM, no deps) that emits every required SVG with proper `<?xml?>` preamble, xmlns, width/height, and viewBox.
- Defined brand palette constants (green #4a9c2e, red #d6443a, orange #f08a24, blue #2b6fb0, teal #2fa6a0, lime #9ec93f, pink #f6c6d4) and 7 pastel background tones.
- Hand-drew 42 distinct 24x24 icon glyphs (currentColor) for the sprite, covering every requested key: truck, gift, people, flower, fruit, cart, chocolate, teddy, heart, cake + 7 cake-* brand variants (coopers/wellfood/mrbaker/kings/shumis/puro/bread), food, sweets, dress, eid, him, kids, mobile, pet, wedding, hamper, baby, decor, handicraft, card, music, corporate, puja, friendship, newyear, valentine, ramadan, boishakh, father, mother, default.
- Generated A) logo.svg (120x40, 4x4 multicolor square grid + ribbon).
- Generated B) icons.svg (display:none, defs>symbol sprite, all 42 ids verified).
- Generated C) 56 product placeholders (14 types × 4 variants, 400x400, rotating pastel bgs, white scene disc, scaled icon, tiny type label).
- Generated D) mosaic/{roses,teddy,bangladesh-map,hearts}.svg with requested dimensions (300x200, 200x200, 200x240, 200x140); bangladesh-map is a stylized green blob on white with label.
- Generated E) tiles/tile-01..tile-40.svg (200x200, white bg, 1px inner border, pastel disc + icon, 12 illustration types cycled, label per tile).
- Generated F) payments.svg (600x40, 7 generic text-pill marks: VISA, MasterCard, AMEX, PayPal, bKash, Western Union, Norton Secured — no real trademark artwork).
- Generated G) blank.svg (1x1 transparent).
- Generated H) og-image.svg (1200x630, green gradient, confetti, multicolor gift grid icon, "UpoharBd" wordmark, "Gift Delivery in Bangladesh" tagline, lime accent bar, sub-line of categories).
- Validated all 105 emitted SVGs: each starts with `<?xml?>`, contains `<svg>`, and has balanced XML tags (custom stack-based check). Confirmed icons.svg contains exactly the 42 expected symbol ids with no missing/extra.
- Re-runnable: `node scripts/generate-placeholders.mjs` regenerates the full set idempotently.

Stage Summary:
- Files created under /home/z/my-project/public/placeholders/:
  - logo.svg, icons.svg, payments.svg, blank.svg, og-image.svg (5 root files)
  - products/ : 56 SVGs (14 types × 4 variants)
  - mosaic/   : 4 SVGs (roses, teddy, bangladesh-map, hearts)
  - tiles/    : 40 SVGs (tile-01..tile-40)
  - Total: 105 SVG files
- Plus generator: scripts/generate-placeholders.mjs
- All assets are neutral, generated in-house (no internet downloads), pastel/flat design, brand palette, valid standalone SVG, ready to be replaced from admin later.

---
Task ID: 2
Agent: full-stack-developer (seed)
Task: Generate prisma/seed.ts with full sample data

Work Log:
- Read worklog.md (Task 0), prisma/schema.prisma, upload/PROJECT_INSTRUCTIONS.md (sections 5 + category tree).
- Edited package.json to add `"db:seed": "bun run prisma/seed.ts"` and `"prisma": { "seed": "bun run prisma/seed.ts" }`.
- Wrote /home/z/my-project/prisma/seed.ts (~960 lines): helpers (slugify/pad/deterministic rng/imagesFor), delete-in-dependency-order clearing, then inserts for cities, currencies, vendors, full category tree (42 spec items + Chittagong + Sylhet city trees), 123 products with i18n/images/variants/ProductCategory links, manual RelatedProduct pairs, 7 HOME_MOSAIC + 37 HOME_TILES banners, 12 approved + 2 pending testimonials, 7 CMS pages × EN+BN, delivery slot rules (Dhaka 5 / Generic 5 / Chittagong 2), 4 coupons, admin user (bcrypt cost 12, ADMIN_PASSWORD env override), 5 settings (JSON-stringified values).
- First run succeeded but verification revealed the top-level "Teddy Bear and Soft Toys" lookup was shadowed by the kids→teddy sub-category (same slug, different parent). Fixed by changing `catBySlug[slug] = cat` to `if (!catBySlug[slug]) catBySlug[slug] = cat` so top-level wins. Re-ran seed; teddy category now has 25 products linked.
- Ran `bun run lint` — clean.

Stage Summary:
- Final counts (reproducible via `bun run db:seed`):
  - cities 3, currencies 6, vendors 10
  - categories 108, categoryI18n 216
  - products 123 (incl. 25 teddy, 24 cake, 6 personalised, 4 digital), productI18n 246, productImages 184, productVariants 48, productCategories 169, relatedProducts 48
  - banners 44 (7 mosaic + 37 tiles), testimonials 14 (12 approved + 2 pending)
  - cmsPages 14 (7 slugs × EN+BN), deliverySlotRules 12, coupons 4
  - users 1 (admin@example.com / admin123, role ADMIN), settings 5
- Notes for downstream: placeholder SVG image paths referenced under /public/placeholders/ (products/, mosaic/, tiles/) — a future agent should create these. Banner.payload, Setting.value, Coupon.appliesTo are JSON-encoded STRINGS (per actual schema), not Json fields — decode with JSON.parse.

---
Task ID: 1+4-11
Agent: main
Task: Build full storefront, checkout, admin, APIs; lint; browser-verify

Work Log:
- Foundation: Prisma schema (SQLite-adapted with Decimal/Json/Enum), site config, design tokens (tokens.css), lib (money/slug/auth/currency/i18n/catalog), EN/BN messages.
- Providers: LocaleProvider, CurrencyProvider (fetches /api/currency/rates), CartProvider (Zustand-like context + localStorage), useT hook.
- Layout shell: TopBar (utility links, locale toggle, cart count), Header (logo + search), Sidebar (categories + currency select, mobile slide-in drawer), Footer (payment strip, trust boxes, info box, links, legal, SEO link list), Breadcrumb, FloatingDiscount tab+modal.
- Home page: promo mosaic (4 overlapping SVG circles, pastel tiles, cursive headings), testimonials (3-col, pink gradient), 31+ category tile grid (flex-wrap centered), about section (3-col with Bangladesh map), payment strip, SEO link list.
- Catalog: catch-all category route (nested slug resolution + CMS fallback), sort/pagination, product cards (unequal heights), product detail (image+thumbs, variants, cake message, add-to-basket, related, JSON-LD), catalogue, saleitems, search.
- Cart: table view, qty select, coupon validation, totals (subtotal/discount/delivery/grand), checkout/continue-shopping buttons.
- Checkout: login step (Repeat Customer?), invoice form (personal/security/address, captcha placeholder, terms), delivery (cities from DB, date picker, time slots from API, card message, hide sender), payment (manual bank/bKash/Western Union + simulated SSLCommerz), complete page (order summary, timeline, manual payment instructions), track-order (orderNo + email).
- Auth: register/login/logout API (bcrypt + httpOnly HMAC session), account page (order history), admin role guard.
- Admin: dashboard (stats), products (toggle active), orders (status changer), categories (tree viewer), banners (viewer).
- APIs: products, search, categories, currency/rates, coupons/validate, delivery/slots, checkout/{invoice,delivery,place-order}, orders/track, testimonials, contact, newsletter/discount, auth/*, admin/orders, payments/manual/proof.

Bug fixes during verification:
- money.ts imported Decimal from @prisma/client/runtime → broke client bundle. Fixed: removed Prisma import, use structural Decimal-like type.
- Category page had leftover inline SortControl (client event handler in server component) → removed; extracted to client component.
- Delivery form hardcoded cityId 1/2/3 but seed autoincrement produced 4/5/6 → made delivery page fetch cities from DB.
- metadataBase warning → added metadataBase to layout.

Verification (Agent Browser + curl):
- Home page: 200, renders promo mosaic + testimonials + 31 tiles + about + footer. VLM confirms professional, no broken images.
- Category page (teddy): 200, 25 products, sort control works.
- Product detail: 200, add-to-basket → redirects to cart, cart shows item.
- Checkout flow (curl e2e): invoice ✓ → delivery ✓ → place-order ✓ → order UB-2026-000001 created (manual, AWAITING_PAYMENT). Server re-prices from DB (850 BDT, ignored client 1200).
- Online payment: order UB-2026-000002 created, status PAID, stock/orderCount incremented.
- Track order: returns order + items + delivery + timeline.
- Admin: login ✓, dashboard ✓, products ✓, orders ✓, status change (PROCESSING) ✓.
- Language toggle: EN↔BN works (Bengali strings render).
- Cart count in topbar updates.

Lint: 0 errors (10 warnings — unused eslint-disable directives, harmless).

Stage Summary:
- Full storefront + checkout + admin + APIs working and browser-verified.
- 123 products, 108 categories, 6 currencies, 3 cities, 14 testimonials, 44 banners, 14 CMS pages seeded.
- Ready for git remote push (user will share credentials next).

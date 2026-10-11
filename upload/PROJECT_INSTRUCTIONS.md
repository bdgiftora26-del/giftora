# PROJECT INSTRUCTIONS — Gift Delivery E-commerce (Next.js Full-Stack)

> You are a senior full-stack engineer. Build the project described below end to end.
> Read this entire file first, then work phase by phase. Do not skip acceptance checks.

---

## 0. Goal

Build a production-quality **online gift-delivery store for Bangladesh** (cakes, flowers, food, gifts; senders abroad, recipients in Bangladesh) in **Next.js (App Router) + TypeScript**, whose **look, layout and behaviour match the reference screenshots** in `/docs/reference/`:

| File | Page |
|---|---|
| `home.png` | Home page |
| `category-teddy.png` | Category listing ("Teddy Bear and Soft Toys", 22 products) |
| `product-detail.png` | Product detail ("Cream teddy wearing koti") |
| `login-step.png` | Basket → Checkout step 1: "Repeat Customer?" |
| `invoice-step.png` | Checkout step 2: "Your Invoice Information" |

Reference site (for structure only): https://www.upoharbd.com/

### Hard rules about assets and branding
- Rebuild everything **from scratch** (own HTML/CSS/React). Never hotlink or download the reference site's images, logo, banners, product photos or copy.
- Use **placeholder assets** (generated SVG / neutral stock) under `/public/placeholders/`. Every image slot must be replaceable from the admin panel.
- Brand name, tagline, logo, phone, e-mail, trade license text, social URLs, currency list, default city **must come from one config file** (`src/config/site.ts`) and DB settings, so the owner can rebrand without code changes. Default brand string: `UpoharBd` / tagline `Gift Delivery in Bangladesh`.
- Product text/prices in seed data are **fake sample data** written by you.

---

## 1. Tech stack (fixed — do not substitute without a written reason)

- **Next.js 15**, App Router, **TypeScript strict**, Server Components by default
- **Tailwind CSS** + small custom CSS for the reference look (no heavy UI kit on the storefront; shadcn/ui is allowed in `/admin` only)
- **PostgreSQL + Prisma**
- **Auth.js (NextAuth v5)** — credentials (email/password, bcrypt) + optional Google; guest checkout supported
- **Zod** for all input validation (client and server)
- **Zustand** for client cart UI state; cart is persisted server-side (see §7)
- **next-intl** — locales `en` (default) and `bn`
- **Redis (Upstash or local)** — exchange-rate cache, rate-limiting
- **Cloudinary or S3-compatible** storage via an adapter interface (`StorageProvider`)
- **Resend + React Email** (adapter interface `Mailer`)
- **Payments** via adapter interface `PaymentProvider`: `stripe`, `paypal`, `sslcommerz`, `bkash`, `manual` (bank deposit / Western Union / bKash personal with proof upload)
- **Vitest** (unit), **Playwright** (e2e), **ESLint + Prettier**, **Husky + lint-staged**
- **Docker Compose** for local Postgres + Redis + Mailpit

Environment variables go in `.env.example` (never commit secrets). Document each variable.

---

## 2. Visual specification (match the screenshots)

> Colours below are approximations read from screenshots. **Colour-pick exact values from the PNGs** and store them as CSS variables in `src/styles/tokens.css`. Do not hard-code colours in components.

### 2.1 Global shell (all pages)

**Page canvas:** light-grey body background; a centered white content column (~1000–1080 px max width) with a faint left/right shadow; below the header a subtle light-grey vertical-stripe gradient that fades into white.

**A. Top utility bar** (full width, very light grey, ~28 px tall, 11–12 px Arial, grey text, each item has a small round grey icon)
- Left group: `Home` · `View Catalog` · `How to Order` · `How to Pay` · `FAQ` · `Track Order`
- Right group: `Login` · `Register` · `Contact Us` · `বাংলা` (with a small circular Bangladesh-flag icon; toggles locale) · `Shopping Cart` (green text, shows `(n)` item count when n>0)
- When logged in: replace Login/Register with `My Account` · `Logout`.

**B. Header** (white, ~80 px, soft bottom shadow)
- Left: logo block — small multicolour square-grid gift icon + wordmark `Upohar` (dark grey) `Bd` (red/orange), thin letter-spaced tagline under it.
- Right: search form — input (placeholder `Search Gift`, 1 px green border) + solid green `search` button flush to the input. Search goes to `/search?q=`.

**C. Breadcrumb** (category/product pages): green 11–12 px links, format `Home /Category/Product` exactly like the screenshot (no spaces before slashes except after `Home`).

**D. Left sidebar** (category/product/cart/checkout pages, **not** on the home page)
- ~250 px wide, vertical list of **top-level categories**, each row: coloured 18–20 px icon + 14–15 px black label, separated by 1 px light-grey borders, row height ~40 px. Long labels wrap with indentation (see "Chittagong City - Free Gift Delivery").
- Icons are per-category (red delivery truck, green gift box, people icon, red flower, green apple, shopping cart, chocolate, red teddy, red heart-apple, purple cake icons for all cake categories, etc.). Provide an `icon` field on `Category` and ship a set of simple SVG icons.
- Active category is bold/darker.
- At the bottom: **currency select** (`US Dollars (US$)` etc.) — changing it updates prices site-wide.

**E. Footer** (identical on every page; see §2.2 sections 8–11): payment-logo strip → 3 trust boxes → Follow/Testimonial/Need-Help box → text links → legal text → (home only) 6-column SEO link list.

**F. Floating "GET DISCOUNT!"** vertical orange tab fixed to the bottom-right edge, text rotated 90°. Click opens a small modal (e-mail capture → creates a discount coupon e-mail). Dismiss state stored in a cookie for 7 days.

### 2.2 Home page (`home.png`)

1. **Promo mosaic** (top, ~4 columns × 2 rows, pale pastel tiles, tiles separated by thin white gaps). Build as **admin-editable banner blocks** (see `Banner` model, placement `HOME_MOSAIC`), but ship these defaults:
   - Row 1 col 1: "Free with every delivery" (cursive green heading; italic blue list: Five red roses / Gift wrapping / Card & Candle / Photo confirmation) + roses image.
   - Row 1 centre (wide, spans 2 cols): **four overlapping circles** — blue "7 Days / 7am to 9pm / DELIVERY TO ALL CITIES"; red "FREE / GIFT DELIVERY IN DHAKA"; light-teal "5% OFF / ALL PACKAGES / Discount Code — GIFT —"; lime-green "URGENT & SAME DAY DELIVERY AVAILABLE". Build with SVG/CSS, not a flat image, so text is editable.
   - Row 1 col 4: "Fresh flower delivery / 10% Discount code: *Summer*" + teal `View Options` button + red diagonal "Special" corner ribbon.
   - Row 2 col 1: pink hearts background "5%-10% Off / Sale Items" + `Order Now` button.
   - Row 2 centre: two teal-text tiles side by side — "Personalized gifts in Bangladesh" + `Customize your gift` teal button; "Free gift delivery in Chittagong" + `View gifts for Chittagong` teal button.
   - Row 2 col 4: Bengali tagline "উপহার পাঠান - কাছে থাকুন উপহারবিডি.কম" (Bengali font) with teddy-bear image + red `About Us` button.
2. **"What Our Customers Say About Us"** — centered 18 px heading; below it a pink-to-white gradient panel with **3 testimonial columns** (grey quote-mark glyphs, 12 px text truncated with "…", bold name, country under it). Bottom-right pink italic line: `Another {N} customers want to share their joy with you, read more...` (N = approved testimonial count). Auto-rotates through approved testimonials; links to `/testimonials`.
3. **Category tile grid** — **6 tiles per row**, each tile: white card, 1 px light border, slightly rounded, square image (~120 px) above a 12 px label; hover = soft shadow. 31 tiles by default (5 full rows of 6 + 1 centered tile on the last row — implement as flex-wrap with `justify-content:center`). Tile list/order = `Banner` placement `HOME_TILES`, seed it with: Same Day Gift Delivery, Save With Gift Packages, Gift in Chittagong, Send Fresh Flower, Fruit Baskets, Groceries Home Delivery, Treat For Loved-one, Gift & Dress For Her, Gift for Him, Customised Gifts, Photograph Cake, Gift Ideas For Kids, Chocolate & Ice Cream, Teddy Bear & Toys, Wedding & Anniversary, Pet - Plant - Hobby, Mr. Baker Cake, পিঠা delivery, Shumis Hot Cake, Well Food Cake, Cartoon Cake, Recharge Mobile Online, Coopers Cake, Pizza Home Delivery, KFC Home Delivery, Sweets, Handicrafts, Home Decor, Healthcare for All, Appliances, Newborn and Baby, Gift for Puja, Eid Gift Ideas, Pohela Boishakh Gifts, Valentines Day Gifts, Corporate Gift, Fathers Day Gift Ideas.
4. **"About Our service"** — centered heading, below it a **3-column** block: justified 11–12 px paragraphs left, a **green Bangladesh map image** in the centre (use a neutral SVG map placeholder), justified paragraphs right. Text comes from CMS (`CmsPage` slug `home-about`).
5. **Payment strip** — bordered white box, logos evenly spaced: Norton Secured, Visa, MasterCard, Amex, PayPal, local bank/gateway marks, bKash, Western Union (use generic text/SVG placeholders, not trademarked artwork; admin-replaceable).
6. **Three trust boxes** — equal-width bordered boxes, grey 20 px bold titles with icon: *Photo Confirmation* (camera), *Free Roses* (rose), *Free Cards* (card); 12 px description below.
7. **Info box** (bordered, 3 columns): **Follow Us** (5 grey circular icons: Facebook, Twitter/X, Google+/Maps, YouTube, Instagram) · **Testimonial** (single quote) · **Need Help?** (right-aligned, solid green `CONTACT US` button).
8. **Footer links** (centered, 11 px, separated by ` | `): About Us | Contact Us | How to order gift | Comments from Customers | Terms and Conditions | How to Pay For Order | Gift Delivery - How, Where and Fees
9. **Legal text** (centered, 9–10 px grey): "Trading as {legalName}. ABN: {abn}", "Copyright © {brand} {year}. All Rights Reserved.", "Gift Delivery Service Trading License in Bangladesh: …".
10. **SEO link list** (home only): all active categories (incl. city-specific ones) in **6 columns**, ~10 px grey text, alphabetical, auto-generated from DB.

### 2.3 Category page (`category-teddy.png`)

- Sidebar (§2.1-D) on the left; content column on the right.
- `<h1>` category name — green, ~20 px.
- Category description paragraph (12–13 px, black) from `CategoryI18n.description`.
- Row: left `Total {n} Products`; right `Sort By: [Default ▾]` (options: Default, Price low→high, Price high→low, Name A→Z, Most ordered, Newest). Sorting via query string `?sort=`.
- **Product grid: 4 columns**. Card = very light grey background, 1 px border, padding ~10 px, **cards have natural (unequal) heights** (float/inline-block style, top-aligned — replicate this look; do not force equal height):
  - white image box (~120 px, centered)
  - product name — green, centered, 14–15 px, max 2 lines
  - price — red, centered, 15 px, format `US $11.23` (currency code prefix per selected currency)
  - tiny green `{n} orders since {year}` (derived from order history / `Product.firstSoldYear`; hide when 0)
  - description excerpt, ~200 chars, 11 px, centered, ending with green `...Details` link
  - whole card clickable to `/product/{slug}`.
- Footer row bar: `Showing {n} products` (bordered grey bar, centered).
- Pagination: not shown on reference for 22 items → paginate at **48 per page** with simple numbered pager styled like the bar.

### 2.4 Product detail page (`product-detail.png`)

- Breadcrumb, sidebar.
- Top block, 2 columns: **left** large main image (~300 px) with thumbnails below when >1 image; **right**:
  - `<h1>` product name, green, ~22 px
  - `Price:` (bold label) → red 24 px `US $36.99`; under it small green `8 orders since 2017`
  - `Stock:` → `In Stock: 1` (or `Out of Stock`; unlimited items show `In Stock`)
  - `Product Code:` → SKU
  - `Quantity:` small select (1…min(stock, 20))
  - big solid green **`Add to Basket`** button (~170 × 40 px). If the product has variants (e.g. 1 lb/2 lb cake), render a variant select above Quantity. If `isCake`, show a `Message on cake` text input (max 40 chars). If `PERSONALISED`, show file-upload + text-instructions fields.
- **Product Information** section: 17 px heading with bottom rule; rich-text description; below it gift-icon + `Product Code: {sku}`.
- **Customers who bought this also bought…** (use a proper ellipsis `…`; the reference shows an encoding bug `â€¦` — **do not replicate it**). 4-column grid of compact cards (image, green name, red price), unequal heights allowed, driven by `RelatedProduct` (manual) falling back to co-purchase counts.
- JSON-LD `Product` schema + OpenGraph tags.

### 2.5 Cart / login step (`login-step.png`)

- Title `Repeat Customer?` (26 px, black) left; right-aligned step tracker `Basket ---> Checkout ---> Payment ---> Complete --->` (grey 12 px, current step darker). A thick (5 px) light-grey rule under the title row.
- Two columns separated by a thin vertical rule:
  - **Left**: clock icon + `Login` (20 px) + helper sentence; form: `Email:` / `Password:` inputs (right-aligned labels), red-orange `Login` button; below, green links `Forgot your password?` | `Need to register?`.
  - **Right**: paperclip icon + `I do not have an account.` + sentence + green **`Continue to Checkout »`**; gift icon + `Continue Shopping?` + sentence + orange **`Continue Shopping »`** (guest browsing).
- The page order is: **Basket page → this page (only if not logged in) → Invoice information → Delivery details → Payment → Complete**. Build the `/cart` basket page in the same visual language (table: image, name, qty select, unit price, line total, remove link; coupon-code input; subtotal/discount/total box; `Checkout »` green button; `Continue Shopping »` orange button).

### 2.6 Invoice information (`invoice-step.png`)

- Title `Your Invoice Information`, same step tracker (Checkout highlighted).
- Bold sentence: `Please note that all fields that have an asterisk (*) are required in order to continue.`
- Two-column form (labels in bold grey 12 px, red `*` for required):
  - **Your Personal Details**: Title (select), First Name*, Last Name*, Email Address*, Phone No 1*, Phone No 2.
  - **Security Details**: Choose Password*, Confirm Password* (shown for guests who register; hidden for logged-in users).
  - **Your Address**: Address* (2 lines), Area/Town*, Post/Zip Code, Country* (select), State/District/County* (select, depends on country; for Bangladesh use divisions/districts).
  - reCAPTCHA checkbox widget (use hCaptcha/Turnstile/reCAPTCHA v2 behind a `Captcha` component, env-switchable).
  - **Privacy Settings**: checkbox `I have read, agree and understood the terms & conditions` (green link to `/terms-and-conditions`).
  - Green **`Submit & Continue`** button bottom-right.
- **Next step (not in screenshots — design it consistently): Delivery details** — recipient name, phone, full address, city (Dhaka/Chittagong/Sylhet/Other), **delivery date** (date picker with blocked days) and **time slot** (`GET /api/delivery/slots`), greeting-card message, "message on cake" per cake item, optional "hide sender name" checkbox, order notes.
- Then **Payment** (list enabled providers by sender country/currency) and **Complete** (order number, summary, next steps, link to track order).

---

## 3. Typography & CSS baseline

- Body: `Arial, Helvetica, sans-serif`, 12–13 px base, line-height 1.4. Bengali: load **Noto Sans Bengali** (or Hind Siliguri) via `next/font`; apply when locale is `bn`.
- Headings on content pages are **green** (`--c-green`), black on checkout pages (as in the screenshots).
- Buttons are flat solid colours, square corners (≤2 px radius), white bold text: green (primary), orange (continue shopping), red-orange (login).
- Inputs: 1 px grey border, ~30 px height, 12 px text.
- Cursive hero headings in the promo mosaic: a handwriting webfont (e.g. *Pacifico*/*Dancing Script*) loaded locally via `next/font`.
- Fully **responsive**: the reference is desktop-fixed-width; implement desktop pixel-match ≥1024 px, and sensible tablet/mobile (sidebar becomes a slide-in drawer, product grid 4→3→2→1... min 2 on phones, tile grid 6→4→3→2).

---

## 4. Information architecture & routes

```
/                                   Home
/[...categoryPath]                  Category (nested slug path, e.g. /cake-from-coopers/round-shape-cakes)
/product/[slug]                     Product
/catalogue                          Full catalogue (all top categories with child links)
/saleitems                          Items with salePrice
/search?q=                          Search results
/personalised-gifts                 Category (type PERSONALISED)
/same-day-and-urgent-gifts          Category
/{city}-city-free-gift-delivery     City landing (chittagong, sylhet, …)
/cart                               Basket
/checkout/login                     Repeat customer?
/checkout/invoice                   Invoice information
/checkout/delivery                  Delivery details
/checkout/payment                   Payment
/checkout/complete/[orderNo]        Complete
/track-order                        Order tracking (orderNo + email) / list for logged-in users
/account, /account/orders, /account/orders/[orderNo], /account/addresses
/login, /register, /forgot-password, /reset-password
/testimonials, /testimonials/new
/contact-us
/about-us, /how-to-order-gift, /how-to-pay-for-order,
/gift-delivery-how-where-and-fees, /terms-and-conditions   (CMS pages by slug)
/admin/**                           Admin panel (role-protected)
/sitemap.xml, /robots.txt
```

- All public routes are prefixed with `/{locale}` only for non-default locale (`/bn/...`); default `en` has no prefix.
- Category catch-all must resolve nested slugs against `Category.slug` + `parentId`; unknown → `notFound()`.
- Preserve legacy query URLs with redirects in `next.config.ts`: `/index.php?_a=viewCat&catId=:id` → category by `legacyId`; keep `Category.legacyId`/`Product.legacyId` nullable fields for future migration.

---

## 5. Data model (Prisma)

Implement and migrate this schema (extend where needed; keep names):

```prisma
enum Role { CUSTOMER ADMIN MANAGER EDITOR }
enum ProductType { PHYSICAL DIGITAL PERSONALISED }
enum StockMode { UNLIMITED TRACKED }
enum OrderStatus { PENDING AWAITING_PAYMENT PAID PROCESSING OUT_FOR_DELIVERY DELIVERED CANCELLED REFUNDED }
enum PaymentStatus { PENDING AUTHORIZED PAID FAILED REFUNDED AWAITING_VERIFICATION }

model City {
  id Int @id @default(autoincrement())
  slug String @unique
  name String
  nameBn String?
  deliveryFeeBdt Decimal @db.Decimal(12,2) @default(0)
  isFreeDelivery Boolean @default(false)
  sameDayCutoff String?          // "14:00" local time
  isActive Boolean @default(true)
  sortOrder Int @default(0)
}

model Category {
  id Int @id @default(autoincrement())
  legacyId Int? @unique
  slug String
  parentId Int?
  parent Category? @relation("Tree", fields:[parentId], references:[id])
  children Category[] @relation("Tree")
  cityId Int?                      // null = all cities
  icon String?                     // icon key for sidebar
  imageUrl String?
  showInSidebar Boolean @default(true)   // top-level only
  sortOrder Int @default(0)
  isActive Boolean @default(true)
  i18n CategoryI18n[]
  products ProductCategory[]
  @@unique([parentId, slug, cityId])
}
model CategoryI18n { id Int @id @default(autoincrement()) categoryId Int locale String name String description String? seoTitle String? seoDescription String? category Category @relation(fields:[categoryId], references:[id], onDelete: Cascade) @@unique([categoryId, locale]) }

model Product {
  id Int @id @default(autoincrement())
  legacyId Int? @unique
  sku String @unique
  slug String @unique
  type ProductType @default(PHYSICAL)
  priceBdt Decimal @db.Decimal(12,2)
  salePriceBdt Decimal? @db.Decimal(12,2)
  stockMode StockMode @default(UNLIMITED)
  stockQty Int?
  isCake Boolean @default(false)
  vendorId Int?
  vendor Vendor? @relation(fields:[vendorId], references:[id])
  firstSoldYear Int?
  orderCount Int @default(0)
  isActive Boolean @default(true)
  createdAt DateTime @default(now())
  i18n ProductI18n[]
  images ProductImage[]
  categories ProductCategory[]
  variants ProductVariant[]
  related RelatedProduct[] @relation("From")
}
model ProductI18n { id Int @id @default(autoincrement()) productId Int locale String name String shortDescription String? description String? product Product @relation(fields:[productId], references:[id], onDelete: Cascade) @@unique([productId, locale]) }
model ProductImage { id Int @id @default(autoincrement()) productId Int url String alt String? sortOrder Int @default(0) product Product @relation(fields:[productId], references:[id], onDelete: Cascade) }
model ProductVariant { id Int @id @default(autoincrement()) productId Int label String sku String @unique priceBdt Decimal @db.Decimal(12,2) stockQty Int? product Product @relation(fields:[productId], references:[id], onDelete: Cascade) }
model ProductCategory { productId Int categoryId Int product Product @relation(fields:[productId], references:[id], onDelete: Cascade) category Category @relation(fields:[categoryId], references:[id], onDelete: Cascade) @@id([productId, categoryId]) }
model RelatedProduct { fromId Int toId Int from Product @relation("From", fields:[fromId], references:[id], onDelete: Cascade) @@id([fromId, toId]) }
model Vendor { id Int @id @default(autoincrement()) name String slug String @unique products Product[] }

model Currency { code String @id symbol String name String rateFromBdt Decimal @db.Decimal(18,8) updatedAt DateTime @default(now()) isActive Boolean @default(true) }

model User {
  id String @id @default(cuid())
  email String @unique
  passwordHash String?
  title String? firstName String? lastName String? phone1 String? phone2 String?
  role Role @default(CUSTOMER)
  addresses Address[]
  orders Order[]
  createdAt DateTime @default(now())
}
model Address { id Int @id @default(autoincrement()) userId String user User @relation(fields:[userId], references:[id], onDelete: Cascade) line1 String line2 String? area String postcode String? country String region String isDefault Boolean @default(false) }

model Cart { id String @id @default(cuid()) userId String? currency String @default("USD") couponCode String? updatedAt DateTime @updatedAt items CartItem[] }
model CartItem { id Int @id @default(autoincrement()) cartId String cart Cart @relation(fields:[cartId], references:[id], onDelete: Cascade) productId Int variantId Int? qty Int cakeMessage String? personalisation Json? }

model Order {
  id String @id @default(cuid())
  orderNo String @unique            // e.g. UB-2026-000123
  userId String?
  user User? @relation(fields:[userId], references:[id])
  status OrderStatus @default(PENDING)
  currency String
  exchangeRate Decimal @db.Decimal(18,8)       // frozen at order time
  subtotalBdt Decimal @db.Decimal(12,2)
  discountBdt Decimal @db.Decimal(12,2) @default(0)
  deliveryBdt Decimal @db.Decimal(12,2) @default(0)
  totalBdt Decimal @db.Decimal(12,2)
  couponId Int?
  // invoice (sender) snapshot
  invTitle String? invFirstName String invLastName String invEmail String invPhone1 String invPhone2 String?
  invAddress1 String invAddress2 String? invArea String invPostcode String? invCountry String invRegion String
  ipAddress String?
  items OrderItem[]
  delivery Delivery?
  payments Payment[]
  events OrderEvent[]
  createdAt DateTime @default(now())
}
model OrderItem { id Int @id @default(autoincrement()) orderId String order Order @relation(fields:[orderId], references:[id], onDelete: Cascade) productId Int variantId Int? nameSnapshot String skuSnapshot String unitPriceBdt Decimal @db.Decimal(12,2) qty Int cakeMessage String? personalisation Json? }
model Delivery { id Int @id @default(autoincrement()) orderId String @unique order Order @relation(fields:[orderId], references:[id], onDelete: Cascade) recipientName String recipientPhone String address String area String cityId Int city City @relation(fields:[cityId], references:[id]) deliveryDate DateTime timeSlot String cardMessage String? hideSender Boolean @default(false) notes String? photoProofUrl String? deliveredAt DateTime? }
model Payment { id Int @id @default(autoincrement()) orderId String order Order @relation(fields:[orderId], references:[id], onDelete: Cascade) provider String method String? amount Decimal @db.Decimal(12,2) currency String status PaymentStatus @default(PENDING) txnRef String? proofUrl String? raw Json? createdAt DateTime @default(now()) }
model OrderEvent { id Int @id @default(autoincrement()) orderId String order Order @relation(fields:[orderId], references:[id], onDelete: Cascade) type String note String? actorId String? createdAt DateTime @default(now()) }

model Coupon { id Int @id @default(autoincrement()) code String @unique kind String /* PERCENT | FIXED */ value Decimal @db.Decimal(12,2) minOrderBdt Decimal? @db.Decimal(12,2) appliesTo Json? /* category/product ids or "ALL_PACKAGES" */ startsAt DateTime? endsAt DateTime? usageLimit Int? usedCount Int @default(0) isActive Boolean @default(true) }
model Banner { id Int @id @default(autoincrement()) placement String /* HOME_MOSAIC | HOME_TILES | SLIDER */ title String imageUrl String? link String? payload Json? sortOrder Int @default(0) isActive Boolean @default(true) }
model Testimonial { id Int @id @default(autoincrement()) name String country String message String approved Boolean @default(false) createdAt DateTime @default(now()) }
model CmsPage { id Int @id @default(autoincrement()) slug String locale String title String body String metaTitle String? metaDescription String? @@unique([slug, locale]) }
model Setting { key String @id value Json }
model DeliverySlotRule { id Int @id @default(autoincrement()) cityId Int? label String /* "7am-10am" */ startTime String endTime String capacity Int @default(50) isActive Boolean @default(true) }
model BlockedDate { id Int @id @default(autoincrement()) date DateTime @unique reason String? cityId Int? }
```

**Money rules:** store all prices in **BDT** as `Decimal`. Convert for display with `Currency.rateFromBdt`. Round display amounts to 2 decimals. Freeze `exchangeRate` on the order; the charge to the gateway uses the order currency and frozen rate. **Never trust client-sent prices** — recompute server-side from DB at every cart/checkout/payment step.

### Seed data
`prisma/seed.ts` must create: cities (Dhaka default, Chittagong free delivery, Sylhet free delivery), currencies (BDT, USD, GBP, AUD, CAD, EUR), the full **category tree below**, ~120 fake products spread over categories (include ≥22 in *Teddy Bear and Soft Toys*), vendors (Coopers, Well Food, Mr. Baker, Kings, Shumis Hot Cake, Puro, Bread & Beyond), 12 testimonials, banners for `HOME_MOSAIC` and `HOME_TILES`, CMS pages (about-us, how-to-order-gift, how-to-pay-for-order, gift-delivery-how-where-and-fees, terms-and-conditions, home-about), delivery slot rules, an admin user (`admin@example.com`, password from env).

**Top-level category tree (sidebar order; `*` = has children):**
1. Same Day and Urgent Gifts
2. Gift Packages for BD
3. Chittagong City - Free Gift Delivery* (Gift Packages, Same Day Urgent Gift, Food Delivery, Sharee for her, Salwar kamiz, Fruit and Groceries, Fresh Flowers, Sweets and Pitha, Well food cakes, Coopers cake, Cakes from Hotcake, Cake from Kings Chittagong, Dulce Cake and Sweets, Pizza Hut home delivery, KFC Chittagong, Chocolate and Ice Cream, Gift for Kids, Teddy bear and Toys, Gift for Him, Gift for Her, Unilever Gift Hampers, Household Appliances, Gift for Newborn and Baby, Recharge Mobile Phone, Valentine Gift Packages, Ramadan and Iftar Gifts, Pohela Boishakh Gifts, Mothers Day Gift)
4. Fresh Flower and Roses
5. Fresh Fruits and Juices
6. Groceries and Bazar
7. Chocolate, Ice Cream & Cookies
8. Teddy Bear and Soft Toys
9. Medical and Healthcare
10. Cake from Well Food
11. Cake from Coopers* (Cake for Urgent order, Cartoon Shape Cakes, Round Shape Cakes, Square Shape Cakes, Heart Shape Cakes, Cakes with Special Art)
12. Cakes from Mr. Baker
13. Kings Confectionery Cakes
14. Shumis Hot Cake
15. Puro Pastry and Bakery
16. Bread and Beyond Cakes
17. Special Cake and Pastry
18. Food Court* (Biryani and Deshi Food, Kebab - Burger - Snacks, Bangladeshi Pitha, Chinese and Thai Food, Pizza Hut Deals, BFC Fast Food, KFC Meal Deals, Diabetic food items, Chocolate and Ice Cream, Paan Supari Packages, Iftar Items, Harfy)
19. Personalised Gifts
20. Misti and sweets* (Sweets Package, Rosh Sweets, Premium Sweets, Bonoful Sweets, Moron Chad Sweets, Bikrampur Mistanno Vander, Tangail Sweets, Meena Sweets)
21. Gifts and Dress for Her* (Exclusive Saree For Her, Latest Salwar Kameez, Perfume and Fashion for her, Roses Only for her, Cake with love)
22. Eid Gift Ideas* (Eid Saree, Eid Salwar Kameez, Eid Bazaar, Eid Gift Packages, Eid Panjabi, Home Decor)
23. Gifts and Dress for Him* (Panjabi and Fotua, Shirt and Pants, Perfume and Accessories)
24. Gifts and Toys for Kids* (Kids Birthday Package, Kids Learning Materials, Toys, Games and Sports gift, Chocolate, Ice Cream & Cookies, Teddy Bear and Soft Toys, Cartoon cakes)
25. Online Mobile Recharge (type DIGITAL)
26. Aquarium, Plant, Pet, Hobby Gifts
27. Wedding Gifts in Bangladesh
28. Unilever Gift Hampers
29. Newborn and baby gift
30. Home Decor and Appliance
31. Handicrafts of Bangladesh
32. Greetings Card
33. Music - Novel - Natok* (New Release Book and CD, Humayun Ahmed, Imdadul Haq Milon, Indian Writer, Muhammod Jafor Iqbal, Miscellaneous)
34. Corporate Promotional Gifts
35. Gifts for Puja and Holi
36. Friendship Day Gift
37. New Year and Christmas gift
38. Valentines Day Gift Packages
39. Ramadan and Iftar Gifts
40. Pohela Boishakh Gifts
41. Fathers Day Gifts
42. Mothers Day Gift

(Also seed a Sylhet City free-delivery tree with a handful of children.)

---

## 6. Backend architecture

Layered, framework-light:

```
src/
├─ app/                      # routes (thin: parse → call service → render)
├─ server/
│  ├─ services/              # business logic (catalog, cart, pricing, checkout, orders, delivery, coupons, payments, mail)
│  ├─ repositories/          # Prisma access only
│  ├─ providers/             # payment/, storage/, mailer/, captcha/ adapters
│  ├─ validators/            # Zod schemas shared with client
│  ├─ jobs/                  # cron handlers (exchange rates, abandoned carts, sitemap ping)
│  └─ auth.ts
├─ lib/                      # money.ts, slug.ts, i18n.ts, seo.ts, rate-limit.ts, logger.ts
├─ components/               # layout/, home/, product/, cart/, checkout/, account/, admin/, ui/
├─ config/site.ts
├─ messages/{en,bn}.json
├─ styles/{tokens.css,globals.css}
└─ tests/ (unit) + e2e/ (playwright)
```

Principles: Server Components + Server Actions for mutations where natural; **Route Handlers** for webhooks and anything called by third parties. Every mutation validates with Zod, checks auth/role, is rate-limited, and writes an `OrderEvent` when it affects orders. Use transactions for order creation, stock decrement and coupon use. Errors are typed; no leaking stack traces to the client.

### Rendering strategy
- Home, category, product, CMS: **ISR** (`revalidate` 300–600 s) + `revalidateTag` on admin edits.
- Prices depend on selected currency (cookie `currency`): render BDT base on the server and format via a small client `<Price />` that reads currency, **or** key the cache by currency — pick one and document it. Avoid layout shift.
- Cart, checkout, account, admin: dynamic, no cache.
- Search: Postgres full-text (`tsvector`) over name/description/SKU, with `pg_trgm` fallback; endpoint `/api/search?q=`.

### API surface (Route Handlers; all JSON, Zod-validated)
```
GET  /api/products?category=&sort=&page=&city=
GET  /api/products/[slug]
GET  /api/search?q=
GET  /api/categories/tree?city=
GET  /api/currency/rates
POST /api/cart                    # create/get cart (cookie cartId)
POST /api/cart/items              # add
PATCH/DELETE /api/cart/items/[id]
POST /api/coupons/validate
GET  /api/delivery/slots?date=&cityId=
POST /api/checkout/invoice        # save sender details (+ optional account creation)
POST /api/checkout/delivery
POST /api/checkout/place-order    # creates Order + Payment(PENDING), returns payment redirect/intent
POST /api/payments/[provider]/webhook      # signature-verified, idempotent
POST /api/payments/manual/proof            # upload deposit proof
GET  /api/orders/track?orderNo=&email=
POST /api/testimonials
POST /api/contact
POST /api/newsletter/discount     # GET DISCOUNT! tab
POST /api/upload                  # admin only, signed uploads
```

### Order & payment flow
1. Cart → (login/guest) → Invoice → Delivery → Payment → Complete.
2. `place-order` (single DB transaction): re-price items from DB, validate stock, apply coupon, compute delivery fee by city (Chittagong/Sylhet = free per `City.isFreeDelivery`; Dhaka included in product price per business rule — configurable), snapshot names/prices/rate, create `Order(AWAITING_PAYMENT)`, `Delivery`, `Payment(PENDING)`, `OrderEvent`.
3. Online providers: create session/intent → redirect → **webhook** marks `PAID` (idempotent by `txnRef`), decrements stock, increments `Product.orderCount`, sends confirmation mail, notifies admin.
4. Manual providers (bank deposit, Western Union, personal bKash): order stays `AWAITING_PAYMENT`; customer uploads proof or enters txn id; admin verifies in panel → `PAID`.
5. Admin moves order through `PROCESSING → OUT_FOR_DELIVERY → DELIVERED`; on `DELIVERED` admin **uploads a delivery photo** → system e-mails the sender the **Photo Confirmation** (template with photo + order summary).
6. Order number format `UB-{YYYY}-{6-digit seq}` (prefix from config).
7. Same-day/urgent: if `now > City.sameDayCutoff`, block today's date in the date picker and show a notice.

### Security & quality
- Passwords: bcrypt (cost ≥12). Sessions: httpOnly, sameSite=lax, secure in prod. CSRF-safe via Auth.js + same-site actions.
- Rate-limit login, register, coupon validate, contact, newsletter, track-order (Redis).
- Never log PII/payment payloads; store gateway raw payload only in `Payment.raw` with card data excluded.
- File uploads: type/size allow-list, virus-scan hook placeholder, random object keys.
- HTML descriptions sanitized (`sanitize-html`) before saving.
- Security headers + CSP in `next.config.ts`.
- GDPR-style data export/delete for accounts (basic).

---

## 7. Cart behaviour
- Guest cart: cookie `cartId` (httpOnly) → `Cart` row. On login, merge guest cart into user cart.
- Header cart link shows `Shopping Cart (n)` in green; update optimistically.
- Cart currency follows the selected currency; stored amounts remain BDT.
- Add-to-basket from category cards is **not** available (reference shows detail link only).

---

## 8. Internationalisation & currency
- `en` / `bn` via next-intl; all UI strings in `messages/*.json`; DB content via `*I18n` tables with fallback to `en`.
- Top-bar `বাংলা` link switches to Bengali and shows `English` when in `bn`.
- Currency selector (sidebar bottom): USD, BDT, GBP, AUD, CAD, EUR; persisted in cookie; formatted as `US $11.23`, `BDT ৳1,234`, `GBP £…`, `AUD $…`, `CAD $…`, `EUR €…` (use consistent explicit prefixes like the reference: `US $`).
- Daily cron `jobs/update-rates` fetches rates from a configurable provider (adapter), caches in Redis, writes `Currency`.

---

## 9. SEO
- `generateMetadata` on every page (title, description, canonical, OG, hreflang en/bn).
- JSON-LD: `Organization`, `WebSite` (+ SearchAction), `BreadcrumbList`, `Product` (+ `Offer`), `AggregateRating` only if real reviews exist.
- `sitemap.xml` (categories, products, CMS), `robots.txt`.
- Clean slugs; 301 redirects from legacy URLs (see §4).
- Core Web Vitals: `next/image` everywhere, explicit width/height, lazy-load below fold, font `display: swap`.

---

## 10. Admin panel (`/admin`, roles: ADMIN, MANAGER, EDITOR)

Use a clean dashboard (shadcn/ui + TanStack Table). Modules:

1. **Dashboard** — today's orders, revenue (BDT + by currency), pending deliveries, awaiting-payment list, low stock.
2. **Orders** — filter/search; detail view with timeline; change status; verify manual payment; set delivery date/slot; assign note; upload **delivery photo** (triggers e-mail); print invoice/delivery slip (PDF/print CSS); refund record.
3. **Products** — CRUD with multi-image upload + reorder, variants, categories (multi-select tree), vendor, cake flag, stock, sale price, i18n tabs (EN/BN), SEO fields, related products, **CSV import/export** (handles 1,700+ rows with validation report).
4. **Categories** — drag-and-drop tree, city assignment, icon picker, images, i18n.
5. **Banners & home layout** — manage `HOME_MOSAIC` blocks and `HOME_TILES` (order, image, link, label, active).
6. **Coupons**, **Testimonials** (approve/reject), **CMS pages**, **Delivery** (cities, fees, slot rules, blocked dates), **Currencies** (rates, enable/disable), **Settings** (brand, contact info, payment methods on/off, legal text, social links), **Users** (roles), **Audit log**.
- Every admin write calls `revalidateTag` for affected public pages.

---

## 11. Emails (React Email templates, EN + BN)
Order received · Payment received · Awaiting payment reminder · Out for delivery · **Delivered + photo confirmation** · Password reset · Welcome/Discount code · Contact-form copy to admin · New order alert to admin.

---

## 12. Testing & quality gates
- Unit (Vitest): pricing, coupon rules, currency formatting/rounding, slot availability, cutoff logic, slug/category path resolution.
- Integration: order creation transaction, webhook idempotency.
- E2E (Playwright, run on every phase end): browse home → category → product → add to basket → guest checkout → manual payment → track order; login/register; language and currency switching; admin creates product → appears on storefront.
- **Visual regression:** Playwright screenshots at 1280 px width for home, category, product, login-step, invoice-step compared against `/docs/reference/*.png` (structure/spacing/colour tolerance; document deviations). Fix until layout positions are within ~4 px of the references for shell elements.
- Lighthouse (mobile) targets: Performance ≥85, SEO ≥95, Accessibility ≥90.
- CI: lint, typecheck, unit, e2e smoke, `prisma migrate diff`.

---

## 13. Execution plan — work in this order

For each phase: implement → run all checks → commit (`feat(phaseN): …`) → write a short summary of what changed and anything deferred.

**Phase 1 — Foundation & shell**
Repo init, Docker Compose, Prisma + seed, tokens.css, i18n skeleton, top bar, header, sidebar, footer, breadcrumb, floating discount tab.
*Accept:* shell matches screenshots at 1280 px; sidebar renders from DB; EN/BN toggle works; currency selector works.

**Phase 2 — Home page**
Promo mosaic (SVG circles), testimonials block, 31-tile grid, about section, payment strip, trust boxes, info box, SEO link list. All admin-data-driven (banners, testimonials, CMS).
*Accept:* visual diff vs `home.png` within tolerance.

**Phase 3 — Catalog**
Category pages (nested slugs, sort, pagination, city filter), product page (variants, cake message, related), catalogue, sale items, search, SEO + JSON-LD, ISR.
*Accept:* `category-teddy.png` and `product-detail.png` match; Lighthouse SEO ≥95.

**Phase 4 — Cart & checkout**
Cart, coupon, login-step page, invoice page (incl. country→region dependency, captcha), delivery page with slots, order placement transaction, manual payment + one online provider (Stripe or SSLCommerz) with webhook, complete page, emails, track-order.
*Accept:* full guest and logged-in e2e flows pass; `login-step.png` and `invoice-step.png` match.

**Phase 5 — Accounts**
Register/login/reset, account area (orders, addresses), guest→user cart merge.

**Phase 6 — Admin**
All modules in §10, including delivery-photo upload → photo-confirmation e-mail.

**Phase 7 — Hardening & launch**
Remaining payment providers (PayPal, bKash), rate limiting, security headers, a11y pass, performance pass, legacy URL redirects, sitemap, README (setup, env, deploy), seed/migration scripts, backup notes.

---

## 14. Working agreements
- Ask nothing that can be reasonably decided; **record decisions** in `/docs/DECISIONS.md` (one line each: decision, reason).
- If a requirement is ambiguous, choose the simplest option consistent with the screenshots and note it.
- Keep components small and typed; no `any`; no dead code; no TODOs left without an issue note in `/docs/TODO.md`.
- Never commit secrets or real customer data. Use `.env.example`.
- Provide `README.md` with: prerequisites, `pnpm i`, `docker compose up -d`, `pnpm prisma migrate dev`, `pnpm db:seed`, `pnpm dev`, test commands, and deployment steps (Vercel + managed Postgres/Redis, or Docker on VPS).
- At the end of each phase output: (1) what was built, (2) how to verify, (3) known gaps.

## 15. Definition of Done
- All 5 reference pages visually match at 1280 px; storefront responsive down to 360 px.
- A visitor can discover a gift, add it to the basket, check out as guest or member in USD/BDT/GBP/AUD/CAD/EUR, pay (online or manual), and track the order.
- Admin can run the business day to day (products, orders, payments, delivery photo, banners, coupons) without developer help.
- Tests, lint, typecheck green; Lighthouse targets met; README complete.

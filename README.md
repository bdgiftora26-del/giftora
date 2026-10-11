# BDGiftora.com — Gift Delivery E-commerce (Next.js)

A production-quality online gift-delivery store for Bangladesh (cakes, flowers, food, gifts) built with Next.js 16, TypeScript, Tailwind CSS, and Prisma. Structurally modeled on upoharbd.com — storefront assets, branding, and product data are original/placeholder.

## Brand

- **Brand name**: BDGiftora.com
- **Tagline**: Gift Delivery in Bangladesh
- **Logo**: `/public/brand-logo.jpg` (purple circle badge with gift-box icon + wordmark)

## Features

- **Storefront**: home (promo mosaic, testimonials, 31+ category tiles, about, trust boxes, SEO links), category listing (nested slug paths, sort, pagination), product detail (variants, cake message, related products, JSON-LD), search, sale items, catalogue.
- **Cart & Checkout**: client cart (Zustand + localStorage), coupon codes, 5-step checkout (Basket → Login → Invoice → Delivery → Payment → Complete), guest + registered checkout, manual payment (bank/bKash/Western Union) + simulated online payment, order tracking.
- **Auth**: register / login / logout (bcrypt + httpOnly session cookie), account area with order history.
- **Admin panel**: dashboard (stats), product management (toggle active), order management (status changes), category tree viewer, banner viewer.
- **i18n**: EN (default) + BN toggle (cookie-based locale).
- **Multi-currency**: USD, BDT, GBP, AUD, CAD, EUR — prices stored in BDT, converted client-side.
- **Responsive**: desktop pixel-match ≥1024px, tablet/mobile slide-in sidebar, product grid 4→3→2.

## Tech Stack

- Next.js 16 (App Router) + TypeScript (strict)
- Tailwind CSS 4 + shadcn/ui (admin) + custom CSS (storefront)
- Prisma ORM + SQLite (sandbox) — schema uses Decimal/Json/Enum, portable to PostgreSQL
- bcryptjs for password hashing
- Lucide icons

### Sandbox adaptations
The original spec calls for PostgreSQL/Redis/Cloudinary/Stripe/Resend. In this sandbox:
- **DB**: SQLite (schema is portable to Postgres — change provider + `@db.Decimal` annotations).
- **Cache/rate-limit**: in-memory (swap for Redis via `getCurrencies` cache).
- **Email**: console.log via Mailer adapter interface.
- **Payments**: manual (bank/bKash/Western Union with proof) + simulated SSLCommerz (marks PAID instantly). Adapter interface ready for real gateways.
- **Storage**: local `/public` (adapter interface ready for S3/Cloudinary).
- **Auth**: lightweight bcrypt + HMAC-signed httpOnly cookie (swap for NextAuth if desired).

## Getting Started

```bash
# Install dependencies
bun install

# Set up the database
cp .env.example .env
bun run db:push      # create SQLite schema
bun run db:seed      # seed sample data (123 products, 108 categories, etc.)

# Start dev server
bun run dev          # http://localhost:3000
```

### Admin access
- URL: `/admin`
- Email: `admin@example.com`
- Password: `admin123` (override with `ADMIN_PASSWORD` env var before seeding)

## Environment Variables

See `.env.example`. Key variables:
- `DATABASE_URL` — SQLite file path (or Postgres URL in production)
- `AUTH_SECRET` — secret for session signing
- `ADMIN_PASSWORD` — admin seed password

## API Surface

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List products (category, sort, page) |
| GET | `/api/products/[slug]` | Product detail |
| GET | `/api/search?q=` | Search products |
| GET | `/api/categories` | Category tree |
| GET | `/api/currency/rates` | Currency rates |
| POST | `/api/coupons/validate` | Validate coupon |
| GET | `/api/delivery/slots` | Available time slots |
| POST | `/api/checkout/invoice` | Save sender details |
| POST | `/api/checkout/delivery` | Save delivery details |
| POST | `/api/checkout/place-order` | Create order + payment |
| GET | `/api/orders/track` | Track by orderNo + email |
| POST | `/api/testimonials` | Submit testimonial |
| POST | `/api/contact` | Contact form |
| POST | `/api/newsletter/discount` | GET DISCOUNT! tab |
| POST/GET | `/api/auth/{register,login,logout,me}` | Auth |
| PATCH | `/api/admin/orders` | Change order status (admin) |

## Project Structure

```
prisma/
  schema.prisma       # Data model (SQLite, portable to Postgres)
  seed.ts             # Comprehensive sample data
src/
  app/                # Routes (App Router)
    [...categoryPath] # Category + CMS catch-all
    product/[slug]    # Product detail
    cart, checkout/*, admin/*, account, login, register, ...
    api/              # Route handlers
  components/
    layout/           # TopBar, Header, Sidebar, Footer, Breadcrumb, FloatingDiscount
    home/             # PromoMosaic, Testimonials, CategoryTiles, AboutSection
    product/          # ProductCard, AddToBasket, SortControl
    providers.tsx     # Locale, Currency, Cart context providers
  config/site.ts      # Central brand config
  lib/                # db, money, slug, auth, currency, i18n, catalog
  messages/           # en.json, bn.json
  styles/tokens.css   # Design tokens (colors, sizing)
public/placeholders/  # Generated SVG assets (logo, icons, products, tiles)
```

## Notes

- All images are generated SVG placeholders under `/public/placeholders/` — every image slot is admin-replaceable.
- Product names, prices, and testimonials are fake sample data.
- Brand name `BDGiftora.com` / tagline `Gift Delivery in Bangladesh` come from `src/config/site.ts`.

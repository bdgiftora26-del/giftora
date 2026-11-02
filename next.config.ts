import type { NextConfig } from "next";

/**
 * Production-grade Next.js config (perf-focused).
 *
 * Key changes vs original:
 *  - `images.remotePatterns` for Supabase storage URLs so we can use
 *    `next/image` (auto webp/avif + responsive srcset) on admin-uploaded
 *    banners/products. Local `/products/*.jpg` works automatically.
 *  - `images.formats` prefers modern codecs (avif > webp > original).
 *  - `compiler.removeConsole` strips console.* in prod (smaller bundle,
 *    no leaked debug logs).
 *  - `experimental.optimizePackageImports` tree-shakes barrel imports
 *    from `lucide-react` (we import 2 icons per file but used to ship
 *    the whole icon set).
 *  - `reactStrictMode: true` (was false — bug-catching in dev).
 *  - `headers()` — long-cache TTLs for static image assets under
 *    /products/, /placeholders/, /sliders/, /uploads/, /brand-logo.jpg.
 *    Originals never change (they're content-addressed by filename), so
 *    telling browsers + CDNs to cache them for a year cuts repeat-visit
 *    revalidation to zero.
 *
 * NOTE: `typescript.ignoreBuildErrors: true` is kept for now because
 * the original codebase ships with type issues that would otherwise
 * block the build. Remove once types are clean.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  experimental: {
    // Tree-shake barrel imports from large icon/UI libraries.
    // lucide-react ships ~1500 icons; without this, importing 2 icons
    // could pull metadata for all of them. Adding Radix UI primitives
    // is a no-op (they're already per-package) but documents intent.
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow next/image to optimize assets served from Supabase Storage
    // (admin-uploaded banners + product images). Local /products/* and
    // /placeholders/* are optimized automatically (same origin).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        // Static image originals in /public — never change, cache for 1 year.
        // This is purely additive (these were getting max-age=0 by default,
        // forcing every browser to revalidate on every navigation).
        source: "/products/:id*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/placeholders/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/sliders/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/brand-logo.jpg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Optimized /_next/image output — content-addressed by ?url=&w=&q=,
        // so caching aggressively is safe. If the source image changes,
        // admins should bust by renaming the file or busting via revalidateTag.
        // (We keep must-revalidate off here so 304s aren't even needed.)
        source: "/_next/image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, s-maxage=31536000" },
        ],
      },
    ];
  },
};

export default nextConfig;

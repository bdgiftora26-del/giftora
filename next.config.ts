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
    optimizePackageImports: ["lucide-react"],
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
};

export default nextConfig;

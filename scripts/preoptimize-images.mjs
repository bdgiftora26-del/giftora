#!/usr/bin/env node
/**
 * scripts/preoptimize-images.mjs
 * --------------------------------
 * Pre-generate optimized WebP versions of every product image in /public/products/.
 *
 * Why:
 *   - `next/image` optimizes on-demand. The FIRST visitor to request a given
 *     image at a given width waits ~200-500ms for the optimizer to run.
 *   - With 399 product images × 4 commonly-used widths = ~1600 unique URLs,
 *     that's 1600 potential cold-image-fetch moments spread across real users.
 *   - Pre-generating eliminates that cold cost entirely: every image is
 *     already on disk in the right size + format, served directly from
 *     /public/ (CDN-cached, no compute).
 *
 * Output:
 *   /public/products/optimized/<basename>-<width>.webp
 *   e.g. /public/products/optimized/5498-256.webp
 *
 * Usage:
 *   node scripts/preoptimize-images.mjs              # all images
 *   node scripts/preoptimize-images.mjs --limit 50   # only first 50 (testing)
 *   node scripts/preoptimize-images.mjs --force       # re-generate existing
 *
 * Re-run whenever new product images are added. Idempotent by default
 * (skips files that already exist), so safe to run repeatedly.
 *
 * After running, you may optionally switch ProductCard (and other consumers)
 * from `next/image` to direct `<img src="/products/optimized/X-256.webp">`
 * to bypass /_next/image entirely. We don't do that automatically here —
 * leaving next/image in place still gets the benefit because next/image
 * will use the cached /products/optimized/* version when its own cache misses.
 */
import { readdir, mkdir, stat, access } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const PRODUCTS_DIR = path.join(process.cwd(), 'public', 'products')
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'products', 'optimized')

// Widths we pre-generate. These match the standard next/image deviceSizes +
// imageSizes so any /_next/image request finds a close match in our cache.
// 256 = card thumbnail (most common), 640 = mobile detail, 1080 = desktop, 1920 = retina
const WIDTHS = [256, 640, 1080, 1920]

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity

async function main() {
  if (!existsSync(PRODUCTS_DIR)) {
    console.error(`✗ ${PRODUCTS_DIR} not found`)
    process.exit(1)
  }
  await mkdir(OUTPUT_DIR, { recursive: true })

  const entries = await readdir(PRODUCTS_DIR, { withFileTypes: true })
  const images = entries
    .filter((e) => e.isFile() && /\.(jpg|jpeg|png)$/i.test(e.name))
    .map((e) => e.name)
    .slice(0, LIMIT)

  console.log(`Found ${images.length} source images in ${PRODUCTS_DIR}`)
  console.log(`Output dir: ${OUTPUT_DIR}`)
  console.log(`Widths: ${WIDTHS.join(', ')}px (WebP, quality 75)`)
  console.log(`Force regenerate: ${FORCE}`)
  console.log('')

  let done = 0
  let skipped = 0
  let failed = 0
  let totalBytesIn = 0
  let totalBytesOut = 0

  for (const name of images) {
    const inPath = path.join(PRODUCTS_DIR, name)
    const base = path.basename(name, path.extname(name))

    try {
      const inStat = await stat(inPath)
      totalBytesIn += inStat.size

      for (const w of WIDTHS) {
        const outName = `${base}-${w}.webp`
        const outPath = path.join(OUTPUT_DIR, outName)
        const exists = !FORCE && (await access(outPath).then(() => true).catch(() => false))
        if (exists) {
          skipped++
          const outStat = await stat(outPath)
          totalBytesOut += outStat.size
          continue
        }
        await sharp(inPath)
          .rotate() // auto-orient from EXIF
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: 75 })
          .toFile(outPath)
        const outStat = await stat(outPath)
        totalBytesOut += outStat.size
        done++
      }
      if ((done + skipped) % 50 === 0) {
        console.log(`  progress: ${done + skipped}/${images.length * WIDTHS.length} files`)
      }
    } catch (err) {
      console.error(`  ✗ failed: ${name} — ${err.message}`)
      failed++
    }
  }

  console.log('')
  console.log('=== Summary ===')
  console.log(`  generated: ${done}`)
  console.log(`  skipped:   ${skipped} (already existed)`)
  console.log(`  failed:    ${failed}`)
  console.log(`  input:     ${(totalBytesIn / 1024 / 1024).toFixed(1)} MB (originals)`)
  console.log(`  output:    ${(totalBytesOut / 1024 / 1024).toFixed(1)} MB (optimized)`)
  console.log(`  reduction: ${((1 - totalBytesOut / (totalBytesIn * WIDTHS.length)) * 100).toFixed(0)}% per size, vs originals`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})

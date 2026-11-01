// One-off migration: convert any base64 data-URL images stored in the DB to
// real files on disk under /public/uploads/migrated/, then update the DB rows
// to point at the file paths. This fixes the multi-megabyte /api/home-data
// response caused by banners (and potentially product images) stored as base64.
//
// Usage:  bun run scripts/migrate-base64-images.mjs
//
// Safe to re-run: rows that already point at a file path (not a data: URL) are
// skipped automatically.

import { PrismaClient } from '@prisma/client'
import { mkdir, writeFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import { config } from 'dotenv'

// Load .env so DATABASE_URL / DIRECT_URL are available to PrismaClient.
// override:true is required because the shell env may have a stale SQLite URL
// that would otherwise take precedence over the real Postgres URL in .env.
config({ override: true })

const db = new PrismaClient()
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'migrated')

function isDataUrl(s) {
  return typeof s === 'string' && s.startsWith('data:')
}

// data:image/png;base64,iVBOR...  →  { ext: 'png', buffer: <Buffer> }
function parseDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
  if (!m) return null
  const mime = m[1]
  const b64 = m[2]
  let ext = 'bin'
  if (mime.includes('png')) ext = 'png'
  else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg'
  else if (mime.includes('webp')) ext = 'webp'
  else if (mime.includes('gif')) ext = 'gif'
  else if (mime.includes('svg')) ext = 'svg'
  return { ext, buffer: Buffer.from(b64, 'base64') }
}

async function ensureDir(p) {
  await mkdir(p, { recursive: true })
}

async function fileExists(p) {
  try { await access(p); return true } catch { return false }
}

// Save a data URL to disk, return the public URL path (/uploads/migrated/<name>)
async function saveDataUrl(dataUrl, prefix, id) {
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) return null
  await ensureDir(UPLOAD_DIR)
  const fileName = `${prefix}-${id}-${Date.now()}.${parsed.ext}`
  const absPath = join(UPLOAD_DIR, fileName)
  await writeFile(absPath, parsed.buffer)
  return `/uploads/migrated/${fileName}`
}

async function migrateBanners() {
  const banners = await db.banner.findMany({ select: { id: true, title: true, imageUrl: true } })
  let migrated = 0, skipped = 0
  for (const b of banners) {
    if (!b.imageUrl || !isDataUrl(b.imageUrl)) { skipped++; continue }
    const relPath = await saveDataUrl(b.imageUrl, 'banner', b.id)
    if (!relPath) { console.warn(`  banner ${b.id}: could not parse data url`); continue }
    await db.banner.update({ where: { id: b.id }, data: { imageUrl: relPath } })
    console.log(`  banner ${b.id} (${b.title || 'untitled'}): ${b.imageUrl.length.toLocaleString()} chars → ${relPath}`)
    migrated++
  }
  console.log(`Banners: ${migrated} migrated, ${skipped} skipped`)
  return migrated
}

async function migrateProductImages() {
  const images = await db.productImage.findMany({ select: { id: true, url: true, productId: true } })
  let migrated = 0, skipped = 0
  for (const img of images) {
    if (!img.url || !isDataUrl(img.url)) { skipped++; continue }
    const relPath = await saveDataUrl(img.url, 'product', img.productId)
    if (!relPath) { console.warn(`  productImage ${img.id}: could not parse data url`); continue }
    await db.productImage.update({ where: { id: img.id }, data: { url: relPath } })
    console.log(`  productImage ${img.id} (product ${img.productId}): ${img.url.length.toLocaleString()} chars → ${relPath}`)
    migrated++
  }
  console.log(`ProductImages: ${migrated} migrated, ${skipped} skipped`)
  return migrated
}

async function main() {
  console.log('=== Base64 → file migration ===')
  console.log(`Output dir: ${UPLOAD_DIR}`)
  await ensureDir(UPLOAD_DIR)
  const b1 = await migrateBanners()
  const b2 = await migrateProductImages()
  console.log(`\nDone. Total rows migrated: ${b1 + b2}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())

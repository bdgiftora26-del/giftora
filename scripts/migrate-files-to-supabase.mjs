// One-off migration: move all file-based images (in /public/uploads/migrated/
// and /public/uploads/yyyy-mm/) to Supabase Storage, then update DB rows to
// point at the cloud URLs. This makes images work on Vercel (which has a
// read-only filesystem and doesn't deploy /public/uploads/ because it's
// gitignored).
//
// Usage:  bun run scripts/migrate-files-to-supabase.mjs
//
// Safe to re-run: rows that already point at a Supabase URL are skipped.

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'

config({ override: true })

const db = new PrismaClient()
const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'uploads'
const LOCAL_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

if (!SB_URL || !SB_KEY) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in .env')
  process.exit(1)
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' }

async function uploadToSupabase(buffer, mimeType, ext) {
  const now = new Date()
  const monthDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const { randomUUID } = await import('node:crypto')
  const fileName = `${randomUUID()}.${ext}`
  const objectPath = `${monthDir}/${fileName}`
  const uploadUrl = `${SB_URL}/storage/v1/object/${BUCKET}/${objectPath}`
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SB_KEY}`, 'Content-Type': mimeType, 'x-upsert': 'true' },
    body: buffer,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Upload failed: ${res.status} ${body}`)
  }
  return `${SB_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`
}

// Collect every file under /public/uploads/ (recursive)
async function collectFiles(dir) {
  let results = []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = join(dir, e.name)
      if (e.isDirectory()) {
        results = results.concat(await collectFiles(full))
      } else if (e.isFile()) {
        results.push(full)
      }
    }
  } catch {}
  return results
}

// Map: local-relative-path → absolute-file-path, so we can look up by DB value
async function buildFileMap() {
  const files = await collectFiles(LOCAL_UPLOAD_DIR)
  const map = new Map()
  for (const f of files) {
    const rel = '/' + f.replace(process.cwd(), '').replace(/\\/g, '/').replace(/^\/+/, '')
    // normalize: /public/uploads/migrated/banner.png → /uploads/migrated/banner.png
    const key = rel.replace(/^\/public/, '')
    map.set(key, f)
  }
  return map
}

function isLocalPath(s) {
  return typeof s === 'string' && s.startsWith('/uploads/')
}

async function migrateTable(tableName, rows, urlField, idField) {
  let migrated = 0, skipped = 0, failed = 0
  for (const row of rows) {
    const url = row[urlField]
    if (!url) { skipped++; continue }
    if (!isLocalPath(url)) { skipped++; continue }
    const localFile = fileMap.get(url)
    if (!localFile) {
      console.warn(`  ${tableName} ${row[idField]}: local file not found for ${url}`)
      failed++; continue
    }
    try {
      const buffer = await readFile(localFile)
      const ext = extname(localFile).slice(1).toLowerCase()
      const mime = MIME[extname(localFile).toLowerCase()] || 'image/jpeg'
      const publicUrl = await uploadToSupabase(buffer, mime, ext)
      await db[tableMapping[tableName]].update({ where: { [idField]: row[idField] }, data: { [urlField]: publicUrl } })
      console.log(`  ${tableName} ${row[idField]}: ${url} → ${publicUrl.substring(0, 80)}...`)
      migrated++
    } catch (e) {
      console.error(`  ${tableName} ${row[idField]}: ERROR ${e.message}`)
      failed++
    }
  }
  console.log(`${tableName}: ${migrated} migrated, ${skipped} skipped, ${failed} failed`)
  return migrated
}

const tableMapping = { Banner: 'banner', ProductImage: 'productImage' }
const fileMap = await buildFileMap()
console.log(`Found ${fileMap.size} local files in /public/uploads/`)
console.log('Sample:', Array.from(fileMap.keys()).slice(0, 5))

console.log('\n=== Migrating Banners ===')
const banners = await db.banner.findMany({ select: { id: true, imageUrl: true } })
await migrateTable('Banner', banners, 'imageUrl', 'id')

console.log('\n=== Migrating ProductImages ===')
const images = await db.productImage.findMany({ select: { id: true, url: true } })
await migrateTable('ProductImage', images, 'url', 'id')

console.log('\n=== Migration complete ===')
await db.$disconnect()

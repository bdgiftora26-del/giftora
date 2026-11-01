import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Upload image file → saves to /public/uploads → returns URL path
// Files on disk are far more efficient than base64 in DB (no huge API payloads,
// browser can cache them, and the DB stays small).
export async function POST(req: Request) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Validate file type — check both MIME type and extension
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const validExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/octet-stream']

  if (!validExts.includes(ext) && !validTypes.includes(file.type)) {
    return NextResponse.json({ error: `Only image files allowed (JPG, PNG, WebP, GIF, SVG). Got: ${file.type} / .${ext}` }, { status: 400 })
  }

  // Validate size (max 5MB for disk-stored files)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB for uploaded images)' }, { status: 400 })
  }

  // Save file to /public/uploads/yyyy-mm/uuid.ext
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const safeExt = validExts.includes(ext) ? ext : 'jpg'
  const now = new Date()
  const monthDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const fileName = `${randomUUID()}.${safeExt}`
  const relPath = `/uploads/${monthDir}/${fileName}`
  const absDir = join(process.cwd(), 'public', 'uploads', monthDir)
  const absPath = join(absDir, fileName)

  try {
    await mkdir(absDir, { recursive: true })
    await writeFile(absPath, buffer)
  } catch (e) {
    console.error('[upload] Failed to write file:', e)
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, url: relPath })
}

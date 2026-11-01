import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// In-memory store for uploaded files (persists across requests within same serverless instance)
// Falls back to /tmp on Vercel (persists within same warm instance)
const fileStore = new Map<string, { buffer: Buffer; type: string }>()

// Upload image file → saves to /tmp + in-memory → returns URL
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

  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  // Generate unique filename
  const safeExt = validExts.includes(ext) ? ext : 'jpg'
  const filename = `${randomUUID()}.${safeExt}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Store in memory (works on both local + Vercel)
  fileStore.set(filename, { buffer, type: file.type || `image/${safeExt}` })

  // Also try writing to /tmp and /public/uploads (works locally, /tmp works on Vercel)
  try {
    const tmpDir = join('/tmp', 'uploads')
    await mkdir(tmpDir, { recursive: true })
    await writeFile(join(tmpDir, filename), buffer)
  } catch {}

  try {
    const publicDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(publicDir, { recursive: true })
    await writeFile(join(publicDir, filename), buffer)
  } catch {}

  const url = `/api/admin/file/${filename}`
  return NextResponse.json({ ok: true, url })
}

// Export fileStore for use in the file serving route
export { fileStore }

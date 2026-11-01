import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { randomUUID } from 'node:crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Upload image file → converts to base64 data URL → returns URL
// This works on Vercel serverless (no filesystem writes needed)
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

  // Validate size (max 2MB — base64 increases size by ~33%)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 2MB for uploaded images)' }, { status: 400 })
  }

  // Convert to base64 data URL
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const safeExt = validExts.includes(ext) ? ext : 'jpg'
  const mimeType = safeExt === 'svg' ? 'image/svg+xml' : `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`
  const base64 = buffer.toString('base64')
  const dataUrl = `data:${mimeType};base64,${base64}`

  return NextResponse.json({ ok: true, url: dataUrl })
}

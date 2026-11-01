import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { uploadToSupabase } from '@/lib/supabase-storage'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Upload image file → Supabase Storage → returns public URL.
// Works on Vercel (read-only FS) AND localhost — images live in cloud storage,
// so they persist across deploys and are CDN-backed.
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
    return NextResponse.json({ error: 'File too large (max 5MB for uploaded images)' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const safeExt = validExts.includes(ext) ? ext : 'jpg'
  const mimeType = safeExt === 'svg' ? 'image/svg+xml' : `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`

  try {
    const publicUrl = await uploadToSupabase(buffer, mimeType, safeExt)
    return NextResponse.json({ ok: true, url: publicUrl })
  } catch (e: any) {
    console.error('[upload] Supabase upload failed:', e)
    return NextResponse.json({ error: `Upload failed: ${e.message || 'unknown'}` }, { status: 500 })
  }
}

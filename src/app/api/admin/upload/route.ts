import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export const dynamic = 'force-dynamic'

// Upload image file → saves to /public/uploads/ → returns URL
export async function POST(req: Request) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Validate file type
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only image files allowed (JPG, PNG, WebP, GIF, SVG)' }, { status: 400 })
  }

  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  // Generate unique filename
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${randomUUID()}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  const filepath = join(uploadDir, filename)

  // Ensure dir exists
  await mkdir(uploadDir, { recursive: true })

  // Write file
  const bytes = await file.arrayBuffer()
  await writeFile(filepath, Buffer.from(bytes))

  const url = `/uploads/${filename}`
  return NextResponse.json({ ok: true, url })
}

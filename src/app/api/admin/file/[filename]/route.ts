import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const dynamic = 'force-dynamic'

// Serve uploaded file — checks in-memory store first, then /tmp, then /public/uploads
export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params

  // Determine content type
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
  }
  const contentType = contentTypes[ext] || 'application/octet-stream'

  // Try /public/uploads first (local dev)
  try {
    const publicPath = join(process.cwd(), 'public', 'uploads', filename)
    const buffer = await readFile(publicPath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {}

  // Try /tmp/uploads (Vercel)
  try {
    const tmpPath = join('/tmp', 'uploads', filename)
    const buffer = await readFile(tmpPath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {}

  // Try in-memory store
  try {
    const { fileStore } = await import('../upload/route')
    const file = fileStore.get(filename)
    if (file) {
      return new NextResponse(file.buffer, {
        headers: {
          'Content-Type': file.type || contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }
  } catch {}

  return new NextResponse('File not found', { status: 404 })
}

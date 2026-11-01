import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { cacheStats, invalidateAll, invalidateTags } from '@/lib/cache'

export const dynamic = 'force-dynamic'

// GET /api/admin/cache → introspection (size, keys, ages). For a debug panel.
export async function GET() {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(cacheStats())
}

// DELETE /api/admin/cache → purge everything (body { tags?: ['home'] } to purge
// by tag; otherwise drops the whole store).
export async function DELETE(req: Request) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let tags: string[] | undefined
  try {
    const body = await req.json()
    if (Array.isArray(body?.tags)) tags = body.tags.filter((t: unknown) => typeof t === 'string')
  } catch {
    // no body or invalid JSON → purge all
  }

  const removed = tags && tags.length ? invalidateTags(...tags) : invalidateAll()
  console.log(`[cache] admin purge: removed ${removed} entries${tags ? ` (tags: ${tags.join(', ')})` : ' (all)'}`)
  return NextResponse.json({ ok: true, removed })
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// List all banners (admin)
export async function GET(req: Request) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const placement = searchParams.get('placement') || undefined

  const banners = await db.banner.findMany({
    where: placement ? { placement } : undefined,
    orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }],
  })

  return NextResponse.json({ banners })
}

// Create banner (slider slide)
export async function POST(req: Request) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { placement, title, imageUrl, link, sortOrder, isActive } = await req.json()
  if (!placement || !title) {
    return NextResponse.json({ error: 'Placement and title required' }, { status: 400 })
  }

  const banner = await db.banner.create({
    data: {
      placement,
      title,
      imageUrl: imageUrl || null,
      link: link || null,
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive !== false,
    },
  })

  return NextResponse.json({ ok: true, id: banner.id })
}

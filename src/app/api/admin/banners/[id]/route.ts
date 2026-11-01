import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { bustBanner } from '@/lib/cache-tags'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const update: any = {}
  if (body.title !== undefined) update.title = body.title
  if (body.imageUrl !== undefined) update.imageUrl = body.imageUrl
  if (body.link !== undefined) update.link = body.link
  if (body.sortOrder !== undefined) update.sortOrder = Number(body.sortOrder)
  if (body.isActive !== undefined) update.isActive = body.isActive

  await db.banner.update({ where: { id: Number(id) }, data: update })

  // Bust cache: fetch placement so we target the right slice.
  const fresh = await db.banner.findUnique({ where: { id: Number(id) }, select: { placement: true } })
  bustBanner(fresh?.placement)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  // Capture placement before delete so we can bust precisely.
  const existing = await db.banner.findUnique({ where: { id: Number(id) }, select: { placement: true } })
  await db.banner.delete({ where: { id: Number(id) } }).catch(() => {})
  bustBanner(existing?.placement)
  return NextResponse.json({ ok: true })
}

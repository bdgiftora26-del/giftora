import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { bustCategory } from '@/lib/cache-tags'

export const dynamic = 'force-dynamic'

// Update category
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name, icon, showInSidebar, sortOrder } = await req.json()

  const update: any = {}
  if (icon !== undefined) update.icon = icon || null
  if (showInSidebar !== undefined) update.showInSidebar = showInSidebar
  if (sortOrder !== undefined) update.sortOrder = Number(sortOrder)

  if (name !== undefined) {
    const existing = await db.categoryI18n.findFirst({ where: { categoryId: Number(id), locale: 'en' } })
    if (existing) {
      await db.categoryI18n.update({ where: { id: existing.id }, data: { name } })
    } else {
      await db.categoryI18n.create({ data: { categoryId: Number(id), locale: 'en', name } })
    }
  }

  await db.category.update({ where: { id: Number(id) }, data: update })

  // Bust cache: fetch slug + parent slug so we target this category + its parent.
  const fresh = await db.category.findUnique({
    where: { id: Number(id) },
    select: { slug: true, parentId: true },
  })
  let parentSlug: string | undefined
  if (fresh?.parentId) {
    const p = await db.category.findUnique({ where: { id: fresh.parentId }, select: { slug: true } })
    parentSlug = p?.slug
  }
  bustCategory(fresh?.slug, parentSlug)
  return NextResponse.json({ ok: true })
}

// Delete category
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const catId = Number(id)

  // Capture slug + parent before delete so we can bust precisely.
  const existing = await db.category.findUnique({
    where: { id: catId },
    select: { slug: true, parentId: true },
  })
  let parentSlug: string | undefined
  if (existing?.parentId) {
    const p = await db.category.findUnique({ where: { id: existing.parentId }, select: { slug: true } })
    parentSlug = p?.slug
  }

  // Check for children
  const children = await db.category.findMany({ where: { parentId: catId } })
  if (children.length > 0) {
    return NextResponse.json({ error: 'Cannot delete category with children. Delete children first.' }, { status: 400 })
  }

  // Remove product associations + i18n, then delete
  await db.productCategory.deleteMany({ where: { categoryId: catId } })
  await db.categoryI18n.deleteMany({ where: { categoryId: catId } })
  await db.category.delete({ where: { id: catId } }).catch(() => {})

  bustCategory(existing?.slug, parentSlug)
  return NextResponse.json({ ok: true })
}

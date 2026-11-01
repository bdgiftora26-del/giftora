import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { cached } from '@/lib/cache'
import { tag, TTL as CACHE_TTL, bustCategory } from '@/lib/cache-tags'

export const dynamic = 'force-dynamic'

// List all categories (admin — full tree). Cached under `admin:categories`.
export async function GET() {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await cached('admin:categories', [tag.adminCategories()], CACHE_TTL.ADMIN_CATEGORIES, loadAdminCategories)
  return NextResponse.json(payload)
}

async function loadAdminCategories() {
  const categories = await db.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true, slug: true, icon: true, showInSidebar: true, sortOrder: true, cityId: true,
      i18n: { where: { locale: 'en' }, select: { name: true, description: true } },
      children: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, slug: true, icon: true, showInSidebar: true, sortOrder: true,
          i18n: { where: { locale: 'en' }, select: { name: true } },
        },
      },
    },
  })

  return {
    categories: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.i18n[0]?.name || c.slug,
      description: c.i18n[0]?.description || '',
      icon: c.icon,
      showInSidebar: c.showInSidebar,
      sortOrder: c.sortOrder,
      children: c.children.map((ch) => ({
        id: ch.id,
        slug: ch.slug,
        name: ch.i18n[0]?.name || ch.slug,
        icon: ch.icon,
        showInSidebar: ch.showInSidebar,
        sortOrder: ch.sortOrder,
      })),
    })),
  }
}

// Create new category
export async function POST(req: Request) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, parentId, icon, showInSidebar } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 80)
  let uniqueSlug = slug
  let i = 1
  while (await db.category.findFirst({ where: { slug: uniqueSlug, parentId: parentId || null } })) {
    uniqueSlug = `${slug}-${i++}`
  }

  const maxOrder = await db.category.aggregate({
    where: { parentId: parentId || null },
    _max: { sortOrder: true },
  })

  const category = await db.category.create({
    data: {
      slug: uniqueSlug,
      parentId: parentId || null,
      icon: icon || null,
      showInSidebar: showInSidebar !== false,
      sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      i18n: {
        create: [
          { locale: 'en', name },
          { locale: 'bn', name },
        ],
      },
    },
  })

  // Bust cache: new category affects home sidebar, public category list, all
  // category pages (tree changed), and the admin tree.
  let parentSlug: string | undefined
  if (parentId) {
    const p = await db.category.findUnique({ where: { id: parentId }, select: { slug: true } })
    parentSlug = p?.slug
  }
  bustCategory(uniqueSlug, parentSlug)
  return NextResponse.json({ ok: true, id: category.id, slug: uniqueSlug })
}

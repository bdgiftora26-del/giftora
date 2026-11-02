import { db } from '@/lib/db'
import { getSidebarCategories, type SidebarCategory } from '@/lib/catalog'
import { TopBar } from '@/components/layout/TopBar'
import { Header } from '@/components/layout/Header'
import { MainNav } from '@/components/layout/MainNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'
import { cached } from '@/lib/cache'
import { tag, TTL } from '@/lib/cache-tags'

// NOTE: We intentionally do NOT read cookies() here (would make routes dynamic → no ISR cache).

export async function StorefrontShell({
  children,
  withSidebar = false,
  activeSlug,
}: {
  children: React.ReactNode
  withSidebar?: boolean
  activeSlug?: string
}) {
  const categories: SidebarCategory[] = withSidebar ? await getSidebarCategories('en') : []

  return (
    <div className="app-root">
      <TopBar />
      <Header />
      <MainNav />
      <div className="page-wrapper">
        <div className="page-canvas">
          {withSidebar ? (
            <div className="content-with-sidebar">
              <Sidebar categories={categories} activeSlug={activeSlug} />
              <main className="content-main">{children}</main>
            </div>
          ) : (
            <main className="content-main content-main-full">{children}</main>
          )}
        </div>
        <Footer />
      </div>
    </div>
  )
}

// Helper to resolve a category by nested slug path (top-level first, then children).
//
// Single-tree-fetch implementation: ONE query loads every active category
// (id, slug, parentId, icon, cityId, i18n) into memory, then we walk the
// requested slug path through the in-memory tree. This replaces the old
// pattern of one DB query per slug in the path — which on a 3-deep path
// + cross-region Supabase added ~3 round-trips per category page hit.
export async function resolveCategoryPath(slugs: string[], locale: string = 'en') {
  if (slugs.length === 0) return []
  const key = `catpath:${locale}:${slugs.join('/')}`
  return cached(key, [tag.category(), tag.categoryPage()], TTL.CATEGORY_LIST, async () => {
    // Fetch the entire active category tree + i18n in ONE query.
    // Use `select` only (Prisma forbids mixing `select` + `include` at the
    // same level). i18n is selected with a sub-select for the fields we need.
    const all = await db.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        parentId: true,
        cityId: true,
        icon: true,
        i18n: { select: { locale: true, name: true, description: true } },
      },
    })

    // Index by (parentId, slug) → category, for O(1) path traversal.
    // parentId null is encoded as 0 because Map keys are strict-equal.
    const byParentSlug = new Map<string, typeof all[number]>()
    for (const c of all) {
      const k = `${c.parentId ?? 0}|${c.slug}`
      byParentSlug.set(k, c)
    }

    const resolved: {
      id: number
      slug: string
      name: string
      description?: string | null
      icon?: string | null
      parentId: number | null
      cityId: number | null
    }[] = []
    let currentParent: number | null = null
    for (const slug of slugs) {
      const cat = byParentSlug.get(`${currentParent ?? 0}|${slug}`)
      if (!cat) return null
      const i18n =
        cat.i18n.find((x) => x.locale === locale) ||
        cat.i18n.find((x) => x.locale === 'en')
      resolved.push({
        id: cat.id,
        slug: cat.slug,
        name: i18n?.name || cat.slug,
        description: i18n?.description || null,
        icon: cat.icon,
        parentId: cat.parentId,
        cityId: cat.cityId,
      })
      currentParent = cat.id
    }
    return resolved
  })
}

import { db } from '@/lib/db'
import { withRetry } from '@/lib/db-resilient'
import { cached } from '@/lib/cache'
import { tag, TTL } from '@/lib/cache-tags'

export type SidebarSubcategory = {
  id: number
  slug: string
  name: string
  href: string
}

export type SidebarCategory = {
  id: number
  slug: string
  name: string
  icon?: string | null
  href: string
  isActive: boolean
  children?: SidebarSubcategory[]
}

// Top-level categories for the sidebar, in sortOrder, with i18n name (fallback en)
// and their active subcategories (one extra relation per parent — still one
// round-trip per depth, no N+1). Cached under `category` tag (15 min).
// Invalidation: bustCategory() drops it.
// Wrapped in withRetry so transient DB hiccups don't crash the whole page.
export async function getSidebarCategories(locale: string = 'en'): Promise<SidebarCategory[]> {
  const key = `sidebar:${locale}`
  return cached(key, [tag.category()], TTL.CATEGORY_LIST, async () => {
    try {
      const rows = await withRetry(() =>
        db.category.findMany({
          where: { parentId: null, showInSidebar: true, isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            i18n: true,
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              include: { i18n: true },
            },
          },
        }),
      )
      return rows.map((c) => {
        const i18n = c.i18n.find((i) => i.locale === locale) || c.i18n.find((i) => i.locale === 'en')
        return {
          id: c.id,
          slug: c.slug,
          name: i18n?.name || c.slug,
          icon: c.icon,
          href: `/${c.slug}`,
          isActive: c.isActive,
          children: c.children.map((ch) => {
            const chI18n = ch.i18n.find((i) => i.locale === locale) || ch.i18n.find((i) => i.locale === 'en')
            return {
              id: ch.id,
              slug: ch.slug,
              name: chI18n?.name || ch.slug,
              href: `/${c.slug}/${ch.slug}`,
            }
          }),
        }
      })
    } catch {
      // If sidebar can't load, return empty rather than crashing the page
      return []
    }
  })
}

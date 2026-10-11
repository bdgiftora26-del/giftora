import { db } from '@/lib/db'
import { withRetry } from '@/lib/db-resilient'

export type SidebarCategory = {
  id: number
  slug: string
  name: string
  icon?: string | null
  href: string
  isActive: boolean
}

// Top-level categories for the sidebar, in sortOrder, with i18n name (fallback en).
// Wrapped in withRetry so transient DB hiccups don't crash the whole page.
export async function getSidebarCategories(locale: string = 'en'): Promise<SidebarCategory[]> {
  try {
    const rows = await withRetry(() =>
      db.category.findMany({
        where: { parentId: null, showInSidebar: true, isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { i18n: true },
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
      }
    })
  } catch {
    // If sidebar can't load, return empty rather than crashing the page
    return []
  }
}

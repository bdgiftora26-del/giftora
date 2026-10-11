import { db } from '@/lib/db'

export type SidebarCategory = {
  id: number
  slug: string
  name: string
  icon?: string | null
  href: string
  isActive: boolean
}

// Top-level categories for the sidebar, in sortOrder, with i18n name (fallback en).
export async function getSidebarCategories(locale: string = 'en'): Promise<SidebarCategory[]> {
  const rows = await db.category.findMany({
    where: { parentId: null, showInSidebar: true, isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { i18n: true },
  })
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
}

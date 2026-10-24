import { db } from '@/lib/db'
import { getSidebarCategories, type SidebarCategory } from '@/lib/catalog'
import { TopBar } from '@/components/layout/TopBar'
import { Header } from '@/components/layout/Header'
import { MainNav } from '@/components/layout/MainNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'
import { FloatingDiscount } from '@/components/layout/FloatingDiscount'
import { FloatingChat } from '@/components/layout/FloatingChat'

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
      <FloatingDiscount />
      <FloatingChat />
    </div>
  )
}

// Helper to resolve a category by nested slug path (top-level first, then children).
export async function resolveCategoryPath(slugs: string[], locale: string = 'en') {
  let currentParent: number | null = null
  const resolved: { id: number; slug: string; name: string; description?: string | null; icon?: string | null; parentId: number | null; cityId: number | null }[] = []
  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i]
    const cat = await db.category.findFirst({
      where: { slug, parentId: currentParent ?? null, isActive: true },
      include: { i18n: true },
    })
    if (!cat) return null
    const i18n = cat.i18n.find((x) => x.locale === locale) || cat.i18n.find((x) => x.locale === 'en')
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
}

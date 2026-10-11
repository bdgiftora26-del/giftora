import { db } from '@/lib/db'
import { getSidebarCategories, type SidebarCategory } from '@/lib/catalog'
import { TopBar } from '@/components/layout/TopBar'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'
import { FloatingDiscount } from '@/components/layout/FloatingDiscount'

// NOTE: We intentionally do NOT read cookies() here. Reading cookies makes the
// route dynamic (no ISR cache), which caused 5-10s loads + cold-start crashes.
// Sidebar category names render in English; the rest of the UI (top bar, footer)
// is client-side via useT() which reads the locale cookie in the browser.

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
      <div className="page-canvas">
        <TopBar />
        <Header />
        <div className="content-column">
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

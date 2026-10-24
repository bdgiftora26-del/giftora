import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { StorefrontShell, resolveCategoryPath } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { CategoryProducts } from '@/components/product/CategoryProducts'
import type { Metadata } from 'next'

// Dynamic rendering — avoids build-time DB queries (which fail on Vercel Hobby).
// ISR cache still works via revalidate.
export const revalidate = 600
export const dynamic = 'force-dynamic'
const LOCALE = 'en'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryPath: string[] }>
}): Promise<Metadata> {
  const { categoryPath } = await params
  try {
    const resolved = await resolveCategoryPath(categoryPath, LOCALE)
    if (!resolved || resolved.length === 0) return {}
    const cat = resolved[resolved.length - 1]
    return {
      title: cat.name,
      description: cat.description || `${cat.name} — BDGiftora gift delivery in Bangladesh`,
    }
  } catch {
    return {}
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoryPath: string[] }>
}) {
  const { categoryPath } = await params

  // Resolve path (tolerant of transient DB errors)
  const resolved = await resolveCategoryPath(categoryPath, LOCALE).catch(() => null)

  // CMS fallback for single-segment slugs (about-us, how-to-order-gift, etc.)
  if ((!resolved || resolved.length === 0) && categoryPath.length === 1) {
    const slug = categoryPath[0]
    const cms = await db.cmsPage
      .findUnique({ where: { slug_locale: { slug, locale: LOCALE } } })
      .catch(() => null)
    if (cms) {
      return (
        <StorefrontShell withSidebar>
          <div style={{ padding: '12px 16px', maxWidth: 760, margin: '0 auto' }}>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: cms.title }]} />
            <h1 className="category-h1">{cms.title}</h1>
            <div
              style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--c-text)' }}
              dangerouslySetInnerHTML={{ __html: cms.body.replace(/\n/g, '<br/>') }}
            />
          </div>
        </StorefrontShell>
      )
    }
  }

  if (!resolved || resolved.length === 0) notFound()
  const leaf = resolved[resolved.length - 1]

  const crumbs = [
    { label: 'Home', href: '/' },
    ...resolved.map((c, i) => ({
      label: c.name,
      href: '/' + resolved.slice(0, i + 1).map((x) => x.slug).join('/'),
    })),
  ]

  return (
    <StorefrontShell withSidebar activeSlug={resolved[0]?.slug}>
      <Breadcrumb items={crumbs} />
      <h1 className="category-h1">{leaf.name}</h1>
      {leaf.description && <p className="category-desc">{leaf.description}</p>}
      <CategoryProducts categorySlug={leaf.slug} />
    </StorefrontShell>
  )
}

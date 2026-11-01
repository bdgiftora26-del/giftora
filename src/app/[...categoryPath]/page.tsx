import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { StorefrontShell, resolveCategoryPath } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { CategoryProductsClient } from '@/components/product/CategoryProductsClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'BDGiftora.com — Send Gifts to Bangladesh',
  description: 'Send gifts to Bangladesh. Gift Delivery in Bangladesh.',
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoryPath: string[] }>
}) {
  const { categoryPath } = await params
  const resolved = await resolveCategoryPath(categoryPath, 'en').catch(() => null)

  // CMS fallback
  if ((!resolved || resolved.length === 0) && categoryPath.length === 1) {
    const slug = categoryPath[0]
    const cms = await db.cmsPage.findUnique({ where: { slug_locale: { slug, locale: 'en' } } }).catch(() => null)
    if (cms) {
      return (
        <StorefrontShell withSidebar>
          <div style={{ padding: '12px 16px', maxWidth: 760, margin: '0 auto' }}>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: cms.title }]} />
            <h1 className="category-h1">{cms.title}</h1>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--c-text)' }} dangerouslySetInnerHTML={{ __html: cms.body.replace(/\n/g, '<br/>') }} />
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
      <CategoryProductsClient categorySlug={leaf.slug} categoryName={leaf.name} />
    </StorefrontShell>
  )
}

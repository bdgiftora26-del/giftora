import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { ProductGridClient } from '@/components/product/ProductGridClient'

export const dynamic = 'force-dynamic'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q || ''
  return (
    <StorefrontShell withSidebar>
      <div style={{ padding: '12px 16px' }}>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Search' }]} />
        <h1 className="category-h1">Search Results</h1>
        <p className="category-desc">
          {query ? <>Results for &ldquo;<strong>{query}</strong>&rdquo;</> : 'Enter a search term above.'}
        </p>
        {query ? (
          <ProductGridClient url={`/api/search?q=${encodeURIComponent(query)}`} />
        ) : (
          <p className="muted">Use the search box in the header to find gifts.</p>
        )}
      </div>
    </StorefrontShell>
  )
}

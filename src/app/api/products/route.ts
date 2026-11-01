import { NextResponse } from 'next/server'
import { getCategoryProducts } from '@/lib/category-products'

export const dynamic = 'force-dynamic'

// Public product list (used by category pages via CategoryProductsClient, and
// available as an API for any client refresh). The homepage and category pages
// now load products SERVER-SIDE directly via getCategoryProducts(), so this
// route is mainly for programmatic access. Both share the same cache.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || 'default'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const perPage = 48

  const payload = await getCategoryProducts({ category, sort, page, perPage })
  return NextResponse.json(payload)
}

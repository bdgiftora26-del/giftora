import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toNumber } from '@/lib/money'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (!q) return NextResponse.json({ products: [], total: 0 })

  // Simple LIKE search over EN i18n name + SKU + slug
  const products = await db.product.findMany({
    where: {
      isActive: true,
      OR: [
        { sku: { contains: q } },
        { slug: { contains: q } },
        { i18n: { some: { name: { contains: q } } } },
        { i18n: { some: { shortDescription: { contains: q } } } },
      ],
    },
    include: {
      i18n: { where: { locale: 'en' } },
      images: { take: 1, orderBy: { sortOrder: 'asc' } },
    },
    take: 48,
  })

  return NextResponse.json({
    total: products.length,
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.i18n[0]?.name || p.slug,
      priceBdt: toNumber(p.priceBdt),
      salePriceBdt: p.salePriceBdt ? toNumber(p.salePriceBdt) : null,
      image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
      orderCount: p.orderCount,
      firstSoldYear: p.firstSoldYear,
      shortDescription: p.i18n[0]?.shortDescription,
    })),
  })
}

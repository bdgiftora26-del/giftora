import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// List all products (admin)
export async function GET() {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const products = await db.product.findMany({
    include: {
      i18n: { where: { locale: 'en' } },
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      categories: { include: { category: { include: { i18n: { where: { locale: 'en' } } } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      name: p.i18n[0]?.name || p.slug,
      priceBdt: Number(p.priceBdt),
      salePriceBdt: p.salePriceBdt ? Number(p.salePriceBdt) : null,
      isActive: p.isActive,
      isCake: p.isCake,
      stockMode: p.stockMode,
      stockQty: p.stockQty,
      image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
      categories: p.categories.map((c) => c.category.i18n[0]?.name || c.category.slug),
    })),
  })
}

// Create new product
export async function POST(req: Request) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, priceBdt, salePriceBdt, description, imageUrl, categorySlug, isCake, isActive } = body

  if (!name || !priceBdt) {
    return NextResponse.json({ error: 'Name and price required' }, { status: 400 })
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 80)
  // Ensure unique slug
  let uniqueSlug = slug
  let i = 1
  while (await db.product.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${i++}`
  }
  const sku = 'BG-' + Date.now().toString().slice(-8)

  let categoryId: number | undefined
  if (categorySlug) {
    const cat = await db.category.findFirst({ where: { slug: categorySlug } })
    if (cat) categoryId = cat.id
  }

  const product = await db.product.create({
    data: {
      sku,
      slug: uniqueSlug,
      priceBdt: Number(priceBdt),
      salePriceBdt: salePriceBdt ? Number(salePriceBdt) : null,
      isCake: !!isCake,
      isActive: isActive !== false,
      i18n: {
        create: [
          { locale: 'en', name, description: description || '', shortDescription: (description || '').slice(0, 150) },
          { locale: 'bn', name, description: description || '' },
        ],
      },
      images: imageUrl ? { create: { url: imageUrl, alt: name } } : undefined,
      categories: categoryId ? { create: { categoryId } } : undefined,
    },
  })

  return NextResponse.json({ ok: true, id: product.id, slug: uniqueSlug })
}

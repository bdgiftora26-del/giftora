import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { cached, cacheKey } from '@/lib/cache'
import { tag, TTL as CACHE_TTL, bustProduct } from '@/lib/cache-tags'

export const dynamic = 'force-dynamic'

// List products with server-side pagination (cached per page+query).
export async function GET(req: Request) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const q = searchParams.get('q') || ''

  const key = cacheKey('admin:products', { page, q })
  const payload = await cached(key, [tag.adminProducts()], CACHE_TTL.ADMIN_PRODUCTS, () =>
    loadAdminProducts(page, q),
  )
  return NextResponse.json(payload)
}

async function loadAdminProducts(page: number, q: string) {
  const PER_PAGE = 15
  // Build where clause for search
  const where = q
    ? {
        isActive: true,
        OR: [
          { sku: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { i18n: { some: { name: { contains: q, mode: 'insensitive' } } } },
        ],
      }
    : { isActive: true }

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      select: {
        id: true, sku: true, slug: true, priceBdt: true, salePriceBdt: true,
        isActive: true, isCake: true,
        i18n: { where: { locale: 'en' }, select: { name: true } },
        images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ])

  return {
    products: products.map((p) => ({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      name: p.i18n[0]?.name || p.slug,
      priceBdt: Number(p.priceBdt),
      salePriceBdt: p.salePriceBdt ? Number(p.salePriceBdt) : null,
      isActive: p.isActive,
      isCake: p.isCake,
      image: p.images[0]?.url || '/placeholders/products/generic-01.svg',
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PER_PAGE)),
  }
}

// Create new product
export async function POST(req: Request) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    name, slug: bodySlug, priceBdt, salePriceBdt, description, imageUrl,
    categorySlug, isCake, isActive, features,
    stockQty, weightGrams, metaTitle, metaDescription,
  } = body

  if (!name || !priceBdt) {
    return NextResponse.json({ error: 'Name and price required' }, { status: 400 })
  }

  const featuresStr = Array.isArray(features) ? features.filter(Boolean).join('|') : ''

  // Use the admin-provided slug if present, otherwise auto-generate from name.
  const rawSlug = (bodySlug || name).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
  let uniqueSlug = rawSlug
  let i = 1
  while (await db.product.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${rawSlug}-${i++}`
  }
  const sku = 'BG-' + Date.now().toString().slice(-8)

  let categoryId: number | undefined
  if (categorySlug) {
    const cat = await db.category.findFirst({ where: { slug: categorySlug } })
    if (cat) categoryId = cat.id
  }

  // Build the product record. stockQty + weightGrams are nullable.
  const productData: any = {
    sku,
    slug: uniqueSlug,
    priceBdt: Number(priceBdt),
    salePriceBdt: salePriceBdt ? Number(salePriceBdt) : null,
    isCake: !!isCake,
    isActive: isActive !== false,
  }
  // Only set stockMode/stockQty if a stock value was provided. Otherwise
  // default UNLIMITED (no stock tracking) — matches the original behavior.
  if (stockQty != null && stockQty !== '') {
    productData.stockMode = 'TRACKED'
    productData.stockQty = Number(stockQty)
  }
  if (weightGrams != null && weightGrams !== '') {
    productData.weightGrams = Number(weightGrams)
  }

  // Build the i18n records with the new SEO fields.
  const i18nData = [
    {
      locale: 'en',
      name,
      description: description || '',
      shortDescription: featuresStr,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
    },
    {
      locale: 'bn',
      name,
      description: description || '',
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
    },
  ]

  const product = await db.product.create({
    data: {
      ...productData,
      i18n: { create: i18nData },
      images: imageUrl ? { create: { url: imageUrl, alt: name } } : undefined,
      categories: categoryId ? { create: { categoryId } } : undefined,
    },
  })

  // Bust cache: new product affects home, public lists, admin lists, dashboard.
  bustProduct(uniqueSlug, categorySlug ? [categorySlug] : [])
  return NextResponse.json({ ok: true, id: product.id, slug: uniqueSlug })
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { bustProduct } from '@/lib/cache-tags'

export const dynamic = 'force-dynamic'

// Get single product (for edit form)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const p = await db.product.findUnique({
    where: { id: Number(id) },
    select: {
      id: true, sku: true, slug: true, priceBdt: true, salePriceBdt: true,
      isActive: true, isCake: true, stockMode: true, stockQty: true,
      i18n: { where: { locale: 'en' }, select: { name: true, description: true, shortDescription: true } },
      images: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, alt: true } },
      categories: { include: { category: { select: { id: true, slug: true, i18n: { where: { locale: 'en' }, select: { name: true } } } } } },
    },
  })
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    product: {
      ...p,
      priceBdt: Number(p.priceBdt),
      salePriceBdt: p.salePriceBdt ? Number(p.salePriceBdt) : null,
      name: p.i18n[0]?.name || '',
      description: p.i18n[0]?.description || '',
      shortDescription: p.i18n[0]?.shortDescription || '',
      imageUrl: p.images[0]?.url || '',
      categories: p.categories.map((c) => ({ id: c.category.id, slug: c.category.slug, name: c.category.i18n[0]?.name || c.category.slug })),
    },
  })
}

// Update product (full edit)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, priceBdt, salePriceBdt, description, imageUrl, isActive, isCake, features, categorySlug } = body

  const update: any = {}
  if (priceBdt !== undefined) update.priceBdt = Number(priceBdt)
  if (salePriceBdt !== undefined) update.salePriceBdt = salePriceBdt ? Number(salePriceBdt) : null
  if (isActive !== undefined) update.isActive = isActive
  if (isCake !== undefined) update.isCake = isCake

  // Update i18n (name, description, features → shortDescription as pipe-separated)
  if (name !== undefined || description !== undefined || features !== undefined) {
    const existing = await db.productI18n.findFirst({ where: { productId: Number(id), locale: 'en' } })
    if (existing) {
      await db.productI18n.update({
        where: { id: existing.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(features !== undefined ? { shortDescription: Array.isArray(features) ? features.filter(Boolean).join('|') : '' } : {}),
        },
      })
    }
  }

  await db.product.update({ where: { id: Number(id) }, data: update })

  // Update category association
  if (categorySlug !== undefined) {
    // Remove old associations
    await db.productCategory.deleteMany({ where: { productId: Number(id) } })
    // Add new
    if (categorySlug) {
      const cat = await db.category.findFirst({ where: { slug: categorySlug } })
      if (cat) {
        await db.productCategory.create({ data: { productId: Number(id), categoryId: cat.id } })
      }
    }
  }

  // Update image
  if (imageUrl !== undefined) {
    const existingImg = await db.productImage.findFirst({ where: { productId: Number(id) } })
    if (existingImg) {
      if (imageUrl) {
        await db.productImage.update({ where: { id: existingImg.id }, data: { url: imageUrl, alt: name || undefined } })
      } else {
        await db.productImage.delete({ where: { id: existingImg.id } })
      }
    } else if (imageUrl) {
      await db.productImage.create({ data: { productId: Number(id), url: imageUrl, alt: name || undefined } })
    }
  }

  // Bust cache: gather the product's slug + its category slugs so only the
  // affected slices drop (home page, this product's detail, its category pages,
  // admin product list, dashboard).
  const fresh = await db.product.findUnique({
    where: { id: Number(id) },
    select: { slug: true, categories: { include: { category: { select: { slug: true } } } } },
  })
  const slug = fresh?.slug
  const catSlugs = (fresh?.categories || []).map((c) => c.category.slug)
  bustProduct(slug, catSlugs)
  return NextResponse.json({ ok: true })
}

// Delete product
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  // Capture slug + category slugs before delete so we can bust precisely.
  const existing = await db.product.findUnique({
    where: { id: Number(id) },
    select: { slug: true, categories: { include: { category: { select: { slug: true } } } } },
  })
  await db.product.delete({ where: { id: Number(id) } }).catch(() => {})
  if (existing) {
    bustProduct(existing.slug, existing.categories.map((c) => c.category.slug))
  }
  return NextResponse.json({ ok: true })
}

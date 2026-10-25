import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// Update product
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, priceBdt, salePriceBdt, description, imageUrl, isActive, isCake } = body

  const update: any = {}
  if (name !== undefined) {
    update.i18n = { updateMany: { where: { locale: 'en' }, data: { name } } }
  }
  if (description !== undefined) {
    update.i18n = { ...(update.i18n || {}), updateMany: { where: { locale: 'en' }, data: { name: name || undefined, description, shortDescription: description.slice(0, 150) } } }
  }
  if (priceBdt !== undefined) update.priceBdt = Number(priceBdt)
  if (salePriceBdt !== undefined) update.salePriceBdt = salePriceBdt ? Number(salePriceBdt) : null
  if (isActive !== undefined) update.isActive = isActive
  if (isCake !== undefined) update.isCake = isCake

  await db.product.update({ where: { id: Number(id) }, data: update })

  // Update image if provided
  if (imageUrl) {
    const existing = await db.productImage.findFirst({ where: { productId: Number(id) } })
    if (existing) {
      await db.productImage.update({ where: { id: existing.id }, data: { url: imageUrl } })
    } else {
      await db.productImage.create({ data: { productId: Number(id), url: imageUrl } })
    }
  }

  return NextResponse.json({ ok: true })
}

// Delete product
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.product.delete({ where: { id: Number(id) } }).catch(() => {})
  return NextResponse.json({ ok: true })
}

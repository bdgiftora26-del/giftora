import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { toNumber } from '@/lib/money'

export const dynamic = 'force-dynamic'

// Get full order details (admin only) — for inline modal view
export async function GET(_req: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderNo } = await params
  const order = await db.order.findUnique({
    where: { orderNo },
    include: {
      items: true,
      delivery: { include: { city: true } },
      payments: true,
    },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    order: {
      orderNo: order.orderNo,
      status: order.status,
      currency: order.currency,
      subtotalBdt: toNumber(order.subtotalBdt),
      discountBdt: toNumber(order.discountBdt),
      deliveryBdt: toNumber(order.deliveryBdt),
      totalBdt: toNumber(order.totalBdt),
      createdAt: order.createdAt,
      invFirstName: order.invFirstName,
      invLastName: order.invLastName,
      invEmail: order.invEmail,
      invPhone1: order.invPhone1,
      invPhone2: order.invPhone2,
      invAddress1: order.invAddress1,
      invAddress2: order.invAddress2,
      invArea: order.invArea,
      invPostcode: order.invPostcode,
      invCountry: order.invCountry,
      invRegion: order.invRegion,
      delivery: order.delivery ? {
        recipientName: order.delivery.recipientName,
        recipientPhone: order.delivery.recipientPhone,
        address: order.delivery.address,
        area: order.delivery.area,
        deliveryDate: order.delivery.deliveryDate,
        timeSlot: order.delivery.timeSlot,
        cardMessage: order.delivery.cardMessage,
        hideSender: order.delivery.hideSender,
        notes: order.delivery.notes,
        city: { name: order.delivery.city.name },
      } : null,
      items: order.items.map((it) => ({
        nameSnapshot: it.nameSnapshot,
        skuSnapshot: it.skuSnapshot,
        unitPriceBdt: toNumber(it.unitPriceBdt),
        qty: it.qty,
        cakeMessage: it.cakeMessage,
      })),
      payments: order.payments.map((p) => ({
        provider: p.provider,
        amount: toNumber(p.amount),
        status: p.status,
        txnRef: p.txnRef,
      })),
    },
  })
}

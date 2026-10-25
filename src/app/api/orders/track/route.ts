import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toNumber } from '@/lib/money'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orderNo = searchParams.get('orderNo')
  const email = searchParams.get('email')

  if (!orderNo || !email) {
    return NextResponse.json({ error: 'Order number and email required' }, { status: 400 })
  }

  const order = await db.order.findUnique({
    where: { orderNo },
    include: {
      items: true,
      delivery: { include: { city: true } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!order || order.invEmail.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({
    order: {
      orderNo: order.orderNo,
      status: order.status,
      currency: order.currency,
      totalBdt: toNumber(order.totalBdt),
      createdAt: order.createdAt,
      items: order.items.map((it) => ({
        nameSnapshot: it.nameSnapshot,
        qty: it.qty,
        unitPriceBdt: toNumber(it.unitPriceBdt),
      })),
      delivery: order.delivery
        ? {
            recipientName: order.delivery.recipientName,
            city: { name: order.delivery.city.name },
            deliveryDate: order.delivery.deliveryDate,
            timeSlot: order.delivery.timeSlot,
          }
        : null,
      events: order.events.map((ev) => ({
        type: ev.type,
        note: ev.note,
        createdAt: ev.createdAt,
      })),
    },
  })
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId, status } = await req.json().catch(() => ({}))
  if (!orderId || !status) {
    return NextResponse.json({ error: 'orderId and status required' }, { status: 400 })
  }

  const valid = ['PENDING', 'AWAITING_PAYMENT', 'PAID', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED']
  if (!valid.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const order = await db.order.update({
    where: { id: String(orderId) },
    data: { status },
  })

  await db.orderEvent.create({
    data: {
      orderId: order.id,
      type: 'STATUS_CHANGED',
      note: `Status changed to ${status}`,
      actorId: 'admin',
    },
  })

  // If delivered, set deliveredAt
  if (status === 'DELIVERED' && order.id) {
    await db.delivery.updateMany({
      where: { orderId: order.id },
      data: { deliveredAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true, status: order.status })
}

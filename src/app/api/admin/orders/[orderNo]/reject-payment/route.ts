import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { bustOrder } from '@/lib/cache-tags'

export const dynamic = 'force-dynamic'

// POST /api/admin/orders/[orderNo]/reject-payment
//
// Admin rejects the customer's payment (e.g. TrxID doesn't match anything
// in their bKash account, or the amount is wrong). This:
//   1. Marks the Payment.status = FAILED
//   2. Moves Order.status to CANCELLED
//   3. Adds an OrderEvent PAYMENT_REJECTED with admin note
//
// Body (optional):
//   { note?: string, reason?: string } — admin note for the customer
export async function POST(req: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderNo } = await params
  const body = await req.json().catch(() => ({}))
  const note =
    typeof body.note === 'string'
      ? body.note.slice(0, 500)
      : typeof body.reason === 'string'
        ? body.reason.slice(0, 500)
        : 'Payment rejected by admin'

  const order = await db.order.findUnique({
    where: { orderNo },
    include: { payments: true },
  })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (order.status === 'DELIVERED') {
    return NextResponse.json(
      { error: 'Cannot reject payment on a delivered order.' },
      { status: 400 },
    )
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { orderId: order.id, status: { in: ['AWAITING_VERIFICATION', 'PENDING', 'AUTHORIZED'] } },
        data: { status: 'FAILED' },
      })

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      })

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: 'PAYMENT_REJECTED',
          note,
          actorId: null,
        },
      })
    })

    bustOrder()
    return NextResponse.json({ ok: true, orderNo, newStatus: 'CANCELLED' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Reject failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

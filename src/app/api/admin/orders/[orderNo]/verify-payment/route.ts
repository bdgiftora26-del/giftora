import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { toNumber } from '@/lib/money'
import { bustOrder } from '@/lib/cache-tags'

export const dynamic = 'force-dynamic'

// POST /api/admin/orders/[orderNo]/verify-payment
//
// Admin confirms that the customer's bKash (or other manual) payment was
// received and matches the TrxID. This:
//   1. Marks the Payment.status = PAID
//   2. Marks the Order.status = PAID
//   3. Increments each product's orderCount (for "popular sort")
//   4. Adds an OrderEvent PAYMENT_RECEIVED with admin note
//
// Body (optional):
//   { note?: string } — admin note like "Matched TrxID 9X7K5P3B2N in bKash app"
export async function POST(req: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderNo } = await params
  const body = await req.json().catch(() => ({}))
  const note = typeof body.note === 'string' ? body.note.slice(0, 500) : ''

  const order = await db.order.findUnique({
    where: { orderNo },
    include: { payments: true, items: true },
  })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (order.status === 'PAID' || order.status === 'DELIVERED') {
    return NextResponse.json(
      { error: `Order is already ${order.status.replace(/_/g, ' ')} — no need to verify again.` },
      { status: 400 },
    )
  }
  if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
    return NextResponse.json(
      { error: `Order is ${order.status.replace(/_/g, ' ')} — cannot verify payment.` },
      { status: 400 },
    )
  }

  try {
    await db.$transaction(async (tx) => {
      // Mark all AWAITING_VERIFICATION payments as PAID
      await tx.payment.updateMany({
        where: { orderId: order.id, status: 'AWAITING_VERIFICATION' },
        data: { status: 'PAID' },
      })

      // Move order to PAID
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      })

      // Increment orderCount on each product (used by home "popular" sections)
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { orderCount: { increment: item.qty } },
        })
      }

      // Audit event
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: 'PAYMENT_RECEIVED',
          note: note || 'Payment verified by admin',
          actorId: null,
        },
      })
    })

    // Bust caches so the admin orders list + dashboard refresh
    bustOrder()

    return NextResponse.json({ ok: true, orderNo, newStatus: 'PAID' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Verify failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

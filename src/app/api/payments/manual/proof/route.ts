import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Upload / submit manual payment proof (deposit slip, bKash txn id, etc.)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { orderNo, txnRef, proofUrl } = body
  if (!orderNo) {
    return NextResponse.json({ error: 'orderNo required' }, { status: 400 })
  }

  const user = await getCurrentUser()
  const order = await db.order.findUnique({
    where: { orderNo: String(orderNo) },
    include: { payments: true },
  })
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Owner or admin may submit proof
  if (user?.id !== order.userId && user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Update the first pending manual payment with the proof
  const payment = order.payments.find((p) => p.provider.startsWith('manual'))
  if (!payment) {
    return NextResponse.json({ error: 'No manual payment on this order' }, { status: 400 })
  }

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'AWAITING_VERIFICATION',
      txnRef: txnRef || payment.txnRef,
      proofUrl: proofUrl || payment.proofUrl,
    },
  })

  await db.orderEvent.create({
    data: {
      orderId: order.id,
      type: 'PAYMENT_PROOF_SUBMITTED',
      note: `Proof submitted: ${txnRef || proofUrl || 'uploaded file'}`,
      actorId: user?.id || null,
    },
  })

  return NextResponse.json({ ok: true })
}

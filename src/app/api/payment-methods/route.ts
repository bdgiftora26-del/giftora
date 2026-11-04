import { NextResponse } from 'next/server'
import { getEnabledPaymentMethods } from '@/lib/payment-methods'

export const dynamic = 'force-dynamic'

// Returns the list of payment methods currently enabled for checkout.
// Public endpoint — no auth required. Called by the checkout payment step.
//
// Response shape:
//   { methods: [{ id, label, desc, type, receiver? }] }
export async function GET() {
  try {
    const methods = await getEnabledPaymentMethods()
    return NextResponse.json({ methods })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load payment methods'
    return NextResponse.json({ error: msg, methods: [] }, { status: 200 })
  }
}

import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { getAllPaymentMethodStatuses, setEnabledPaymentMethods } from '@/lib/payment-methods'

export const dynamic = 'force-dynamic'

// GET — list all payment methods with their current enabled status.
// Admin-only. Used by /admin/payment-methods page.
export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const methods = await getAllPaymentMethodStatuses()
  return NextResponse.json({ methods })
}

// PATCH — replace the enabled-methods list.
// Body: { enabled: string[] } — array of method IDs to enable.
// All other known methods will be disabled. Unknown IDs are silently dropped.
export async function PATCH(req: Request) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const enabled = body.enabled
  if (!Array.isArray(enabled)) {
    return NextResponse.json({ error: '`enabled` must be an array of method IDs' }, { status: 400 })
  }

  await setEnabledPaymentMethods(enabled as string[])
  const methods = await getAllPaymentMethodStatuses()
  return NextResponse.json({ ok: true, methods })
}

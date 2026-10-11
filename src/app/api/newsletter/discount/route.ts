import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { email } = body
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(String(email))) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  // Ensure WELCOME coupon exists (seeded); console-log the "email"
  const coupon = await db.coupon.findUnique({ where: { code: 'WELCOME' } })
  console.log('[NEWSLETTER DISCOUNT]', { email, code: coupon?.code || 'WELCOME' })
  return NextResponse.json({ ok: true, code: coupon?.code || 'WELCOME' })
}

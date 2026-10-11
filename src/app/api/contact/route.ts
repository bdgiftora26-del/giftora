import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { name, email, subject, message } = body
  if (!email || !message) {
    return NextResponse.json({ error: 'Email and message required' }, { status: 400 })
  }
  // Store as a setting / log (no email sent in sandbox — console log via Mailer adapter)
  console.log('[CONTACT FORM]', { name, email, subject, message })
  return NextResponse.json({ ok: true })
}

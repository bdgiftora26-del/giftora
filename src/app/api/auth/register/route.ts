import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { email, password, firstName, lastName, phone1 } = body
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }
  const existing = await db.user.findUnique({ where: { email: String(email).toLowerCase() } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
  }
  const passwordHash = await hashPassword(String(password))
  const user = await db.user.create({
    data: {
      email: String(email).toLowerCase(),
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
      phone1: phone1 || null,
      role: 'CUSTOMER',
    },
  })
  const { createSession } = await import('@/lib/auth')
  await createSession(user.id)
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } })
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { email, password } = body
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }
  const user = await db.user.findUnique({ where: { email: String(email).toLowerCase() } })
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
  }
  const ok = await verifyPassword(String(password), user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
  }
  await createSession(user.id)
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } })
}

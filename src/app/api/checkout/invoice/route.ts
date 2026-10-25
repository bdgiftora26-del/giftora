import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Save sender/invoice details in a cookie (and optionally create user account for guests)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const {
    invTitle, invFirstName, invLastName, invEmail, invPhone1, invPhone2,
    invAddress1, invAddress2, invArea, invPostcode, invCountry, invRegion,
    password, confirmPassword,
  } = body

  if (!invFirstName || !invLastName || !invEmail || !invPhone1 || !invAddress1 || !invArea || !invCountry || !invRegion) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  let user = await getCurrentUser()

  // Guest → create account if password provided
  if (!user && password) {
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }
    const existing = await db.user.findUnique({ where: { email: String(invEmail).toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered — please login' }, { status: 400 })
    }
    user = await db.user.create({
      data: {
        email: String(invEmail).toLowerCase(),
        passwordHash: await hashPassword(String(password)),
        title: invTitle || null,
        firstName: invFirstName,
        lastName: invLastName,
        phone1: invPhone1,
        phone2: invPhone2 || null,
        role: 'CUSTOMER',
      },
    }) as typeof user
    const { createSession } = await import('@/lib/auth')
    await createSession(user.id)
  }

  const invoice = {
    invTitle: invTitle || null,
    invFirstName,
    invLastName,
    invEmail,
    invPhone1,
    invPhone2: invPhone2 || null,
    invAddress1,
    invAddress2: invAddress2 || null,
    invArea,
    invPostcode: invPostcode || null,
    invCountry,
    invRegion,
    userId: user?.id || null,
  }

  const store = await cookies()
  store.set('ub_invoice', JSON.stringify(invoice), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/',
  })

  return NextResponse.json({ ok: true })
}

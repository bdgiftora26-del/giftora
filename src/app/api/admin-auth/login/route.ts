import { NextResponse } from 'next/server'
import { createAdminSession, verifyAdminCredentials, ADMIN_LOGIN_PATH } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// The login endpoint only works when called from the secret admin login page.
// It validates username + password against env-configured credentials.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { username, password } = body
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }
  if (!verifyAdminCredentials(String(username), String(password))) {
    // Slight delay to slow brute force
    await new Promise((r) => setTimeout(r, 400))
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  await createAdminSession()
  return NextResponse.json({ ok: true, redirect: '/admin' })
}

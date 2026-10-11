// Lightweight session auth: bcrypt password + httpOnly cookie signed with HMAC.
// Adapter-friendly so it can be swapped for NextAuth later.

import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const SESSION_COOKIE = 'ub_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const SECRET = process.env.AUTH_SECRET || 'upoharbd-dev-secret-change-me'

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12)
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash)
}

async function sign(payload: string): Promise<string> {
  const { createHmac } = await import('node:crypto')
  const mac = createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${mac}`
}

async function verify(token: string): Promise<string | null> {
  const idx = token.lastIndexOf('.')
  if (idx < 1) return null
  const payload = token.slice(0, idx)
  const mac = token.slice(idx + 1)
  const expected = await sign(payload)
  const expectedMac = expected.slice(payload.length + 1)
  if (mac !== expectedMac) return null
  return payload
}

export async function createSession(userId: string) {
  const payload = JSON.stringify({ uid: userId, iat: Date.now() })
  const token = await sign(Buffer.from(payload).toString('base64url'))
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getCurrentUser() {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    const payload = await verify(token)
    if (!payload) return null
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (!decoded?.uid) return null
    const user = await db.user.findUnique({
      where: { id: decoded.uid },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    })
    return user
  } catch {
    return null
  }
}

export async function requireUser() {
  const u = await getCurrentUser()
  if (!u) throw new Error('UNAUTHORIZED')
  return u
}

export async function requireAdmin() {
  const u = await requireUser()
  if (u.role !== 'ADMIN' && u.role !== 'MANAGER' && u.role !== 'EDITOR') {
    throw new Error('FORBIDDEN')
  }
  return u
}

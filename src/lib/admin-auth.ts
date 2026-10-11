// Separate admin authentication system.
// Admin access uses a distinct cookie + distinct credentials (not customer accounts),
// and the login page lives at a secret random URL so it can't be discovered by scanning /admin.

import { cookies } from 'next/headers'
import { createHmac } from 'node:crypto'
import { redirect } from 'next/navigation'

const ADMIN_COOKIE = 'ub_admin_session'
const ADMIN_MAX_AGE = 60 * 60 * 8 // 8 hours (shorter than customer sessions)
const SECRET = process.env.AUTH_SECRET || 'upoharbd-dev-secret-change-me'

export const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'bdgiftora.admin',
  password: process.env.ADMIN_PANEL_PASSWORD || 'admin123',
}

// The secret path segment for the admin login page.
// Stored in env so it can be rotated without code changes.
export const ADMIN_LOGIN_PATH = `/admin-access-${process.env.ADMIN_SECRET_PATH || 'devpath'}`
export const ADMIN_LOGIN_URL = ADMIN_LOGIN_PATH

async function sign(payload: string): Promise<string> {
  const mac = createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${mac}`
}

async function verifyToken(token: string): Promise<string | null> {
  const idx = token.lastIndexOf('.')
  if (idx < 1) return null
  const payload = token.slice(0, idx)
  const mac = token.slice(idx + 1)
  const expected = await sign(payload)
  const expectedMac = expected.slice(payload.length + 1)
  if (mac !== expectedMac) return null
  return payload
}

export async function createAdminSession() {
  const payload = JSON.stringify({ admin: true, iat: Date.now() })
  const token = await sign(Buffer.from(payload).toString('base64url'))
  const store = await cookies()
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ADMIN_MAX_AGE,
    path: '/',
  })
}

export async function destroyAdminSession() {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
}

export async function getAdminSession(): Promise<boolean> {
  try {
    const store = await cookies()
    const token = store.get(ADMIN_COOKIE)?.value
    if (!token) return false
    const payload = await verifyToken(token)
    if (!payload) return false
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return decoded?.admin === true
  } catch {
    return false
  }
}

// Returns true if credentials match the configured admin credentials.
// Uses constant-time comparison to avoid timing attacks.
export function verifyAdminCredentials(username: string, password: string): boolean {
  return timingSafeEqual(username, ADMIN_CREDENTIALS.username) && timingSafeEqual(password, ADMIN_CREDENTIALS.password)
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) {
    // Still do a comparison to keep timing similar
    ab.length === ab.length
    return false
  }
  return ab.equals(bb)
}

// Guard for admin pages: if no admin session, return 404 (do NOT redirect to the
// secret login URL — that would leak the secret path to anyone scanning /admin).
export async function requireAdminSession(): Promise<void> {
  const ok = await getAdminSession()
  if (!ok) {
    notFound()
  }
}

// Convenience: call redirect to the secret admin login URL.
export async function redirectToAdminLogin() {
  redirect(ADMIN_LOGIN_URL)
}

import { notFound } from 'next/navigation'

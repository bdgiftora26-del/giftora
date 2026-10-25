import { notFound } from 'next/navigation'
import { ADMIN_LOGIN_PATH } from '@/lib/admin-auth'
import { AdminLoginForm } from './AdminLoginForm'

export const dynamic = 'force-dynamic'

// Secret admin login page. The `secret` segment must match ADMIN_SECRET_PATH env.
// If it doesn't match, return 404 — never reveal that a different secret exists.
export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ secret: string }>
}) {
  const { secret } = await params
  const expected = process.env.ADMIN_SECRET_PATH
  const validSecret = !!expected && secret === expected
  if (!validSecret) notFound()

  return <AdminLoginForm validSecret={validSecret} />
}

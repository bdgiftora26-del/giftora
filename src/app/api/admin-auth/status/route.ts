import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ isAdmin: await getAdminSession() })
}

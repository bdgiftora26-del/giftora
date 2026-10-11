import { NextResponse } from 'next/server'
import { getCurrencies } from '@/lib/currency'

export const dynamic = 'force-dynamic'

export async function GET() {
  const currencies = await getCurrencies()
  return NextResponse.json({ currencies })
}

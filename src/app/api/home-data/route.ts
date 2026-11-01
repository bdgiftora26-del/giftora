import { NextResponse } from 'next/server'
import { getHomeData } from '@/lib/home-data'

export const dynamic = 'force-dynamic'

// Home-page aggregate. Kept as an API route for any client-side refresh needs,
// but the homepage itself now loads this data SERVER-SIDE in page.tsx (no
// loading spinner). Both paths share the same cached loader + `home` tag, so
// invalidation works identically.
export async function GET() {
  const data = await getHomeData('en')
  return NextResponse.json(data)
}

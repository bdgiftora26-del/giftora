import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { name, country, message } = body
  if (!name || !message) {
    return NextResponse.json({ error: 'Name and message required' }, { status: 400 })
  }
  const t = await db.testimonial.create({
    data: {
      name: String(name),
      country: String(country || ''),
      message: String(message),
      approved: false,
    },
  })
  return NextResponse.json({ ok: true, id: t.id })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const approved = searchParams.get('approved') === 'true'
  const items = await db.testimonial.findMany({
    where: approved ? { approved: true } : undefined,
    orderBy: { createdAt: 'desc' },
    take: Number(searchParams.get('limit') || 20),
  })
  return NextResponse.json({ testimonials: items })
}

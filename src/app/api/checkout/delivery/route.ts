import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const {
    recipientName, recipientPhone, address, area, cityId,
    deliveryDate, timeSlot, cardMessage, hideSender, notes,
  } = body

  if (!recipientName || !recipientPhone || !address || !area || !cityId || !deliveryDate || !timeSlot) {
    return NextResponse.json({ error: 'Missing required delivery fields' }, { status: 400 })
  }

  const delivery = {
    recipientName,
    recipientPhone,
    address,
    area,
    cityId: Number(cityId),
    deliveryDate,
    timeSlot,
    cardMessage: cardMessage || null,
    hideSender: !!hideSender,
    notes: notes || null,
  }

  const store = await cookies()
  store.set('ub_delivery', JSON.stringify(delivery), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/',
  })

  return NextResponse.json({ ok: true })
}

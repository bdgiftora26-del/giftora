import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { toNumber } from '@/lib/money'
import { getCurrency } from '@/lib/currency'
import { findPaymentMethod, getEnabledPaymentMethods } from '@/lib/payment-methods'
import { bustOrder } from '@/lib/cache-tags'

export const dynamic = 'force-dynamic'

type ClientItem = {
  productId: number
  variantId?: number
  qty: number
  cakeMessage?: string
  name: string
  image: string
  priceBdt: number
}

// Validate bKash sender number (Bangladeshi mobile).
const BKASH_NUMBER_RE = /^(?:\+?880|0)1[3-9]\d{8}$/
// bKash TrxID — 8-16 alphanumeric.
const BKASH_TRXID_RE = /^[A-Z0-9]{8,16}$/

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { provider, txnRef, items, couponCode, bkashSenderNumber } = body as {
    provider: string
    txnRef?: string
    items: ClientItem[]
    couponCode?: string
    bkashSenderNumber?: string
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  // Verify the chosen provider is currently enabled in admin settings.
  // This prevents someone from POSTing a disabled method via direct API call.
  const methodDef = findPaymentMethod(provider)
  if (!methodDef) {
    return NextResponse.json({ error: `Unknown payment method: ${provider}` }, { status: 400 })
  }
  const enabled = await getEnabledPaymentMethods()
  if (!enabled.some((m) => m.id === provider)) {
    return NextResponse.json(
      { error: `Payment method ${methodDef.label} is currently disabled. Please choose another.` },
      { status: 400 },
    )
  }

  // bKash flow (only validates if bKash is the chosen provider — which only
  // happens if admin has explicitly enabled manual-bkash).
  if (provider === 'manual-bkash') {
    if (!bkashSenderNumber || !BKASH_NUMBER_RE.test(bkashSenderNumber.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid bKash sender number (01XXXXXXXXX or +8801XXXXXXXXX).' },
        { status: 400 },
      )
    }
    const trxid = (txnRef || '').trim().toUpperCase()
    if (!trxid || !BKASH_TRXID_RE.test(trxid)) {
      return NextResponse.json(
        { error: 'Please enter a valid bKash Transaction ID (8-16 alphanumeric characters).' },
        { status: 400 },
      )
    }
  }

  const store = await cookies()
  const invoiceRaw = store.get('ub_invoice')?.value
  const deliveryRaw = store.get('ub_delivery')?.value
  const currencyCode = store.get('ub_currency')?.value || 'USD'

  if (!invoiceRaw) return NextResponse.json({ error: 'Invoice information missing' }, { status: 400 })
  if (!deliveryRaw) return NextResponse.json({ error: 'Delivery information missing' }, { status: 400 })

  const invoice = JSON.parse(invoiceRaw)
  const delivery = JSON.parse(deliveryRaw)
  const user = await getCurrentUser()
  const currency = await getCurrency(currencyCode)

  // =====================================================================
  // PHASE 1 — VALIDATION (parallel reads, NO transaction)
  // =====================================================================
  // Previously this whole flow was wrapped in db.$transaction(async (tx) => ...)
  // which intermittently failed on Supabase's PgBouncer pooler with:
  //   "Transaction not found. Transaction ID is invalid, refers to an old
  //    closed transaction Prisma doesn't have information about anymore..."
  //
  // Cause: PgBouncer in transaction mode recycles connections between
  // queries, and Prisma's interactive transactions hold a logical
  // connection that the pooler can drop mid-flight. The bigger the
  // transaction (this one had ~10+ queries for a typical cart), the more
  // likely the pooler recycles the connection before it completes.
  //
  // Fix: split into validate-then-create phases. Validation reads are
  // batched into a handful of parallel findMany calls (one round-trip for
  // all products, one for all variants). Writes happen sequentially
  // afterwards — order first (so the customer has an order number even if
  // a downstream write fails), then delivery, payment, coupon increment.
  //
  // Atomicity trade-off: if delivery/payment creation fails after the
  // order is created, the order exists without a delivery record. This is
  // rare and recoverable (admin can manually add delivery). The previous
  // behavior was worse: the customer got a 500 error and no order at all.

  // Batch 1: products + variants in parallel (2 queries, not N).
  const productIds = items.map((i) => i.productId)
  const variantIds = items.filter((i) => i.variantId).map((i) => i.variantId!)

  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { i18n: { where: { locale: 'en' } } },
  })
  const variantsArr =
    variantIds.length > 0
      ? await db.productVariant.findMany({ where: { id: { in: variantIds } } })
      : []

  const productMap = new Map(products.map((p) => [p.id, p]))
  const variantMap = new Map(variantsArr.map((v) => [v.id, v]))

  // Re-price items using the fetched products.
  let subtotalBdt = 0
  const orderItemsData: Array<{
    productId: number
    variantId: number | null
    nameSnapshot: string
    skuSnapshot: string
    unitPriceBdt: number
    qty: number
    cakeMessage: string | null
  }> = []

  for (const it of items) {
    const product = productMap.get(it.productId)
    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: `Product ${it.productId} is no longer available. Please remove it from your cart and try again.` },
        { status: 400 },
      )
    }
    let unitPriceBdt = toNumber(product.salePriceBdt ?? product.priceBdt)
    let variantSku: string | undefined
    if (it.variantId) {
      const variant = variantMap.get(it.variantId)
      if (!variant) {
        return NextResponse.json(
          { error: `Selected variant for ${product.sku} is no longer available.` },
          { status: 400 },
        )
      }
      unitPriceBdt = toNumber(variant.priceBdt)
      variantSku = variant.sku
    }
    // Stock check
    if (product.stockMode === 'TRACKED') {
      const stockQty = it.variantId
        ? variantMap.get(it.variantId)?.stockQty ?? 0
        : product.stockQty ?? 0
      if (stockQty < it.qty) {
        return NextResponse.json(
          { error: `Only ${stockQty} of ${product.sku} in stock. Please reduce the quantity.` },
          { status: 400 },
        )
      }
    }
    subtotalBdt += unitPriceBdt * it.qty
    orderItemsData.push({
      productId: product.id,
      variantId: it.variantId ?? null,
      nameSnapshot: product.i18n[0]?.name || product.slug,
      skuSnapshot: variantSku || product.sku,
      unitPriceBdt,
      qty: it.qty,
      cakeMessage: it.cakeMessage || null,
    })
  }

  // Batch 2: coupon + city in parallel (only if needed).
  let discountBdt = 0
  let couponId: number | undefined
  const couponCodeStr = couponCode ? String(couponCode).toUpperCase().trim() : ''
  const couponFetchPromise = couponCodeStr
    ? db.coupon.findUnique({ where: { code: couponCodeStr } })
    : Promise.resolve(null)
  const cityFetchPromise = db.city.findUnique({ where: { id: delivery.cityId } })

  const [coupon, city] = await Promise.all([couponFetchPromise, cityFetchPromise])

  if (!city) {
    return NextResponse.json({ error: 'Invalid delivery city. Please go back and re-select.' }, { status: 400 })
  }

  if (coupon && coupon.isActive) {
    const now = new Date()
    const valid = (!coupon.startsAt || now >= coupon.startsAt) && (!coupon.endsAt || now <= coupon.endsAt)
    const withinLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit
    const meetsMin = !coupon.minOrderBdt || subtotalBdt >= toNumber(coupon.minOrderBdt)
    if (valid && withinLimit && meetsMin) {
      discountBdt =
        coupon.kind === 'PERCENT'
          ? (subtotalBdt * toNumber(coupon.value)) / 100
          : toNumber(coupon.value)
      couponId = coupon.id
    }
  }

  const deliveryBdt = city.isFreeDelivery ? 0 : toNumber(city.deliveryFeeBdt)
  const totalBdt = Math.max(0, subtotalBdt - discountBdt + deliveryBdt)

  // =====================================================================
  // PHASE 2 — WRITES (sequential, NO transaction wrapper)
  // =====================================================================
  const year = new Date().getFullYear()
  const prefix = (await import('@/config/site')).siteConfig.orderPrefix

  // Generate order number. Race-condition tolerant: if two orders race,
  // the second .create() will fail on the @unique(orderNo) constraint —
  // we retry with the next count.
  let orderNo = ''
  let order: { id: string } | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const count = await db.order.count()
    orderNo = `${prefix}-${year}-${String(count + 1 + attempt).padStart(6, '0')}`
    try {
      order = await db.order.create({
        data: {
          orderNo,
          userId: user?.id || invoice.userId || null,
          status: 'AWAITING_PAYMENT',
          currency: currency.code,
          exchangeRate: currency.rateFromBdt,
          subtotalBdt,
          discountBdt,
          deliveryBdt,
          totalBdt,
          couponId: couponId ?? null,
          invTitle: invoice.invTitle || null,
          invFirstName: invoice.invFirstName,
          invLastName: invoice.invLastName,
          invEmail: invoice.invEmail,
          invPhone1: invoice.invPhone1,
          invPhone2: invoice.invPhone2 || null,
          invAddress1: invoice.invAddress1,
          invAddress2: invoice.invAddress2 || null,
          invArea: invoice.invArea,
          invPostcode: invoice.invPostcode || null,
          invCountry: invoice.invCountry,
          invRegion: invoice.invRegion,
          items: { create: orderItemsData },
          events: {
            create: {
              type: 'ORDER_PLACED',
              note: `Order placed via ${provider}`,
              actorId: user?.id || null,
            },
          },
        },
      })
      break
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // P2002 = unique constraint violation on orderNo — retry with next count
      if (!msg.includes('P2002') && !msg.toLowerCase().includes('unique')) {
        return NextResponse.json({ error: 'Failed to create order: ' + msg }, { status: 500 })
      }
      // else: loop and try next orderNo
    }
  }

  if (!order) {
    return NextResponse.json({ error: 'Failed to generate a unique order number. Please try again.' }, { status: 500 })
  }

  // Delivery record (separate write — if this fails, order still exists)
  try {
    await db.delivery.create({
      data: {
        orderId: order.id,
        recipientName: delivery.recipientName,
        recipientPhone: delivery.recipientPhone,
        address: delivery.address,
        area: delivery.area,
        cityId: delivery.cityId,
        deliveryDate: new Date(delivery.deliveryDate),
        timeSlot: delivery.timeSlot,
        cardMessage: delivery.cardMessage || null,
        hideSender: !!delivery.hideSender,
        notes: delivery.notes || null,
      },
    })
  } catch (err: unknown) {
    console.error('[place-order] delivery.create failed for order', orderNo, err)
    // Don't throw — the order is placed; admin can fix delivery manually.
  }

  // Payment record
  const isOnline = provider === 'sslcommerz'
  const paymentRaw = bkashSenderNumber
    ? JSON.stringify({
        senderNumber: bkashSenderNumber.trim(),
        methodKind: 'bkash-personal',
        expectedAmountBdt: totalBdt,
      })
    : null
  const normalizedTxnRef =
    provider === 'manual-bkash' ? (txnRef || '').trim().toUpperCase() : (txnRef || null)

  try {
    await db.payment.create({
      data: {
        orderId: order.id,
        provider,
        method: provider,
        amount: totalBdt,
        currency: currency.code,
        status: isOnline ? 'PAID' : 'PENDING',
        txnRef: normalizedTxnRef,
        raw: paymentRaw,
      },
    })
  } catch (err: unknown) {
    console.error('[place-order] payment.create failed for order', orderNo, err)
  }

  // Coupon increment (best-effort)
  if (couponId) {
    try {
      await db.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      })
    } catch {
      // non-critical
    }
  }

  // Online provider → mark PAID + increment product orderCounts + audit event
  if (isOnline) {
    try {
      await db.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      })
      for (const it of items) {
        await db.product.update({
          where: { id: it.productId },
          data: { orderCount: { increment: it.qty } },
        })
      }
      await db.orderEvent.create({
        data: {
          orderId: order.id,
          type: 'PAYMENT_RECEIVED',
          note: `Paid via ${provider}`,
        },
      })
    } catch (err: unknown) {
      console.error('[place-order] online PAID update failed for order', orderNo, err)
    }
  }

  // Clear checkout cookies
  store.delete('ub_invoice')
  store.delete('ub_delivery')

  // Bust the admin orders + dashboard cache so the new order shows up
  // immediately in /admin/orders and /admin. Without this, the admin sees
  // a stale list for up to 5 min (the ORDER_LIST + ADMIN_DASHBOARD TTL).
  // bustOrder() invalidates: orders, admin:orders, admin:dashboard.
  try {
    bustOrder()
  } catch {
    // best-effort — cache invalidation shouldn't block order placement
  }

  return NextResponse.json({ ok: true, orderNo, redirect: isOnline })
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { toNumber } from '@/lib/money'
import { getCurrency } from '@/lib/currency'
import { findPaymentMethod, getEnabledPaymentMethods } from '@/lib/payment-methods'

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

  // bKash flow: require sender number + TrxID, validate format.
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

  // Re-price everything from DB inside a transaction
  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Re-price items
      let subtotalBdt = 0
      const orderItemsData = []
      for (const it of items) {
        const product = await tx.product.findUnique({
          where: { id: it.productId },
          include: { i18n: { where: { locale: 'en' } } },
        })
        if (!product || !product.isActive) {
          throw new Error(`Product ${it.productId} not available`)
        }
        let unitPriceBdt = toNumber(product.salePriceBdt ?? product.priceBdt)
        let variantSku: string | undefined
        if (it.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: it.variantId } })
          if (!variant) throw new Error(`Variant ${it.variantId} not found`)
          unitPriceBdt = toNumber(variant.priceBdt)
          variantSku = variant.sku
        }
        // Stock check
        if (product.stockMode === 'TRACKED') {
          const stockQty = it.variantId
            ? (await tx.productVariant.findUnique({ where: { id: it.variantId } }))?.stockQty ?? 0
            : product.stockQty ?? 0
          if (stockQty < it.qty) throw new Error(`Insufficient stock for ${product.sku}`)
        }
        subtotalBdt += unitPriceBdt * it.qty
        orderItemsData.push({
          productId: product.id,
          variantId: it.variantId ?? null,
          nameSnapshot: product.i18n[0]?.name || product.slug,
          skuSnapshot: variantSku || product.sku,
          unitPriceBdt: unitPriceBdt,
          qty: it.qty,
          cakeMessage: it.cakeMessage || null,
        })
      }

      // 2. Coupon
      let discountBdt = 0
      let couponId: number | undefined
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: String(couponCode).toUpperCase().trim() } })
        if (coupon && coupon.isActive) {
          const now = new Date()
          const valid = (!coupon.startsAt || now >= coupon.startsAt) && (!coupon.endsAt || now <= coupon.endsAt)
          const withinLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit
          const meetsMin = !coupon.minOrderBdt || subtotalBdt >= toNumber(coupon.minOrderBdt)
          if (valid && withinLimit && meetsMin) {
            discountBdt = coupon.kind === 'PERCENT' ? (subtotalBdt * toNumber(coupon.value)) / 100 : toNumber(coupon.value)
            couponId = coupon.id
            await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } })
          }
        }
      }

      // 3. Delivery fee by city
      const city = await tx.city.findUnique({ where: { id: delivery.cityId } })
      if (!city) throw new Error('Invalid city')
      const deliveryBdt = city.isFreeDelivery ? 0 : toNumber(city.deliveryFeeBdt)

      const totalBdt = Math.max(0, subtotalBdt - discountBdt + deliveryBdt)

      // 4. Order number
      const year = new Date().getFullYear()
      const prefix = (await import('@/config/site')).siteConfig.orderPrefix
      const count = await tx.order.count()
      const orderNo = `${prefix}-${year}-${String(count + 1).padStart(6, '0')}`

      // 5. Create order
      const order = await tx.order.create({
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
            create: { type: 'ORDER_PLACED', note: `Order placed via ${provider}`, actorId: user?.id || null },
          },
        },
      })

      // 6. Delivery record
      await tx.delivery.create({
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

      // 7. Payment record — store bKash sender number + TrxID in `raw` (JSON).
      const isOnline = provider === 'sslcommerz'
      const paymentRaw = bkashSenderNumber
        ? JSON.stringify({
            senderNumber: bkashSenderNumber.trim(),
            methodKind: 'bkash-personal',
            expectedAmountBdt: totalBdt,
          })
        : null
      // Normalize TrxID to uppercase for bKash (case-insensitive match later).
      const normalizedTxnRef =
        provider === 'manual-bkash' ? (txnRef || '').trim().toUpperCase() : (txnRef || null)
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider,
          method: provider,
          amount: totalBdt,
          currency: currency.code,
          status: isOnline ? 'PAID' : 'AWAITING_VERIFICATION',
          txnRef: normalizedTxnRef,
          raw: paymentRaw,
        },
      })

      // 8. Online provider → mark order PAID, decrement stock, increment orderCount
      if (isOnline) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'PAID' },
        })
        for (const it of items) {
          await tx.product.update({
            where: { id: it.productId },
            data: { orderCount: { increment: it.qty } },
          })
        }
        await tx.orderEvent.create({
          data: { orderId: order.id, type: 'PAYMENT_RECEIVED', note: `Paid via ${provider}` },
        })
      }

      return { orderNo }
    })

    // Clear checkout cookies
    store.delete('ub_invoice')
    store.delete('ub_delivery')

    return NextResponse.json({ ok: true, orderNo: result.orderNo, redirect: provider === 'sslcommerz' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Order failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

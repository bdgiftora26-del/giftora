import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { Price } from '@/components/Price'
import { toNumber } from '@/lib/money'
import { CheckCircle2, Phone, Mail, Clock, Package, Truck, Home } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CompletePage({
  params,
}: {
  params: Promise<{ orderNo: string }>
}) {
  const { orderNo } = await params
  const order = await db.order.findUnique({
    where: { orderNo },
    include: {
      items: true,
      delivery: { include: { city: true } },
      payments: true,
      events: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!order) notFound()

  const subtotalBdt = toNumber(order.subtotalBdt)
  const discountBdt = toNumber(order.discountBdt)
  const deliveryBdt = toNumber(order.deliveryBdt)
  const totalBdt = toNumber(order.totalBdt)

  const payment = order.payments[0]
  const isPayOnContact = payment?.provider === 'pay-on-contact'
  const isManual = order.payments.some((p) => p.provider.startsWith('manual'))
  const status = order.status

  return (
    <StorefrontShell withSidebar>
      <div style={{ padding: '12px 16px', maxWidth: 800, margin: '0 auto' }}>
        <div className="checkout-title-row">
          <h1 className="checkout-title">Order Complete</h1>
          <div className="checkout-steps">
            Basket → Checkout → Payment → <span className="step-current">Complete</span> →
          </div>
        </div>

        {/* === HERO THANK YOU BLOCK ===
            Prominent celebratory header so the customer immediately knows
            their order went through. Shows the order number + customer email
            (the two pieces they need to track the order). */}
        <div
          style={{
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            border: '2px solid #16a34a',
            borderRadius: 12,
            padding: '24px 20px',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          <CheckCircle2
            size={56}
            style={{ color: '#16a34a', margin: '0 auto 12px', display: 'block' }}
            strokeWidth={2}
          />
          <h2 style={{ fontSize: 22, margin: '0 0 8px', color: '#166534', fontWeight: 800 }}>
            Thank you for your order!
          </h2>
          <p style={{ fontSize: 13, color: '#166534', margin: '0 0 16px' }}>
            Your order has been placed successfully. We&apos;ll be in touch shortly.
          </p>

          {/* Order number + email — the two things the customer needs to
              track their order using our /track-order page. */}
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              gap: 8,
              background: '#fff',
              padding: '12px 20px',
              borderRadius: 8,
              border: '1px solid #16a34a',
              fontSize: 14,
              minWidth: 280,
            }}
          >
            <div>
              <strong style={{ color: '#166534' }}>Order Number:</strong>
              <br />
              <code
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#1a1a2e',
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  letterSpacing: 0.5,
                }}
              >
                {order.orderNo}
              </code>
            </div>
            <div style={{ borderTop: '1px dashed #bbf7d0', paddingTop: 8 }}>
              <strong style={{ color: '#166534' }}>Email:</strong>
              <br />
              <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{order.invEmail}</span>
            </div>
          </div>

          <p style={{ fontSize: 11, color: '#166534', margin: '12px 0 0' }}>
            Save these details — you&apos;ll need them to{' '}
            <Link
              href={`/track-order?orderNo=${order.orderNo}`}
              style={{ color: '#166534', fontWeight: 700, textDecoration: 'underline' }}
            >
              track your order
            </Link>
            .
          </p>
        </div>

        {/* === WHAT HAPPENS NEXT ===
            For pay-on-contact orders: explain that we'll contact them.
            For manual payment orders (if admin ever re-enables bKash etc.):
            show payment instructions instead. */}
        {isPayOnContact && status === 'AWAITING_PAYMENT' && (
          <div
            className="alert alert-info"
            style={{ padding: 16, marginBottom: 16, lineHeight: 1.6 }}
          >
            <h3 style={{ fontSize: 15, margin: '0 0 12px', color: '#1e40af' }}>
              What happens next?
            </h3>
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 13,
                color: '#333',
                lineHeight: 1.8,
              }}
            >
              <li>
                <strong>Our team contacts you</strong> within a few hours (usually faster
                during business hours) on{' '}
                <strong>{order.invPhone1}</strong> or{' '}
                <strong>{order.invEmail}</strong>.
              </li>
              <li>
                <strong>We arrange payment</strong> — you&apos;ll choose how to pay (bKash,
                bank transfer, etc.) when we contact you.
              </li>
              <li>
                <strong>Your order is confirmed</strong> once we receive your payment.
                You&apos;ll get a confirmation by email.
              </li>
              <li>
                <strong>We process + deliver</strong> your order on the scheduled delivery
                date.
              </li>
            </ol>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px dashed #bfdbfe',
                fontSize: 11,
                color: '#666',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> Reply within hours
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Phone size={12} /> By phone or email
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Package size={12} /> Order is reserved for you
              </span>
            </div>
          </div>
        )}

        {/* Fallback: manual payment instructions (only shown if admin ever
            re-enables bKash / bank etc. AND the customer chose one). */}
        {!isPayOnContact && isManual && status === 'AWAITING_PAYMENT' && (
          <div className="alert alert-info">
            <h3 style={{ fontSize: 14, marginBottom: 6 }}>Payment Instructions</h3>
            <p style={{ fontSize: 12 }}>
              Your order is <strong>awaiting payment</strong>. Please send your payment
              using the details you saw on the payment page, then enter your transaction ID
              on the <Link href="/track-order" className="text-green">Track Order</Link> page.
            </p>
          </div>
        )}

        {/* === ORDER SUMMARY === */}
        <h3 className="form-section-title">Order Summary</h3>
        <table className="cart-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price (BDT)</th>
              <th>Total (BDT)</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id}>
                <td>
                  {it.nameSnapshot}
                  {it.cakeMessage && <div className="muted">Cake: &ldquo;{it.cakeMessage}&rdquo;</div>}
                </td>
                <td>{it.qty}</td>
                <td>৳{toNumber(it.unitPriceBdt).toFixed(2)}</td>
                <td>৳{(toNumber(it.unitPriceBdt) * it.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="cart-totals">
          <div className="cart-totals-row">
            <span>Subtotal</span>
            <Price bdt={subtotalBdt} />
          </div>
          {discountBdt > 0 && (
            <div className="cart-totals-row text-green">
              <span>Discount</span>
              <span>-<Price bdt={discountBdt} /></span>
            </div>
          )}
          <div className="cart-totals-row">
            <span>Delivery</span>
            <Price bdt={deliveryBdt} />
          </div>
          <div className="cart-totals-row cart-totals-grand">
            <span>Total</span>
            <Price bdt={totalBdt} />
          </div>
        </div>

        {/* === DELIVERY DETAILS === */}
        {order.delivery && (
          <>
            <h3 className="form-section-title">Delivery Details</h3>
            <div style={{ fontSize: 12, lineHeight: 1.7 }}>
              <p><strong>Recipient:</strong> {order.delivery.recipientName} ({order.delivery.recipientPhone})</p>
              <p><strong>Address:</strong> {order.delivery.address}, {order.delivery.area}, {order.delivery.city.name}</p>
              <p>
                <strong>Date:</strong>{' '}
                {new Date(order.delivery.deliveryDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })},{' '}
                <strong>Slot:</strong> {order.delivery.timeSlot}
              </p>
              {order.delivery.cardMessage && <p><strong>Card message:</strong> {order.delivery.cardMessage}</p>}
            </div>
          </>
        )}

        {/* === ORDER TIMELINE === */}
        <h3 className="form-section-title">Order Timeline</h3>
        <ol style={{ fontSize: 12, paddingLeft: 18 }}>
          {order.events.map((ev) => (
            <li key={ev.id}>
              <strong>{ev.type.replace(/_/g, ' ')}</strong> — {new Date(ev.createdAt).toLocaleString()}
              {ev.note && <span className="muted"> — {ev.note}</span>}
            </li>
          ))}
        </ol>

        {/* === ACTIONS === */}
        <div
          className="cart-actions"
          style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}
        >
          <Link
            href={`/track-order?orderNo=${order.orderNo}`}
            className="btn-green"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Truck size={14} /> Track this order
          </Link>
          <Link
            href="/"
            className="btn-orange"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Home size={14} /> Back to Home
          </Link>
        </div>

        {/* === CONTACT NOTE === */}
        <div
          style={{
            marginTop: 24,
            padding: 14,
            background: '#f9fafb',
            borderRadius: 6,
            fontSize: 12,
            color: '#666',
            textAlign: 'center',
          }}
        >
          Questions about your order? Contact us at{' '}
          <a href="tel:+8801719818182" style={{ color: '#1a1a2e', fontWeight: 700 }}>
            <Phone size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> +880 1719-818182
          </a>{' '}
          or{' '}
          <a href="mailto:info@bdgiftora.com" style={{ color: '#1a1a2e', fontWeight: 700 }}>
            <Mail size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> info@bdgiftora.com
          </a>
          . Have your order number ready.
        </div>
      </div>
    </StorefrontShell>
  )
}

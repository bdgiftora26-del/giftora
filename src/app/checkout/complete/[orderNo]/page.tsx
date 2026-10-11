import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { Price } from '@/components/Price'
import { toNumber } from '@/lib/money'

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

  const isManual = order.payments.some((p) => p.provider.startsWith('manual'))
  const status = order.status

  return (
    <StorefrontShell withSidebar>
      <div style={{ padding: '12px 16px' }}>
        <div className="checkout-title-row">
          <h1 className="checkout-title">Order Complete</h1>
          <div className="checkout-steps">
            Basket → Checkout → Payment → <span className="step-current">Complete</span> →
          </div>
        </div>

        <div className="alert alert-success">
          <h2 style={{ fontSize: 18, marginBottom: 6 }}>Thank you for your order!</h2>
          <p>Your order number is <strong>{order.orderNo}</strong>.</p>
        </div>

        {isManual && status === 'AWAITING_PAYMENT' && (
          <div className="alert alert-info">
            <h3 style={{ fontSize: 14, marginBottom: 6 }}>Payment Instructions</h3>
            <p style={{ fontSize: 12 }}>
              Your order is now <strong>awaiting payment</strong>. Please send your payment using the
              details below, then upload your deposit slip or enter the transaction ID on the{' '}
              <Link href="/track-order" className="text-green">Track Order</Link> page so we can verify it.
            </p>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              <p><strong>Bank:</strong> Example Bank Ltd, Gulshan Branch, Dhaka</p>
              <p><strong>Account Name:</strong> Upohar Bangladesh</p>
              <p><strong>Account No:</strong> 1234 5678 9012</p>
              <p><strong>bKash (Personal):</strong> 01700-000000 (Send Money)</p>
            </div>
          </div>
        )}

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

        <h3 className="form-section-title">Order Timeline</h3>
        <ol style={{ fontSize: 12, paddingLeft: 18 }}>
          {order.events.map((ev) => (
            <li key={ev.id}>
              <strong>{ev.type}</strong> — {new Date(ev.createdAt).toLocaleString()}
              {ev.note && <span className="muted"> — {ev.note}</span>}
            </li>
          ))}
        </ol>

        <div className="cart-actions">
          <Link href="/" className="btn-orange">Back to Home</Link>
          <Link href={`/track-order?orderNo=${order.orderNo}`} className="btn-green">Track this order</Link>
        </div>
      </div>
    </StorefrontShell>
  )
}

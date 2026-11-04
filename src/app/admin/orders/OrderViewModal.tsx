'use client'

import { useState } from 'react'
import { Eye, X, CheckCircle2, XCircle, Copy } from 'lucide-react'

type Payment = {
  id: number
  provider: string
  method: string | null
  amount: number
  currency: string
  status: string
  txnRef: string | null
  senderNumber: string | null
  methodKind: string | null
  expectedAmountBdt: number | null
  createdAt: string
}

type OrderDetails = {
  orderNo: string
  status: string
  currency: string
  totalBdt: number
  subtotalBdt: number
  discountBdt: number
  deliveryBdt: number
  createdAt: string
  invFirstName: string
  invLastName: string
  invEmail: string
  invPhone1: string
  invPhone2: string | null
  invAddress1: string
  invAddress2: string | null
  invArea: string
  invPostcode: string | null
  invCountry: string
  invRegion: string
  delivery: {
    recipientName: string
    recipientPhone: string
    address: string
    area: string
    deliveryDate: string
    timeSlot: string
    cardMessage: string | null
    hideSender: boolean
    notes: string | null
    city: { name: string }
  } | null
  items: { nameSnapshot: string; skuSnapshot: string; unitPriceBdt: number; qty: number; cakeMessage: string | null }[]
  payments: Payment[]
}

const PROVIDER_LABELS: Record<string, string> = {
  'manual-bkash': 'bKash (Personal)',
  'manual-bank': 'Bank Deposit',
  'manual-western-union': 'Western Union',
  sslcommerz: 'SSLCommerz (Online)',
}

const STATUS_LABELS: Record<string, string> = {
  AWAITING_VERIFICATION: 'Awaiting Verification',
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  AUTHORIZED: 'Authorized',
  REFUNDED: 'Refunded',
}

export function OrderViewModal({ orderNo }: { orderNo: string }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  async function openModal() {
    setOpen(true)
    setLoading(true)
    setActionMsg(null)
    setNote('')
    const res = await fetch(`/api/admin/orders/${orderNo}`)
    if (res.ok) {
      const d = await res.json()
      setData(d.order)
    }
    setLoading(false)
  }

  function closeModal() {
    setOpen(false)
    setActionMsg(null)
    setNote('')
  }

  async function verifyPayment() {
    setActionLoading(true)
    setActionMsg(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderNo}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note || undefined }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Verify failed')
      setActionMsg({ type: 'success', text: `Payment verified — order marked as PAID.` })
      // Refresh order data so the UI updates
      await openModal()
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Verify failed',
      })
    } finally {
      setActionLoading(false)
    }
  }

  async function rejectPayment() {
    if (!confirm('Reject this payment? The order will be cancelled.')) return
    setActionLoading(true)
    setActionMsg(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderNo}/reject-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note || undefined }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Reject failed')
      setActionMsg({ type: 'success', text: `Payment rejected — order cancelled.` })
      await openModal()
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Reject failed',
      })
    } finally {
      setActionLoading(false)
    }
  }

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // ignore
    }
  }

  const payment = data?.payments?.[0]
  const isAwaitingVerify = payment?.status === 'AWAITING_VERIFICATION' || payment?.status === 'PENDING'
  const isBkash = payment?.provider === 'manual-bkash'

  return (
    <>
      <button type="button" className="admin-btn admin-btn-outline" onClick={openModal} style={{ padding: '2px 8px', fontSize: 11 }}>
        <Eye size={12} /> View
      </button>
      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={closeModal}>
          <div style={{
            background: '#fff', borderRadius: 8, maxWidth: 720, width: '100%',
            maxHeight: '90vh', overflowY: 'auto', padding: 24,
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#1a1a2e' }}>Order {orderNo}</h2>
              <button type="button" onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {loading && <p style={{ color: '#999' }}>Loading...</p>}

            {data && (
              <>
                {/* Status + Date */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13 }}>
                  <span>
                    <strong>Status:</strong>{' '}
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 3,
                      fontSize: 11,
                      fontWeight: 700,
                      background:
                        data.status === 'DELIVERED' ? '#dcfce7'
                        : data.status === 'PAID' ? '#dcfce7'
                        : data.status === 'CANCELLED' || data.status === 'REFUNDED' ? '#fee2e2'
                        : '#fef3c7',
                      color:
                        data.status === 'DELIVERED' || data.status === 'PAID' ? '#166534'
                        : data.status === 'CANCELLED' || data.status === 'REFUNDED' ? '#991b1b'
                        : '#92400e',
                    }}>
                      {data.status.replace(/_/g, ' ')}
                    </span>
                  </span>
                  <span><strong>Date:</strong> {new Date(data.createdAt).toLocaleString()}</span>
                </div>

                {/* Customer (Invoice) Info */}
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, color: '#4f46e5', marginBottom: 8 }}>Customer (Invoice) Information</h3>
                  <div style={{ fontSize: 13, lineHeight: 1.8, color: '#333' }}>
                    <div><strong>Name:</strong> {data.invFirstName} {data.invLastName}</div>
                    <div><strong>Email:</strong> {data.invEmail}</div>
                    <div><strong>Phone 1:</strong> {data.invPhone1}</div>
                    {data.invPhone2 && <div><strong>Phone 2:</strong> {data.invPhone2}</div>}
                    <div><strong>Address:</strong> {data.invAddress1} {data.invAddress2 || ''}</div>
                    <div><strong>Area:</strong> {data.invArea}</div>
                    {data.invPostcode && <div><strong>Postcode:</strong> {data.invPostcode}</div>}
                    <div><strong>Country:</strong> {data.invCountry}</div>
                    <div><strong>Region:</strong> {data.invRegion}</div>
                  </div>
                </div>

                {/* Delivery Info */}
                {data.delivery && (
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, color: '#4f46e5', marginBottom: 8 }}>Delivery Information</h3>
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: '#333' }}>
                      <div><strong>Recipient:</strong> {data.delivery.recipientName}</div>
                      <div><strong>Phone:</strong> {data.delivery.recipientPhone}</div>
                      <div><strong>Address:</strong> {data.delivery.address}, {data.delivery.area}</div>
                      <div><strong>City:</strong> {data.delivery.city.name}</div>
                      <div><strong>Date:</strong> {new Date(data.delivery.deliveryDate).toLocaleDateString()}</div>
                      <div><strong>Time Slot:</strong> {data.delivery.timeSlot}</div>
                      {data.delivery.cardMessage && <div><strong>Card Message:</strong> {data.delivery.cardMessage}</div>}
                      <div><strong>Hide Sender:</strong> {data.delivery.hideSender ? 'Yes' : 'No'}</div>
                      {data.delivery.notes && <div><strong>Notes:</strong> {data.delivery.notes}</div>}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, color: '#4f46e5', marginBottom: 8 }}>Order Items</h3>
                  <table className="admin-table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.nameSnapshot}{item.cakeMessage && <div style={{ fontSize: 10, color: '#999' }}>Cake: "{item.cakeMessage}"</div>}</td>
                          <td style={{ fontSize: 11 }}>{item.skuSnapshot}</td>
                          <td>{item.qty}</td>
                          <td>৳{Number(item.unitPriceBdt).toFixed(0)}</td>
                          <td>৳{(Number(item.unitPriceBdt) * item.qty).toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Payment Info — enhanced with bKash details + verify/reject actions */}
                {payment && (
                  <div style={{
                    marginBottom: 16,
                    padding: 14,
                    border: '1px solid var(--c-line)',
                    borderRadius: 6,
                    background: isAwaitingVerify ? '#fffbeb' : '#f9fafb',
                  }}>
                    <h3 style={{ fontSize: 14, color: '#4f46e5', marginBottom: 8, marginTop: 0 }}>
                      Payment — {PROVIDER_LABELS[payment.provider] || payment.provider}
                    </h3>
                    <div style={{ fontSize: 13, color: '#333', lineHeight: 1.8 }}>
                      <div>
                        <strong>Status:</strong>{' '}
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: 3,
                          fontSize: 11,
                          fontWeight: 700,
                          background: payment.status === 'PAID' ? '#dcfce7' : payment.status === 'FAILED' ? '#fee2e2' : '#fef3c7',
                          color: payment.status === 'PAID' ? '#166534' : payment.status === 'FAILED' ? '#991b1b' : '#92400e',
                        }}>
                          {STATUS_LABELS[payment.status] || payment.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div><strong>Amount:</strong> ৳{Number(payment.amount).toFixed(0)} {payment.currency}</div>

                      {/* bKash-specific fields */}
                      {isBkash && payment.senderNumber && (
                        <>
                          <div style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 4, border: '1px solid var(--c-line)' }}>
                            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Customer&apos;s bKash Number (sender):</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <code style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-brand-red)' }}>
                                {payment.senderNumber}
                              </code>
                              <button
                                type="button"
                                onClick={() => copyText(payment.senderNumber!, 'sender')}
                                style={{
                                  background: 'none',
                                  border: '1px solid var(--c-line)',
                                  borderRadius: 3,
                                  padding: '1px 6px',
                                  fontSize: 10,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                }}
                              >
                                {copied === 'sender' ? <><CheckCircle2 size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                              </button>
                            </div>
                          </div>
                          <div style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 4, border: '1px solid var(--c-line)' }}>
                            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>bKash Transaction ID (TrxID):</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <code style={{ fontSize: 14, fontWeight: 700, fontFamily: 'ui-monospace, Menlo, monospace', color: '#1a1a2e' }}>
                                {payment.txnRef || '—'}
                              </code>
                              {payment.txnRef && (
                                <button
                                  type="button"
                                  onClick={() => copyText(payment.txnRef!, 'trxid')}
                                  style={{
                                    background: 'none',
                                    border: '1px solid var(--c-line)',
                                    borderRadius: 3,
                                    padding: '1px 6px',
                                    fontSize: 10,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                  }}
                                >
                                  {copied === 'trxid' ? <><CheckCircle2 size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Non-bKash manual — just show txnRef */}
                      {!isBkash && payment.txnRef && (
                        <div><strong>Reference:</strong> <code>{payment.txnRef}</code></div>
                      )}

                      <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                        Submitted: {new Date(payment.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Verification actions — only show when payment is awaiting */}
                    {isAwaitingVerify && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--c-line)' }}>
                        <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                          Admin note (optional — added to order events)
                        </label>
                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder={
                            isBkash
                              ? 'e.g. "TrxID matched in bKash app, amount ৳1,250 received"'
                              : 'e.g. "Bank deposit slip verified"'
                          }
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            border: '1px solid var(--c-line)',
                            borderRadius: 3,
                            fontSize: 12,
                            marginBottom: 8,
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={verifyPayment}
                            disabled={actionLoading}
                            style={{
                              background: 'var(--c-green)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '6px 14px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: actionLoading ? 'wait' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <CheckCircle2 size={14} /> Verify Payment
                          </button>
                          <button
                            type="button"
                            onClick={rejectPayment}
                            disabled={actionLoading}
                            style={{
                              background: '#dc2626',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '6px 14px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: actionLoading ? 'wait' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                        {actionMsg && (
                          <div
                            style={{
                              marginTop: 8,
                              padding: '6px 10px',
                              borderRadius: 3,
                              fontSize: 12,
                              background: actionMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                              color: actionMsg.type === 'success' ? '#166534' : '#991b1b',
                            }}
                          >
                            {actionMsg.text}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Totals */}
                <div style={{ background: '#f9f9f9', padding: 12, borderRadius: 6, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span>Subtotal:</span><span>৳{Number(data.subtotalBdt).toFixed(0)}</span>
                  </div>
                  {Number(data.discountBdt) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#16a34a' }}>
                      <span>Discount:</span><span>-৳{Number(data.discountBdt).toFixed(0)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span>Delivery:</span><span>৳{Number(data.deliveryBdt).toFixed(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '2px solid #333', marginTop: 4, fontWeight: 700 }}>
                    <span>Total:</span><span>৳{Number(data.totalBdt).toFixed(0)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

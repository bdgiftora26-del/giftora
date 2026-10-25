'use client'

import { useState } from 'react'
import { Eye, X } from 'lucide-react'

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
  payments: { provider: string; amount: number; status: string; txnRef: string | null }[]
}

export function OrderViewModal({ orderNo }: { orderNo: string }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(false)

  async function openModal() {
    setOpen(true)
    setLoading(true)
    // Fetch order details from track API (using admin session)
    const res = await fetch(`/api/admin/orders/${orderNo}`)
    if (res.ok) {
      const d = await res.json()
      setData(d.order)
    }
    setLoading(false)
  }

  return (
    <>
      <button type="button" className="admin-btn admin-btn-outline" onClick={openModal} style={{ padding: '2px 8px', fontSize: 11 }}>
        <Eye size={12} /> View
      </button>
      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setOpen(false)}>
          <div style={{
            background: '#fff', borderRadius: 8, maxWidth: 700, width: '100%',
            maxHeight: '85vh', overflowY: 'auto', padding: 24,
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#1a1a2e' }}>Order {orderNo}</h2>
              <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {loading && <p style={{ color: '#999' }}>Loading...</p>}

            {data && (
              <>
                {/* Status + Date */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13 }}>
                  <span><strong>Status:</strong> {data.status.replace(/_/g, ' ')}</span>
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

                {/* Payment Info */}
                {data.payments && data.payments.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, color: '#4f46e5', marginBottom: 8 }}>Payment</h3>
                    <div style={{ fontSize: 13, color: '#333' }}>
                      <div><strong>Method:</strong> {data.payments[0].provider}</div>
                      <div><strong>Status:</strong> {data.payments[0].status.replace(/_/g, ' ')}</div>
                      {data.payments[0].txnRef && <div><strong>Transaction Ref:</strong> {data.payments[0].txnRef}</div>}
                    </div>
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

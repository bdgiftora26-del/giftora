'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Save } from 'lucide-react'
import { toast } from 'sonner'

type Currency = {
  code: string
  symbol: string
  name: string
  rateFromBdt: number
  isActive: boolean
}

export function CurrencyManager() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchCurrencies = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/currencies')
    const data = await res.json()
    setCurrencies(data.currencies || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCurrencies() }, [fetchCurrencies])

  async function saveRate(code: string, rate: number) {
    setSaving(code)
    const res = await fetch('/api/admin/currencies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, rateFromBdt: rate }),
    })
    setSaving(null)
    if (res.ok) toast.success(`${code} rate updated`)
    else toast.error('Failed to update')
  }

  async function toggleActive(code: string, current: boolean) {
    const res = await fetch('/api/admin/currencies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, isActive: !current }),
    })
    if (res.ok) {
      setCurrencies(currencies.map((c) => c.code === code ? { ...c, isActive: !current } : c))
    }
  }

  return (
    <div>
      <h2 className="admin-page-title">Currency Rates</h2>
      <Link href="/admin" className="admin-back-link">← Back to Dashboard</Link>

      <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: 6, fontSize: 13, color: '#856404' }}>
        💡 Set the exchange rate for each currency relative to 1 BDT (Bangladeshi Taka).<br/>
        Example: 1 BDT = 0.0091 USD means a ৳1,000 product shows as US $9.10
      </div>

      {loading ? (
        <p style={{ color: '#999' }}>Loading...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Currency</th>
              <th>Symbol</th>
              <th>Rate (1 BDT = ?)</th>
              <th>Example (৳1000 = ?)</th>
              <th>Active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((c) => (
              <CurrencyRow
                key={c.code}
                currency={c}
                saving={saving === c.code}
                onSave={saveRate}
                onToggle={toggleActive}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function CurrencyRow({
  currency,
  saving,
  onSave,
  onToggle,
}: {
  currency: Currency
  saving: boolean
  onSave: (code: string, rate: number) => void
  onToggle: (code: string, current: boolean) => void
}) {
  const [rate, setRate] = useState(String(currency.rateFromBdt))
  const example = (1000 * currency.rateFromBdt).toFixed(2)

  return (
    <tr>
      <td><strong>{currency.code}</strong> — {currency.name}</td>
      <td>{currency.symbol}</td>
      <td>
        <input
          type="number"
          step="0.0001"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          style={{ width: 120, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4 }}
        />
      </td>
      <td style={{ color: '#555', fontSize: 12 }}>{currency.symbol} {example}</td>
      <td>
        <button
          type="button"
          onClick={() => onToggle(currency.code, currency.isActive)}
          className={currency.isActive ? 'admin-btn admin-btn-success' : 'admin-btn admin-btn-outline'}
          style={{ padding: '2px 8px', fontSize: 11 }}
        >
          {currency.isActive ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td>
        <button
          type="button"
          onClick={() => onSave(currency.code, Number(rate))}
          className="admin-btn admin-btn-primary"
          style={{ padding: '4px 10px', fontSize: 12 }}
          disabled={saving}
        >
          <Save size={12} /> {saving ? 'Saving...' : 'Save'}
        </button>
      </td>
    </tr>
  )
}

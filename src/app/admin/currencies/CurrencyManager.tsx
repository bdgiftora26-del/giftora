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
        💡 Set how many BDT equals 1 unit of each currency.<br/>
        Example: 1 USD = 110 BDT, 1 AUD = 72 BDT, 1 GBP = 139 BDT
      </div>

      {loading ? (
        <p style={{ color: '#999' }}>Loading...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Currency</th>
              <th>Symbol</th>
              <th>1 {`{currency}`} = ? BDT</th>
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
  // Admin enters: 1 USD = how many BDT. We convert to rateFromBdt = 1/bdtPerUnit
  const bdtPerUnit = currency.rateFromBdt > 0 ? (1 / currency.rateFromBdt) : 0
  const [bdtInput, setBdtInput] = useState(String(Math.round(bdtPerUnit)))
  const example = (1000 / Number(bdtInput || 1)).toFixed(2)

  function handleSave() {
    const bdt = Number(bdtInput)
    if (!bdt || bdt <= 0) return
    const rateFromBdt = 1 / bdt // Convert: 1 BDT = 1/bdtPerUnit foreign
    onSave(currency.code, rateFromBdt)
  }

  return (
    <tr>
      <td><strong>{currency.code}</strong> — {currency.name}</td>
      <td>{currency.symbol}</td>
      <td>
        <strong>1 {currency.code}</strong> = {' '}
        <input
          type="number"
          step="1"
          value={bdtInput}
          onChange={(e) => setBdtInput(e.target.value)}
          style={{ width: 100, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4 }}
        />
        {' '}<strong>BDT</strong>
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
          onClick={handleSave}
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

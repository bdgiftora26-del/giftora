'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Check, Loader2, AlertCircle } from 'lucide-react'

type MethodStatus = {
  id: string
  label: string
  desc: string
  type: 'manual' | 'online'
  defaultEnabled: boolean
  enabled: boolean
}

export function PaymentMethodsManager() {
  const [methods, setMethods] = useState<MethodStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/payment-methods')
        const data = await res.json()
        setMethods(data.methods || [])
      } catch {
        setMsg({ type: 'error', text: 'Failed to load payment methods.' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function toggle(id: string) {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    )
    setMsg(null)
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const enabled = methods.filter((m) => m.enabled).map((m) => m.id)
      if (enabled.length === 0) {
        setMsg({ type: 'error', text: 'At least one payment method must be enabled.' })
        setSaving(false)
        return
      }
      const res = await fetch('/api/admin/payment-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setMethods(data.methods || [])
      setMsg({ type: 'success', text: 'Payment methods updated.' })
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
        <Loader2 size={20} className="animate-spin" style={{ display: 'inline-block' }} /> Loading…
      </div>
    )
  }

  const enabledCount = methods.filter((m) => m.enabled).length

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 13, color: '#666' }}>
        Toggle which payment methods customers can choose at checkout. Disabled methods
        are hidden from the checkout page immediately. At least one must stay enabled.
      </div>

      {msg && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: 12,
            borderRadius: 4,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: msg.type === 'success' ? '#166534' : '#991b1b',
          }}
        >
          {msg.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {methods.map((m) => (
          <div
            key={m.id}
            style={{
              border: `1px solid ${m.enabled ? 'var(--c-green)' : 'var(--c-line)'}`,
              borderRadius: 6,
              padding: 14,
              background: m.enabled ? '#f0fdf4' : '#fafafa',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={() => toggle(m.id)}
              aria-label={m.enabled ? 'Disable' : 'Enable'}
              style={{
                background: m.enabled ? 'var(--c-green)' : '#d1d5db',
                border: 'none',
                borderRadius: 999,
                width: 44,
                height: 24,
                padding: 0,
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0,
                marginTop: 2,
                transition: 'background 0.15s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: m.enabled ? 22 : 2,
                  width: 20,
                  height: 20,
                  background: '#fff',
                  borderRadius: '50%',
                  transition: 'left 0.15s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <CreditCard size={14} style={{ color: '#666' }} />
                <strong style={{ fontSize: 14 }}>{m.label}</strong>
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 3,
                    background: m.type === 'online' ? '#dbeafe' : '#f3e8ff',
                    color: m.type === 'online' ? '#1e40af' : '#6b21a8',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {m.type}
                </span>
                {m.enabled && (
                  <span style={{ fontSize: 10, color: 'var(--c-green)', fontWeight: 700 }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#666', lineHeight: 1.5 }}>
                {m.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 12,
          background: '#f9fafb',
          borderRadius: 4,
          fontSize: 12,
          color: '#666',
        }}
      >
        <strong>{enabledCount}</strong> of {methods.length} methods enabled.
        Changes take effect immediately on save — checkout customers will see
        the new method list on their next visit.
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={save}
          disabled={saving || enabledCount === 0}
          style={{
            background: 'var(--c-green)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 700,
            cursor: saving || enabledCount === 0 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <>Save Changes</>}
        </button>
      </div>
    </div>
  )
}

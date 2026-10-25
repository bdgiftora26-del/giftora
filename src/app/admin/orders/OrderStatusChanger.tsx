'use client'

import { useState, useTransition } from 'react'

export function OrderStatusChanger({
  orderId,
  current,
  statuses,
}: {
  orderId: string
  current: string
  statuses: string[]
}) {
  const [status, setStatus] = useState(current)
  const [pending, startTransition] = useTransition()

  const onChange = (value: string) => {
    setStatus(value)
    startTransition(async () => {
      await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: value }),
      })
    })
  }

  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      disabled={pending}
      style={{
        fontSize: 11,
        height: 24,
        background:
          status === 'DELIVERED'
            ? 'var(--c-green-soft)'
            : status === 'CANCELLED'
              ? '#fdecea'
              : '#fff',
      }}
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, ' ')}
        </option>
      ))}
    </select>
  )
}

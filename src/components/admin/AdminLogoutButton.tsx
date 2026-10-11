'use client'

export function AdminLogoutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/admin-auth/logout', { method: 'POST' })
        window.location.href = '/'
      }}
      style={{
        background: 'none',
        border: '1px solid var(--c-line)',
        padding: '2px 8px',
        fontSize: 11,
        cursor: 'pointer',
        color: 'var(--c-red)',
        marginLeft: 8,
      }}
    >
      Logout Admin
    </button>
  )
}

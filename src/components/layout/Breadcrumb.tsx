'use client'

import Link from 'next/link'
import { Fragment } from 'react'

export type Crumb = { label: string; href?: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="breadcrumb-sep">/</span>}
          {c.href ? (
            <Link href={c.href} className="breadcrumb-link">
              {c.label}
            </Link>
          ) : (
            <span className="breadcrumb-current">{c.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}

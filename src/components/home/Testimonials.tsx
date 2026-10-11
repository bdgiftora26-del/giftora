'use client'

import Link from 'next/link'
import { useT } from '@/components/providers'

export type TestimonialData = {
  id: number
  name: string
  country: string
  message: string
}

export function Testimonials({
  testimonials,
  totalApproved,
}: {
  testimonials: TestimonialData[]
  totalApproved: number
}) {
  const t = useT()
  // Show first 3 (auto-rotate could be added; keep static for reliability)
  const shown = testimonials.slice(0, 3)
  return (
    <section className="mb-4">
      <h2 className="section-title">{t('Home.WhatCustomersSay')}</h2>
      <div className="testimonials-panel">
        <div className="testimonials-grid">
          {shown.map((tm) => (
            <div className="testimonial-col" key={tm.id}>
              <p className="testimonial-text">{tm.message}</p>
              <div className="testimonial-name">{tm.name}</div>
              <div className="testimonial-country">{tm.country}</div>
            </div>
          ))}
        </div>
        {totalApproved > shown.length && (
          <div className="testimonials-more">
            {t('Home.AnotherCustomers', { n: totalApproved - shown.length })}{' '}
            <Link href="/testimonials">read more...</Link>
          </div>
        )}
      </div>
    </section>
  )
}

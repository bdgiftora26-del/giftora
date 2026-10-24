'use client'

import Link from 'next/link'

export function HomeHero() {
  return (
    <section className="home-hero">
      <div className="home-hero-content">
        <div className="home-hero-text">
          <h1 className="home-hero-title">Send Gifts to Bangladesh</h1>
          <p className="home-hero-sub">
            From fresh flowers to delicious cakes, we have something for everyone.
            Serving since 2004.
          </p>
          <div className="home-hero-actions">
            <Link href="/flowers" className="btn-green">Shop Flowers</Link>
            <Link href="/cake" className="btn-orange">Shop Cakes</Link>
          </div>
          <div className="home-hero-features">
            <span>✓ Same Day Delivery in Dhaka</span>
            <span>✓ Free Roses with Every Order</span>
            <span>✓ Photo Confirmation</span>
          </div>
        </div>
        <div className="home-hero-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/placeholders/mosaic/roses.svg" alt="Gift delivery in Bangladesh" />
        </div>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Slide = { id: number; title: string; imageUrl: string | null; link: string | null }

export function HomeSlider({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [slides.length])

  if (slides.length === 0) {
    // Fallback static hero
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
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="home-slider" aria-label="Promotional offers">
      <div className="home-slider-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide) => (
          <div key={slide.id} className="home-slider-slide">
            {slide.link ? (
              <Link href={slide.link} className="home-slider-link">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {slide.imageUrl && <img src={slide.imageUrl} alt={slide.title} className="home-slider-img" />}
                <div className="home-slider-overlay">
                  <h2 className="home-slider-title">{slide.title}</h2>
                </div>
              </Link>
            ) : (
              <div className="home-slider-link">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {slide.imageUrl && <img src={slide.imageUrl} alt={slide.title} className="home-slider-img" />}
                <div className="home-slider-overlay">
                  <h2 className="home-slider-title">{slide.title}</h2>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <>
          <div className="home-slider-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`home-slider-dot ${i === current ? 'active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            className="home-slider-arrow home-slider-prev"
            onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            type="button"
            className="home-slider-arrow home-slider-next"
            onClick={() => setCurrent((c) => (c + 1) % slides.length)}
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      )}
    </section>
  )
}

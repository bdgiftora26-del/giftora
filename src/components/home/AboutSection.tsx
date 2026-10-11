'use client'

import { useT } from '@/components/providers'

export function AboutSection({ bodyHtml }: { bodyHtml: string }) {
  const t = useT()
  // Split body into paragraphs for 3-column layout
  const paragraphs = bodyHtml
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  const left = paragraphs.slice(0, Math.ceil(paragraphs.length / 2)).join(' ')
  const right = paragraphs.slice(Math.ceil(paragraphs.length / 2)).join(' ')

  return (
    <section className="about-section">
      <h2 className="section-title">{t('Home.AboutService')}</h2>
      <div className="about-grid">
        <div>{left}</div>
        <div className="about-map">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/placeholders/mosaic/bangladesh-map.svg" alt="Bangladesh map" width={200} height={240} />
        </div>
        <div>{right}</div>
      </div>
    </section>
  )
}

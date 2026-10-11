'use client'

import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { Facebook, Twitter, Youtube, Instagram, MapPin } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Payment strip */}
        <div className="footer-payments">
          <img src="/placeholders/payments.svg" alt="Accepted payment methods" width={600} height={40} />
        </div>

        {/* Trust boxes */}
        <div className="trust-boxes">
          <div className="trust-box">
            <div className="trust-title">📷 Photo Confirmation</div>
            <p className="trust-desc">
              We send you a photo of the delivered gift so you know your loved ones received it.
            </p>
          </div>
          <div className="trust-box">
            <div className="trust-title">🌹 Free Roses</div>
            <p className="trust-desc">
              Five fresh red roses arrive free with every gift package delivered in Bangladesh.
            </p>
          </div>
          <div className="trust-box">
            <div className="trust-title">💌 Free Cards</div>
            <p className="trust-desc">
              A handwritten greeting card with your personal message is included at no charge.
            </p>
          </div>
        </div>

        {/* Info box: follow / testimonial / need help */}
        <div className="footer-info">
          <div className="footer-info-col">
            <div className="footer-info-title">Follow Us</div>
            <div className="social-row">
              <a href={siteConfig.social.facebook} aria-label="Facebook" className="social-icon"><Facebook size={16} /></a>
              <a href={siteConfig.social.twitter} aria-label="Twitter" className="social-icon"><Twitter size={16} /></a>
              <a href={siteConfig.social.maps} aria-label="Maps" className="social-icon"><MapPin size={16} /></a>
              <a href={siteConfig.social.youtube} aria-label="YouTube" className="social-icon"><Youtube size={16} /></a>
              <a href={siteConfig.social.instagram} aria-label="Instagram" className="social-icon"><Instagram size={16} /></a>
            </div>
          </div>
          <div className="footer-info-col footer-testimonial">
            <div className="footer-info-title">Testimonial</div>
            <p className="footer-quote">
              &ldquo;My mother received the cake on time with a beautiful card. Thank you BDGiftora for
              making the day special from so far away.&rdquo;
            </p>
          </div>
          <div className="footer-info-col footer-help">
            <div className="footer-info-title">Need Help?</div>
            <Link href="/contact-us" className="contact-btn">CONTACT US</Link>
          </div>
        </div>

        {/* Footer links */}
        <nav className="footer-links" aria-label="Footer">
          {siteConfig.footerLinks.map((l, i) => (
            <span key={l.href}>
              <Link href={l.href}>{l.label}</Link>
              {i < siteConfig.footerLinks.length - 1 && <span className="footer-sep"> | </span>}
            </span>
          ))}
        </nav>

        {/* Legal */}
        <div className="footer-legal">
          <p>Trading as {siteConfig.legalName}. ABN: {siteConfig.abn}</p>
          <p>Copyright © {siteConfig.brand} {year}. All Rights Reserved.</p>
          <p>{siteConfig.tradeLicense}</p>
        </div>
      </div>
    </footer>
  )
}

'use client'

import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { Facebook, Twitter, Youtube, Instagram, MessageCircle } from 'lucide-react'

const FOOTER_COLS = [
  {
    title: 'Quick Links',
    links: [
      { label: 'Home', href: '/' },
      { label: 'All Products', href: '/catalogue' },
      { label: 'About Us', href: '/about-us' },
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'Testimonials', href: '/testimonials' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Gift Categories',
    links: [
      { label: 'Anniversary Gifts', href: '/anniversary' },
      { label: 'Birthday Gifts', href: '/birthday' },
      { label: 'Wedding Gifts', href: '/wedding-gifts-in-bangladesh' },
      { label: 'Get Well Soon', href: '/medical-and-healthcare' },
      { label: 'New Baby Gifts', href: '/newborn-and-baby-gift' },
      { label: 'Valentine Gifts', href: '/valentines-day-gift-packages' },
    ],
  },
  {
    title: 'Send Gifts To',
    links: [
      { label: 'Dhaka', href: '/dhaka-city-free-gift-delivery' },
      { label: 'Chittagong', href: '/chittagong-city-free-gift-delivery' },
      { label: 'Sylhet', href: '/sylhet-city-free-gift-delivery' },
      { label: 'Rajshahi', href: '/rajshahi-city-free-gift-delivery' },
      { label: 'Khulna', href: '/khulna-city-free-gift-delivery' },
      { label: 'Barisal', href: '/barisal-city-free-gift-delivery' },
    ],
  },
  {
    title: 'Popular Items',
    links: [
      { label: 'Cakes', href: '/cake' },
      { label: 'Flowers', href: '/flowers' },
      { label: 'Chocolate', href: '/chocolate-ice-cream-cookies' },
      { label: 'Fruits', href: '/fresh-fruits-and-juices' },
      { label: 'Sweets', href: '/misti-and-sweets' },
      { label: 'Teddy Bear', href: '/teddy-bear-and-soft-toys' },
    ],
  },
]

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      {/* Payment strip */}
      <div className="footer-payments">
        <div className="footer-payments-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/placeholders/payments.svg" alt="Accepted payment methods" width={600} height={40} />
        </div>
      </div>

      {/* Main footer columns */}
      <div className="footer-main">
        <div className="footer-main-inner">
          {FOOTER_COLS.map((col) => (
            <div key={col.title} className="footer-col">
              <h4 className="footer-col-title">{col.title}</h4>
              <ul className="footer-col-list">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="footer-col footer-contact">
            <h4 className="footer-col-title">Contact Us</h4>
            <p className="footer-contact-line">{siteConfig.email}</p>
            <p className="footer-contact-line">+880 1312 597437</p>
            <div className="footer-socials">
              <a href={siteConfig.social.facebook} aria-label="Facebook" className="footer-social"><Facebook size={14} /></a>
              <a href="https://wa.me/8801312597437" aria-label="WhatsApp" className="footer-social"><MessageCircle size={14} /></a>
              <a href={siteConfig.social.twitter} aria-label="Twitter" className="footer-social"><Twitter size={14} /></a>
              <a href={siteConfig.social.youtube} aria-label="YouTube" className="footer-social"><Youtube size={14} /></a>
              <a href={siteConfig.social.instagram} aria-label="Instagram" className="footer-social"><Instagram size={14} /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>Copyright © {siteConfig.brandShort} {year}. All Rights Reserved. Serving Since 2004.</p>
          <p className="footer-legal">{siteConfig.tradeLicense}</p>
        </div>
      </div>
    </footer>
  )
}

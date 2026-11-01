'use client'

import Link from 'next/link'
import { Facebook, Twitter, Youtube, Instagram } from 'lucide-react'

// Top nav links (above payment strip)
const TOP_NAV = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/catalogue' },
  { label: 'About Us', href: '/about-us' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact us', href: '/contact-us' },
  { label: 'Testimonials', href: '/testimonials' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Sitemap', href: '/catalogue' },
]

// 5 columns of category links (matching reference footer)
const FOOTER_COLS = [
  {
    links: [
      { label: 'Anniversary Gifts', href: '/anniversary' },
      { label: 'Babies and Kids', href: '/gifts-and-toys-for-kids' },
      { label: 'Balloons', href: '/birthday' },
      { label: 'Cake From Bread and Beyond', href: '/bread-and-beyond' },
      { label: 'Cake From Coopers', href: '/coopers-cake' },
      { label: 'Cake From Kings', href: '/kings-cake' },
      { label: 'Cake From Mr. Bakers', href: '/mr-baker-cake' },
      { label: 'Cake From Tasty Treat', href: '/tasty-treat-cake' },
    ],
  },
  {
    links: [
      { label: 'Cakes', href: '/cake' },
      { label: 'Candles', href: '/birthday' },
      { label: 'Chittagong City Delivery', href: '/chittagong-city-free-gift-delivery' },
      { label: 'Chocolates', href: '/chocolates' },
      { label: 'Combo Gifts', href: '/combo-gifts' },
      { label: 'Exclusive Chocolate Bouquet', href: '/anniversary' },
      { label: 'Fakruddin Biriyani', href: '/food' },
      { label: 'Food Items', href: '/food' },
      { label: 'Get Well Soon', href: '/get-well-soon' },
    ],
  },
  {
    links: [
      { label: 'Gift Basket', href: '/gift-baskets' },
      { label: 'Gift for Her', href: '/gifts-and-dress-for-her' },
      { label: 'Gift for Him', href: '/gifts-and-dress-for-him' },
      { label: 'Greeting Cards', href: '/greeting-cards' },
      { label: 'Groceries', href: '/groceries-and-bazar' },
      { label: 'Heart Shaped Roses', href: '/heart-shaped-roses' },
      { label: 'Household Items', href: '/home-decor-and-appliance' },
      { label: 'Islamic Gifts', href: '/gifts-for-puja-and-holi' },
      { label: 'KFC', href: '/food' },
    ],
  },
  {
    links: [
      { label: 'Love and Romance', href: '/valentines-day-gift-packages' },
      { label: "Mother's Day Gift", href: '/mothers-day-gifts' },
      { label: 'Mugs', href: '/birthday' },
      { label: 'Personalized Gifts', href: '/personalised-gifts' },
      { label: 'Premium Sweets', href: '/misti-and-sweets' },
      { label: 'Roses in Basket', href: '/roses-in-basket' },
      { label: 'Roses in Bouquet', href: '/roses-in-bouquet' },
      { label: 'Roses with Teddy Bear', href: '/roses-with-teddy-bear-and-chocolates' },
    ],
  },
  {
    links: [
      { label: 'Same Day Gift Delivery', href: '/same-day-and-urgent-gifts' },
      { label: 'Send Birthday Gifts', href: '/birthday' },
      { label: 'Send Flowers to Bangladesh', href: '/flowers' },
      { label: 'Shop By Occasion', href: '/catalogue' },
      { label: 'Teddy Bear and Dolls', href: '/teddy-bear-dolls' },
      { label: 'Online Flower Shop', href: '/flowers' },
      { label: 'Valentine Gifts', href: '/valentines-day-gift-packages' },
      { label: 'Wedding Gifts', href: '/wedding-gifts-in-bangladesh' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="site-footer">
      {/* Top nav bar */}
      <div className="footer-topnav">
        <div className="footer-topnav-inner">
          {TOP_NAV.map((item, i) => (
            <span key={item.href}>
              <Link href={item.href}>{item.label}</Link>
              {i < TOP_NAV.length - 1 && <span className="footer-topnav-sep">|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Payment + Social row */}
      <div className="footer-pay-social">
        <div className="footer-pay-social-inner">
          {/* Social icons (left) */}
          <div className="footer-socials">
            <a href="https://facebook.com" aria-label="Facebook" className="footer-social"><Facebook size={16} /></a>
            <a href="https://twitter.com" aria-label="Twitter" className="footer-social"><Twitter size={16} /></a>
            <a href="https://youtube.com" aria-label="YouTube" className="footer-social"><Youtube size={16} /></a>
            <a href="https://instagram.com" aria-label="Instagram" className="footer-social"><Instagram size={16} /></a>
          </div>
          {/* Payment logos (center) */}
          <div className="footer-payments-logos">
            <span className="pay-logo pay-visa">VISA</span>
            <span className="pay-logo pay-mc"><span style={{ background: '#eb001b', borderRadius: '50%', width: 12, height: 12, display: 'inline-block' }}></span><span style={{ background: '#f79e1b', borderRadius: '50%', width: 12, height: 12, display: 'inline-block', marginLeft: -6 }}></span></span>
            <span className="pay-logo pay-amex">AMEX</span>
            <span className="pay-logo pay-paypal">PayPal</span>
            <span className="pay-logo pay-disc">Discover</span>
            <span className="pay-logo pay-bkash">bKash</span>
          </div>
        </div>
      </div>

      {/* Category link columns */}
      <div className="footer-links-section">
        <div className="footer-links-inner">
          {FOOTER_COLS.map((col, i) => (
            <div key={i} className="footer-link-col">
              <ul className="footer-link-list">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}><span className="footer-arrow">›</span> {l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-copyright">
        <p>© 2026 BDGiftora. All rights reserved. Managed by <a href="https://cynlex.com/" target="_blank" rel="noopener noreferrer" className="footer-cynlex-link">Cynlex Digital</a></p>
      </div>
    </footer>
  )
}

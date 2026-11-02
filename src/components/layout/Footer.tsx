import Link from 'next/link'
import { db } from '@/lib/db'
import { cached } from '@/lib/cache'
import { tag, TTL } from '@/lib/cache-tags'
import { Facebook, Twitter, Youtube, Instagram } from 'lucide-react'

const TOP_NAV = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/catalogue' },
  { label: 'About Us', href: '/about-us' },
  { label: 'Contact us', href: '/contact-us' },
  { label: 'Testimonials', href: '/testimonials' },
  { label: 'FAQ', href: '/faq' },
]

/**
 * Footer category links — cached under the `category` tag so any
 * bustCategory() call from the admin drops it immediately.
 *
 * Previously this ran an UN-CACHED DB query on every page render (every
 * home / category / product page), which on cross-region Supabase added
 * a noticeable round-trip to every single request. Now it's a µs L1 hit
 * in the warm path and a ~50ms L2 hit on a fresh serverless instance.
 */
async function getFooterCategories(): Promise<{ name: string; slug: string }[]> {
  return cached(
    'footer:categories',
    [tag.category(), tag.categoryPage()],
    TTL.CATEGORY_LIST,
    async () => {
      try {
        const cats = await db.category.findMany({
          where: { parentId: null, isActive: true, showInSidebar: true },
          include: {
            i18n: { where: { locale: 'en' } },
            children: {
              where: { isActive: true },
              include: { i18n: { where: { locale: 'en' } } },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        })
        const out: { name: string; slug: string }[] = []
        cats.forEach((c) => {
          const parentSlug = c.slug
          const parentName = c.i18n[0]?.name || c.slug
          out.push({ name: parentName, slug: parentSlug })
          c.children.forEach((ch) => {
            out.push({
              name: ch.i18n[0]?.name || ch.slug,
              slug: `${parentSlug}/${ch.slug}`,
            })
          })
        })
        return out
      } catch {
        // If footer categories can't load, return empty rather than crashing
        // the whole page (footer is non-critical).
        return []
      }
    },
  )
}

export async function Footer() {
  const allCategories = await getFooterCategories()

  // Split into 5 columns
  const perCol = Math.ceil(allCategories.length / 5)
  const columns: { name: string; slug: string }[][] = []
  for (let i = 0; i < 5; i++) {
    columns.push(allCategories.slice(i * perCol, (i + 1) * perCol))
  }

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

      {/* Payment + social row */}
      <div className="footer-pay-social">
        <div className="footer-pay-social-inner">
          <div className="footer-socials">
            <a href="https://facebook.com" aria-label="Facebook" className="footer-social"><Facebook size={16} /></a>
            <a href="https://twitter.com" aria-label="Twitter" className="footer-social"><Twitter size={16} /></a>
            <a href="https://youtube.com" aria-label="YouTube" className="footer-social"><Youtube size={16} /></a>
            <a href="https://instagram.com" aria-label="Instagram" className="footer-social"><Instagram size={16} /></a>
          </div>
          <div className="footer-payments-logos">
            <span className="pay-logo pay-visa">VISA</span>
            <span className="pay-logo pay-mc"><span style={{ background: '#eb001b', borderRadius: '50%', width: 12, height: 12, display: 'inline-block' }} /><span style={{ background: '#f79e1b', borderRadius: '50%', width: 12, height: 12, display: 'inline-block', marginLeft: -6 }} /></span>
            <span className="pay-logo pay-amex">AMEX</span>
            <span className="pay-logo pay-paypal">PayPal</span>
            <span className="pay-logo pay-disc">Discover</span>
            <span className="pay-logo pay-bkash">bKash</span>
          </div>
        </div>
      </div>

      {/* Category link columns — from DB */}
      <div className="footer-links-section">
        <div className="footer-links-inner">
          {columns.map((col, i) => (
            <div key={i} className="footer-link-col">
              <ul className="footer-link-list">
                {col.map((l) => (
                  <li key={l.slug}>
                    <Link href={`/${l.slug}`}><span className="footer-arrow">›</span> {l.name}</Link>
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

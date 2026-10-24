// Central site configuration — rebrand without code changes.
// Owner-editable parts mirror DB Setting rows at runtime.

export const siteConfig = {
  brand: 'BDGift.com',
  brandShort: 'BDGift',
  brandParts: { first: 'BD', second: 'Gift', third: '.com' },
  // Wordmark colours match the uploaded logo (BD=red, Giftora=purple, .com=red)
  brandColors: { first: 'var(--c-brand-red)', second: 'var(--c-brand-red)', third: 'var(--c-brand-red)' },
  logoUrl: '/brand-logo.jpg',
  tagline: 'Serving Since 2004',
  taglineBn: '২০০৪ সাল থেকে সেবা দিচ্ছি',
  legalName: 'BDGift',
  abn: '00 000 000 000',
  tradeLicense: 'Gift Delivery Service Trading License in Bangladesh (Sample — update with real license)',
  // Contact info — bdgift.com numbers
  email: 'info@bdgift.com',
  phone: '+8801312597437',
  whatsapp: '+8801312597437',
  address: 'Dhaka, Bangladesh',
  defaultCitySlug: 'dhaka',
  orderPrefix: 'BG',
  defaultCurrency: 'USD',
  currencies: ['USD', 'BDT', 'GBP', 'AUD', 'CAD', 'EUR'] as const,
  locales: ['en', 'bn'] as const,
  defaultLocale: 'en',
  social: {
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    maps: 'https://maps.google.com',
  },
  nav: {
    top: [
      { label: 'Home', href: '/' },
      { label: 'View Catalog', href: '/catalogue' },
      { label: 'How to Order', href: '/how-to-order-gift' },
      { label: 'How to Pay', href: '/how-to-pay-for-order' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Track Order', href: '/track-order' },
    ],
  },
  footerLinks: [
    { label: 'About Us', href: '/about-us' },
    { label: 'Contact Us', href: '/contact-us' },
    { label: 'How to order gift', href: '/how-to-order-gift' },
    { label: 'Comments from Customers', href: '/testimonials' },
    { label: 'Terms and Conditions', href: '/terms-and-conditions' },
    { label: 'How to Pay For Order', href: '/how-to-pay-for-order' },
    { label: 'Gift Delivery - How, Where and Fees', href: '/gift-delivery-how-where-and-fees' },
  ],
} as const

export type SiteConfig = typeof siteConfig

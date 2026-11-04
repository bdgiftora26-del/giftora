// Central site configuration — rebrand without code changes.
// Owner-editable parts mirror DB Setting rows at runtime.

export const siteConfig = {
  brand: 'BDGiftora.com',
  brandShort: 'BDGiftora',
  brandParts: { first: 'BD', second: 'Gift', third: '.com' },
  // Wordmark colours match the uploaded logo (BD=red, Giftora=purple, .com=red)
  brandColors: { first: 'var(--c-brand-red)', second: 'var(--c-brand-red)', third: 'var(--c-brand-red)' },
  logoUrl: '/brand-logo.jpg',
  tagline: 'Gift Delivery in Bangladesh',
  taglineBn: '২০০৪ সাল থেকে সেবা দিচ্ছি',
  legalName: 'BDGiftora',
  abn: '00 000 000 000',
  tradeLicense: 'Gift Delivery Service Trading License in Bangladesh (Sample — update with real license)',
  // Contact info — bdgift.com numbers
  email: 'info@bdgiftora.com',
  phone: '+8801719818182',
  whatsapp: '+8801719818182',
  address: '21/3, Johurabad, Darussalam, Mirpur 1, Dhaka 1216',
  defaultCitySlug: 'dhaka',
  orderPrefix: 'BG',
  defaultCurrency: 'USD',
  currencies: ['USD', 'AUD', 'GBP', 'CAD', 'EUR', 'INR', 'SGD'] as const,
  locales: ['en', 'bn'] as const,
  defaultLocale: 'en',
  // Manual payment receivers — shown to customers at checkout so they know
  // where to send money. Override at runtime via the `site:settings` row in
  // the Setting table (JSON) if you want to change without redeploying.
  payments: {
    bkashPersonalNumber: '+8801719818182',
    bkashMerchantNumber: '', // leave empty if not used
    bankAccount: {
      name: 'BDGiftora',
      bank: 'Dutch-Bangla Bank',
      branch: 'Mirpur 1, Dhaka',
      account: '0000000000000000',
      swift: 'DBBLBDDH',
    },
    westernUnion: {
      beneficiaryName: 'BDGiftora',
      city: 'Dhaka',
      country: 'Bangladesh',
    },
  },
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

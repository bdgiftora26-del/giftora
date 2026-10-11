import type { Metadata } from 'next'
import './globals.css'
import { LocaleProvider, CurrencyProvider, CartProvider } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  metadataBase: new URL('https://upoharbd.example'),
  title: {
    default: `${siteConfig.brand} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.brand}`,
  },
  description:
    'Order gift, cake, flower online for home delivery in Bangladesh. UpoharBd is the most trusted online gift shop for Bangladesh with over 1700 gift products.',
  keywords: ['gift delivery Bangladesh', 'send gift to Bangladesh', 'cake delivery Dhaka', 'flower delivery Bangladesh'],
  openGraph: {
    title: `${siteConfig.brand} — ${siteConfig.tagline}`,
    description: 'Order gift, cake, flower online for home delivery in Bangladesh.',
    type: 'website',
    images: ['/placeholders/og-image.svg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LocaleProvider>
          <CurrencyProvider>
            <CartProvider>
              {children}
              <Toaster richColors position="top-center" />
            </CartProvider>
          </CurrencyProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}

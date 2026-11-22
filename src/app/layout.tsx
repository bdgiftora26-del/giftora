import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { LocaleProvider, CurrencyProvider, CartProvider } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  metadataBase: new URL('https://bdgiftora.com'),
  title: {
    default: `${siteConfig.brand} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.brand}`,
  },
  description:
    'Order gift, cake, flower online for home delivery in Bangladesh. BDGiftora.com is the most trusted online gift shop for Bangladesh with over 1700 gift products. Discount available.',
  keywords: [
    'gift delivery Bangladesh',
    'send gift to Bangladesh',
    'BDGiftora',
    'bdgiftora.com',
    'cake delivery Dhaka',
    'flower delivery Bangladesh',
  ],
  openGraph: {
    title: `${siteConfig.brand} — ${siteConfig.tagline}`,
    description: 'Order gift, cake, flower online for home delivery in Bangladesh.',
    type: 'website',
    siteName: siteConfig.brand,
    images: [{ url: siteConfig.logoUrl, width: 1254, height: 1254, alt: siteConfig.brand }],
  },
  icons: {
    icon: [{ url: siteConfig.logoUrl, type: 'image/jpeg' }],
    apple: [{ url: siteConfig.logoUrl }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external origins we'll fetch from during page load.
            This shaves ~100-300ms off the first image / script fetch from
            each origin by opening the TCP+TLS connection in parallel with
            HTML parsing. Order matters: preconnect first, then dns-prefetch
            as a fallback for browsers that don't support preconnect. */}
        <link rel="preconnect" href="https://ymquocspwnnfpjitziow.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ymquocspwnnfpjitziow.supabase.co" />
        <link rel="preconnect" href="https://embed.tawk.to" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://embed.tawk.to" />
      </head>
      <body>
        <LocaleProvider>
          <CurrencyProvider>
            <CartProvider>
              {children}
              <Toaster richColors position="top-center" />
            </CartProvider>
          </CurrencyProvider>
        </LocaleProvider>
        {/* Tawk.to Live Chat
            strategy="lazyOnload" — defer until the page is fully loaded and
            idle. Previously `afterInteractive` which fired right after
            hydration, racing with image fetches for bandwidth. Live chat is
            non-critical for the initial page view; deferring it cuts ~80KB
            of JS + a stylesheet + a websocket from the critical path. */}
        <Script id="tawk-to" strategy="lazyOnload">
          {`
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/6ae6d559896a4b3c363006fc/1k6ar2q79';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
            })();
          `}
        </Script>
      </body>
    </html>
  )
}

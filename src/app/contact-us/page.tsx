import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { ContactForm } from '@/components/ContactForm'
import { siteConfig } from '@/config/site'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <StorefrontShell withSidebar>
      <div style={{ padding: '12px 16px', maxWidth: 640, margin: '0 auto' }}>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contact Us' }]} />
        <h1 className="category-h1">Contact Us</h1>
        <p className="category-desc">
          Have a question about your order or a custom gift? We&apos;re here to help.
        </p>
        <div style={{ fontSize: 12, marginBottom: 16, lineHeight: 1.7 }}>
          <p><strong>Email:</strong> {siteConfig.email}</p>
          <p><strong>Phone:</strong> {siteConfig.phone}</p>
          <p><strong>Address:</strong> {siteConfig.address}</p>
        </div>
        <ContactForm />
      </div>
    </StorefrontShell>
  )
}

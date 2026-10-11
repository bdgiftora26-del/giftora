import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { TestimonialForm } from '@/components/TestimonialForm'
import { db } from '@/lib/db'

export const revalidate = 300

export default async function TestimonialsPage() {
  const testimonials = await db.testimonial.findMany({
    where: { approved: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <StorefrontShell withSidebar>
      <div style={{ padding: '12px 16px', maxWidth: 800, margin: '0 auto' }}>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Testimonials' }]} />
        <h1 className="category-h1">What Our Customers Say</h1>
        <p className="category-desc">
          Real stories from customers who sent love across the miles with BDGiftora.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
          {testimonials.map((tm) => (
            <div key={tm.id} className="testimonial-col" style={{ background: 'var(--c-pink-soft)', padding: 14, border: '1px solid var(--c-line)' }}>
              <p className="testimonial-text" style={{ WebkitLineClamp: 6, marginBottom: 10 }}>{tm.message}</p>
              <div className="testimonial-name">{tm.name}</div>
              <div className="testimonial-country">{tm.country}</div>
            </div>
          ))}
        </div>

        <h2 className="form-section-title mt-4">Share Your Joy</h2>
        <TestimonialForm />
      </div>
    </StorefrontShell>
  )
}

'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard'

type Tab = {
  title: string
  content?: React.ReactNode
  products?: ProductCardData[]
}

export function ProductTabs({
  description,
  productCode,
  crossSell,
  alsoBought,
}: {
  description: string
  productCode: string
  crossSell: ProductCardData[]
  alsoBought: ProductCardData[]
}) {
  const [openTab, setOpenTab] = useState<string | null>('description')

  const tabs: Tab[] = [
    {
      title: 'CROSS SELLING PRODUCTS',
      products: crossSell,
    },
    {
      title: 'DESCRIPTION',
      content: (
        <div>
          {description ? (
            <div style={{ fontSize: 13, lineHeight: 1.7, color: '#555' }}>
              {description.split('\n').map((p, i) => (
                <p key={i} style={{ marginBottom: 8 }}>{p}</p>
              ))}
            </div>
          ) : (
            <p style={{ color: '#999' }}>No description available.</p>
          )}
          <p style={{ marginTop: 12, fontSize: 12, color: '#777' }}>
            <strong>Product Code:</strong> {productCode}
          </p>
        </div>
      ),
    },
    {
      title: 'ALSO BOUGHT',
      products: alsoBought,
    },
    {
      title: 'TELL FRIEND',
      content: (
        <div>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
            Share this product with your friends:
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== 'undefined' ? window.location.href : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '6px 16px', background: '#3b5998', color: '#fff', borderRadius: 4, fontSize: 13, textDecoration: 'none' }}
            >
              Share on Facebook
            </a>
            <a
              href={`https://wa.me/?text=Check this product: ${typeof window !== 'undefined' ? window.location.href : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '6px 16px', background: '#25D366', color: '#fff', borderRadius: 4, fontSize: 13, textDecoration: 'none' }}
            >
              Share on WhatsApp
            </a>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="product-tabs">
      {tabs.map((tab) => {
        const isOpen = openTab === tab.title
        const hasProducts = tab.products && tab.products.length > 0
        return (
          <div key={tab.title} className="product-tab">
            <button
              type="button"
              className="product-tab-header"
              onClick={() => setOpenTab(isOpen ? null : tab.title)}
            >
              {isOpen ? <Minus size={14} /> : <Plus size={14} />}
              <span>{tab.title}</span>
            </button>
            {isOpen && (
              <div className="product-tab-body">
                {tab.content}
                {hasProducts && (
                  <div className="related-grid" style={{ marginTop: 12 }}>
                    {tab.products!.map((p) => (
                      <ProductCard key={p.id} p={p} />
                    ))}
                  </div>
                )}
                {!hasProducts && !tab.content && (
                  <p style={{ color: '#999', fontSize: 13 }}>No recommended products.</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

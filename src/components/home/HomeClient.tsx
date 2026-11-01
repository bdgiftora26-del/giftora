'use client'

import { useState, useEffect } from 'react'
import { HomeSlider } from '@/components/home/HomeSlider'
import { HomeProductSections } from '@/components/home/HomeProductSections'
import { HomeContentSections } from '@/components/home/HomeContentSections'
import { Sidebar } from '@/components/layout/Sidebar'

type Slide = { id: number; title: string; imageUrl: string | null; link: string | null }
type ProductCardData = {
  id: number; slug: string; name: string; priceBdt: number; salePriceBdt: number | null;
  image: string; orderCount: number; firstSoldYear?: number | null; shortDescription?: string;
}

export function HomeClient() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/home-data')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        <div style={{ fontSize: 14 }}>Loading...</div>
      </div>
    )
  }

  const mapProducts = (products: any[]): ProductCardData[] => (products || []).map((p) => ({
    id: p.id, slug: p.slug, name: p.name,
    priceBdt: p.priceBdt, salePriceBdt: p.salePriceBdt,
    image: p.image, orderCount: p.orderCount || 0,
    firstSoldYear: p.firstSoldYear, shortDescription: p.shortDescription,
  }))

  return (
    <>
      <HomeSlider slides={data.sliderBanners || []} />
      <div className="content-with-sidebar">
        {data.sidebarCategories && <Sidebar categories={data.sidebarCategories} widgets={data.widgets} />}
        <main className="content-main">
          <HomeProductSections
            sections={[
              { title: 'Fresh Flowers', products: mapProducts(data.flowers), cols: 3 },
              { title: 'Popular Cakes', products: mapProducts(data.cakes), cols: 4 },
              { title: 'Food Items', products: mapProducts(data.food), cols: 3 },
              { title: 'Anniversary Gifts', products: mapProducts(data.anniversary), cols: 4 },
              { title: 'Gift Baskets & Combos', products: mapProducts(data.giftBaskets), cols: 3 },
            ]}
          />
          <HomeContentSections />
        </main>
      </div>
    </>
  )
}

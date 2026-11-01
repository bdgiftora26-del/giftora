'use client'

import { HomeSlider } from '@/components/home/HomeSlider'
import { HomeProductSections } from '@/components/home/HomeProductSections'
import { HomeContentSections } from '@/components/home/HomeContentSections'
import { Sidebar } from '@/components/layout/Sidebar'
import type { HomeData } from '@/lib/home-data'

type ProductCardData = {
  id: number; slug: string; name: string; priceBdt: number; salePriceBdt: number | null;
  image: string; orderCount: number; firstSoldYear?: number | null; shortDescription?: string;
}

// Pure presentational component — receives ALL data as props from the server.
// No useEffect, no fetch, no loading spinner. The page arrives complete.
export function HomeClient({ data }: { data: HomeData }) {
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

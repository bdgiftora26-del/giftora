import { db } from '@/lib/db'
import { HomeSlider } from '@/components/home/HomeSlider'

export async function HomeHero() {
  // Fetch active slider banners from DB (admin-managed)
  let slides: { id: number; title: string; imageUrl: string | null; link: string | null }[] = []
  try {
    slides = await db.banner.findMany({
      where: { placement: 'HOME_SLIDER', isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true, imageUrl: true, link: true },
    })
  } catch {
    slides = []
  }

  return <HomeSlider slides={slides} />
}

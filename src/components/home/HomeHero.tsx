import { HomeSlider } from '@/components/home/HomeSlider'

type Slide = { id: number; title: string; imageUrl: string | null; link: string | null }

export function HomeHero({ slides }: { slides: Slide[] }) {
  return <HomeSlider slides={slides} />
}

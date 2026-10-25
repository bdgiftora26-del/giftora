import { db } from '@/lib/db'
import { getSidebarCategories, type SidebarCategory } from '@/lib/catalog'
import { Sidebar } from '@/components/layout/Sidebar'

// Server component — fetches sidebar categories for the home page
export async function HomeSidebar() {
  const categories: SidebarCategory[] = await getSidebarCategories('en').catch(() => [])
  return <Sidebar categories={categories} />
}

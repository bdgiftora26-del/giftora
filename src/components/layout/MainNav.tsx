'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, ChevronDown } from 'lucide-react'
import { useCart } from '@/components/providers'

export type NavItem = {
  label: string
  href: string
  children?: { label: string; href: string }[]
}

const NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'All Categories', href: '/catalogue' },
  {
    label: 'Flowers',
    href: '/flowers',
    children: [
      { label: 'Roses in bouquet', href: '/flowers/roses-in-bouquet' },
      { label: 'Luxury Large Rose Arrangements', href: '/flowers/luxury-large-rose-arrangements' },
      { label: 'Roses in vase', href: '/flowers/roses-in-vase' },
      { label: 'Roses in basket', href: '/flowers/roses-in-basket' },
      { label: 'Heart Shaped Roses', href: '/flowers/heart-shaped-roses' },
      { label: 'Imported flowers', href: '/flowers/imported-flowers' },
      { label: 'Exclusive Flower Bouquet', href: '/flowers/exclusive-flower-bouquet' },
      { label: 'Mixed Flower Baskets', href: '/flowers/mixed-flower-baskets' },
    ],
  },
  {
    label: 'Birthday',
    href: '/birthday',
    children: [
      { label: 'Birthday Cake', href: '/birthday/birthday-cake' },
      { label: 'Birthday combo Gifts', href: '/birthday/birthday-combo-gifts' },
      { label: 'Beauty & Personal Care Gifts', href: '/birthday/beauty-personal-care-gifts' },
      { label: 'Birthday Candles', href: '/birthday/birthday-candles' },
      { label: 'Birthday Balloons', href: '/birthday/birthday-balloons' },
      { label: 'Teddy Bear', href: '/birthday/teddy-bear' },
      { label: 'Birthday Mug', href: '/birthday/birthday-mug' },
      { label: 'Birthday Card', href: '/birthday/birthday-card' },
    ],
  },
  {
    label: 'Cake',
    href: '/cake',
    children: [
      { label: "Mr. Baker Cake", href: '/cake/mr-baker-cake' },
      { label: "Cooper's Cake", href: '/cake/coopers-cake' },
      { label: 'Hot Cake', href: '/cake/hot-cake' },
      { label: "King's Cake", href: '/cake/kings-cake' },
      { label: 'Secret Recipe', href: '/cake/secret-recipe' },
      { label: 'Tasty Treat Cake', href: '/cake/tasty-treat-cake' },
      { label: 'Swiss Cake', href: '/cake/swiss-cake' },
      { label: 'Bread & Beyond', href: '/cake/bread-beyond' },
    ],
  },
  {
    label: 'Anniversary',
    href: '/anniversary',
    children: [
      { label: 'Anniversary combo gifts', href: '/anniversary/anniversary-combo-gifts' },
      { label: 'Anniversary cake', href: '/anniversary/anniversary-cake' },
      { label: 'Anniversary balloons', href: '/anniversary/anniversary-balloons' },
      { label: 'Anniversary candles', href: '/anniversary/anniversary-candles' },
      { label: 'Anniversary Teddy Bear', href: '/anniversary/anniversary-teddy-bear' },
      { label: 'Chocolate Bouquet', href: '/anniversary/chocolate-bouquet' },
    ],
  },
  {
    label: 'Food',
    href: '/food',
    children: [
      { label: 'Fakruddin Biryani', href: '/food/fakruddin-biryani' },
      { label: 'Star Biryani', href: '/food/star-biryani' },
      { label: "Sultan Dine's Biryani", href: '/food/sultan-dines-biryani' },
      { label: 'Kacchi Bhai Biryani', href: '/food/kacchi-bhai-biryani' },
    ],
  },
  { label: 'Gift Baskets', href: '/gift-baskets' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Your Order', href: '/track-order' },
]

export function MainNav() {
  const cart = useCart()
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  return (
    <nav className="main-nav" aria-label="Main">
      <div className="main-nav-inner">
        <ul className="main-nav-list">
          {NAV.map((item) => (
            <li
              key={item.label}
              className={`main-nav-item ${item.children ? 'has-dropdown' : ''}`}
              onMouseEnter={() => item.children && setOpenMenu(item.label)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link href={item.href} className="main-nav-link">
                {item.label}
                {item.children && <ChevronDown size={11} className="nav-caret" />}
              </Link>
              {item.children && openMenu === item.label && (
                <div className="mega-dropdown">
                  <div className="mega-dropdown-inner">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href} className="mega-dropdown-link">
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        <Link href="/cart" className="nav-cart" aria-label="Cart">
          <ShoppingCart size={18} />
          {cart.count() > 0 && <span className="nav-cart-badge">{cart.count()}</span>}
        </Link>
      </div>
    </nav>
  )
}

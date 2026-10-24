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
      { label: 'Roses in bouquet', href: '/roses-in-bouquet' },
      { label: 'Luxury Large Rose Arrangements', href: '/luxury-large-rose-arrangements' },
      { label: 'Roses in vase', href: '/roses-in-vase' },
      { label: 'Roses in basket', href: '/roses-in-basket' },
      { label: 'Heart Shaped Roses', href: '/heart-shaped-roses' },
      { label: 'Imported flowers', href: '/imported-flowers' },
      { label: 'Exclusive Flower Bouquet', href: '/exclusive-flower-bouquet' },
      { label: 'Mixed Flower Baskets', href: '/mixed-flower-baskets' },
    ],
  },
  {
    label: 'Birthday',
    href: '/birthday',
    children: [
      { label: 'Birthday Cake', href: '/birthday-cake' },
      { label: 'Birthday combo Gifts', href: '/birthday-combo-gifts' },
      { label: 'Beauty & Personal Care Gifts', href: '/beauty-and-personal-care-gifts' },
      { label: 'Birthday Candles', href: '/birthday-candles' },
      { label: 'Birthday Balloons', href: '/birthday-balloons' },
      { label: 'Teddy Bear', href: '/teddy-bear' },
      { label: 'Birthday Mug', href: '/birthday-mug' },
      { label: 'Birthday Card', href: '/birthday-card' },
    ],
  },
  {
    label: 'Cake',
    href: '/cake',
    children: [
      { label: "Mr. Baker", href: '/mr-baker-cake' },
      { label: "Cooper's", href: '/coopers-cake' },
      { label: 'Hot Cake', href: '/hot-cake' },
      { label: "King's Cake", href: '/kings-cake' },
      { label: 'Secret Recipe', href: '/secret-recipe' },
      { label: 'Tasty Treat', href: '/tasty-treat' },
      { label: 'Swiss Cake', href: '/swiss-cake' },
      { label: 'Bread & Beyond', href: '/bread-and-beyond' },
    ],
  },
  {
    label: 'Anniversary',
    href: '/anniversary',
    children: [
      { label: 'Anniversary combo gifts', href: '/anniversary-combo-gifts' },
      { label: 'Anniversary cake', href: '/anniversary-cake' },
      { label: 'Anniversary balloons', href: '/anniversary-balloons' },
      { label: 'Anniversary Teddy Bear', href: '/anniversary-teddy-bear' },
      { label: 'Chocolate Bouquet', href: '/chocolate-bouquet' },
    ],
  },
  {
    label: 'Food',
    href: '/food',
    children: [
      { label: 'Fakruddin Biryani', href: '/fakruddin-biryani' },
      { label: 'Star Biryani', href: '/star-biryani' },
      { label: "Sultan Dine's Biryani", href: '/sultan-dines-biryani' },
      { label: 'Kacchi Bhai Biryani', href: '/kacchi-bhai-biryani' },
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

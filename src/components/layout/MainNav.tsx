'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ShoppingCart, ChevronDown } from 'lucide-react'
import { useCart } from '@/components/providers'

export type NavItem = {
  label: string
  href: string
  children?: { label: string; href: string }[]
  image?: string // mega-dropdown left-side image
}

const NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'All Categories', href: '/catalogue' },
  {
    label: 'Flowers',
    href: '/flowers',
    image: '/placeholders/categories/flowers.jpg',
    children: [
      { label: 'Roses in bouquet', href: '/flowers/roses-in-bouquet' },
      { label: 'Luxury Large Rose Arrangements', href: '/flowers/luxury-large-rose-arrangements' },
      { label: 'Roses in vase', href: '/flowers/roses-in-vase' },
      { label: 'Roses in basket', href: '/flowers/roses-in-basket' },
      { label: 'Heart Shaped Roses', href: '/flowers/heart-shaped-roses' },
      { label: 'Imported flowers', href: '/flowers/imported-flowers' },
      { label: 'Exclusive Flower Bouquet', href: '/flowers/exclusive-flower-bouquet' },
      { label: 'Mixed Flower Baskets', href: '/flowers/mixed-flower-baskets' },
      { label: 'Rajanigandha arrangement', href: '/flowers/rajanigandha-arrangement' },
      { label: 'Send Flowers to Bangladesh', href: '/flowers/send-flowers-to-bangladesh' },
      { label: 'Roses With Teddy Bear and Chocolates', href: '/flowers/roses-with-teddy-bear-chocolates' },
      { label: 'Poddo & Dolon Chapa (Seasonal Flowers)', href: '/flowers/poddo-dolon-chapa' },
      { label: 'Online flower shop in Bangladesh', href: '/flowers/online-flower-shop-bangladesh' },
    ],
  },
  {
    label: 'Birthday',
    href: '/birthday',
    image: '/placeholders/categories/birthday.jpg',
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
    image: '/placeholders/categories/cake.jpg',
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
    image: '/placeholders/categories/anniversary.jpg',
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
    image: '/placeholders/categories/food.jpg',
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

// Split a flat list into 2 balanced columns. The first half goes left,
// second half goes right. If odd count, left column gets one more.
function splitColumns<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2)
  return [items.slice(0, mid), items.slice(mid)]
}

export function MainNav() {
  const cart = useCart()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const count = cart.count()

  return (
    <nav className="main-nav" aria-label="Main">
      <div className="main-nav-inner">
        <ul className="main-nav-list">
          {NAV.map((item) => {
            const [col1, col2] = item.children ? splitColumns(item.children) : [[], []]
            return (
              <li
                key={item.label}
                className={`main-nav-item ${item.children ? 'has-dropdown' : ''} ${openMenu === item.label ? 'active' : ''}`}
                onMouseEnter={() => item.children && setOpenMenu(item.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <Link href={item.href} className="main-nav-link">
                  {item.label}
                  {item.children && <ChevronDown size={11} className="nav-caret" />}
                </Link>

                {/* Mega-dropdown — left image + 2-column links, like the reference */}
                {item.children && openMenu === item.label && (
                  <div className="mega-dropdown">
                    <div className="mega-dropdown-inner">
                      {/* Left: category image */}
                      {item.image && (
                        <div className="mega-dropdown-image">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.image} alt={item.label} />
                        </div>
                      )}
                      {/* Right: 2-column link list */}
                      <div className="mega-dropdown-links">
                        <ul className="mega-col">
                          {col1.map((child) => (
                            <li key={child.href}>
                              <Link href={child.href}>{child.label}</Link>
                            </li>
                          ))}
                        </ul>
                        {col2.length > 0 && (
                          <ul className="mega-col">
                            {col2.map((child) => (
                              <li key={child.href}>
                                <Link href={child.href}>{child.label}</Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        <Link href="/cart" className="nav-cart" aria-label="Cart">
          <ShoppingCart size={16} />
          <span>{count} Item{count !== 1 ? 's' : ''}</span>
        </Link>
      </div>
    </nav>
  )
}

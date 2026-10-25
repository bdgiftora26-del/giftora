#!/usr/bin/env node
// Rebuild category tree to match bdgift.com structure + remap products.
// bdgift.com top groups: Flowers, Birthday, Cake, Anniversary, Food, Gift Baskets, Combo Gifts

import { db } from '/home/z/giftora-fresh/src/lib/db.js'

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

// New top-level categories (bdgift.com structure)
const NEW_TREE = [
  {
    name: 'Flowers',
    icon: 'flower',
    children: ['Roses in Bouquet', 'Luxury Large Rose Arrangements', 'Roses in Vase', 'Roses in Basket',
      'Heart Shaped Roses', 'Imported Flowers', 'Exclusive Flower Bouquet', 'Mixed Flower Baskets',
      'Rajanigandha Arrangement', 'Roses With Teddy Bear & Chocolates', 'Send Flowers to Bangladesh'],
  },
  {
    name: 'Birthday',
    icon: 'gift',
    children: ['Birthday Cake', 'Birthday Combo Gifts', 'Beauty & Personal Care Gifts', 'Birthday Candles',
      'Birthday Balloons', 'Teddy Bear', 'Birthday Mug', 'Message In a Bottle', 'Live Plants', 'Birthday Card'],
  },
  {
    name: 'Cake',
    icon: 'cake',
    children: ["Mr. Baker Cake", "Cooper's Cake", 'Hot Cake', "King's Cake", 'Secret Recipe',
      'Tasty Treat Cake', 'Well Food Cake', 'California Cake', 'Swiss Cake', 'Bread & Beyond',
      'Mini Cake at Low Price', 'Cake Storys', 'Exclusive Design Cupcake', 'Unique & Fondant Cake',
      'Unique Design Chocolate Cake', 'Customized Cake', 'Chocolate Cake'],
  },
  {
    name: 'Anniversary',
    icon: 'heart',
    children: ['Anniversary Combo Gifts', 'Anniversary Cake', 'Anniversary Balloons',
      'Anniversary Candles', 'Anniversary Teddy Bear', 'Chocolate Bouquet'],
  },
  {
    name: 'Food',
    icon: 'food',
    children: ['Fakruddin Biryani', 'Star Biryani', "Sultan Dine's Biryani", 'Kacchi Bhai Biryani',
      'Chinese & Thai Food', 'Rice Items', 'Groceries'],
  },
  { name: 'Gift Baskets', icon: 'gift', children: [] },
  { name: 'Combo Gifts', icon: 'gift', children: [] },
  { name: 'Teddy Bear & Dolls', icon: 'teddy', children: [] },
  { name: 'Chocolates', icon: 'chocolate', children: [] },
  { name: 'Home & Table Decoration', icon: 'decor', children: [] },
  { name: 'Greeting Cards', icon: 'card', children: [] },
  { name: 'Live Plants', icon: 'plant', children: [] },
]

// Map bdgift category slug → new (parent, child) names
const BDGIFT_TO_NEW = {
  'c182-flower': ['Flowers', 'Roses in Bouquet'],
  'c120-f1-roses-in-bouquet': ['Flowers', 'Roses in Bouquet'],
  'c274-luxury-large-rose-arrangements': ['Flowers', 'Luxury Large Rose Arrangements'],
  'c126-f3-roses-in-vase': ['Flowers', 'Roses in Vase'],
  'c127-f4-roses-in-basket': ['Flowers', 'Roses in Basket'],
  'c116-heart-shaped-roses-and-message-hearts': ['Flowers', 'Heart Shaped Roses'],
  'c117-f6-imported-flowers-lily-gerbera-orchid-and-carnation': ['Flowers', 'Imported Flowers'],
  'c235-exclusive-flower-bouquet': ['Flowers', 'Exclusive Flower Bouquet'],
  'c128-f5-mixed-flower-baskets': ['Flowers', 'Mixed Flower Baskets'],
  'c215-rajanigandha-arrangement': ['Flowers', 'Rajanigandha Arrangement'],
  'c121-f7-roses-with-teddy-bear-and-chocolates': ['Flowers', 'Roses With Teddy Bear & Chocolates'],
  'c10-send-flowers-to-bangladesh': ['Flowers', 'Send Flowers to Bangladesh'],
  'c182-online-flower-shop-in-bangladesh': ['Flowers', 'Send Flowers to Bangladesh'],
  'c134-send-birthday-gifts-to-bangladesh': ['Birthday', 'Birthday Combo Gifts'],
  'c183-cake': ['Cake', 'Chocolate Cake'],
  'c142-c5-mr-baker-cake': ['Cake', 'Mr. Baker Cake'],
  'c129-c4-coopers-cake': ['Cake', "Cooper's Cake"],
  'c144-c7-hot-cake': ['Cake', 'Hot Cake'],
  'c118-c3-kings-cake': ['Cake', "King's Cake"],
  'c265-secret-recipe': ['Cake', 'Secret Recipe'],
  'c168-c10-tasty-treat-cake': ['Cake', 'Tasty Treat Cake'],
  'c164-c9-well-food-cake': ['Cake', 'Well Food Cake'],
  'c163-c8-california-cake': ['Cake', 'California Cake'],
  'c25-c01-swiss-cake': ['Cake', 'Swiss Cake'],
  'c211-bread-and-beyond-bread': ['Cake', 'Bread & Beyond'],
  'c270-mini-cake-at-low-price': ['Cake', 'Mini Cake at Low Price'],
  'c269-cake-storys': ['Cake', 'Cake Storys'],
  'c268-exclusive-design-cupcake': ['Cake', 'Exclusive Design Cupcake'],
  'c267-unique-fondant-cake': ['Cake', 'Unique & Fondant Cake'],
  'c266-unique-design-chocolate-cake': ['Cake', 'Unique Design Chocolate Cake'],
  'c271-customized-cake': ['Cake', 'Customized Cake'],
  'c28-chocolate-cake': ['Cake', 'Chocolate Cake'],
  'c143-anniversary': ['Anniversary', 'Anniversary Combo Gifts'],
  'c273-anniversary-cake': ['Anniversary', 'Anniversary Cake'],
  'c275-anniversary-balloons': ['Anniversary', 'Anniversary Balloons'],
  'c276-anniversary-candles': ['Anniversary', 'Anniversary Candles'],
  'c277-anniversary-teddy-bear': ['Anniversary', 'Anniversary Teddy Bear'],
  'c278-chocolate-bouquet': ['Anniversary', 'Chocolate Bouquet'],
  'c130-food': ['Food', 'Rice Items'],
  'c279-fakruddin-biryani': ['Food', 'Fakruddin Biryani'],
  'c280-star-biryani': ['Food', 'Star Biryani'],
  'c281-sultan-dines-biryani': ['Food', "Sultan Dine's Biryani"],
  'c282-kacchi-bhai-biryani': ['Food', 'Kacchi Bhai Biryani'],
  'c263-gift-baskets': ['Gift Baskets', null],
  'c262-combo-gifts': ['Combo Gifts', null],
  'c23-teddy-bear-and-dolls': ['Teddy Bear & Dolls', null],
  'c14-balloons': ['Birthday', 'Birthday Balloons'],
  'c102-candles': ['Birthday', 'Birthday Candles'],
  'c101-decorated-mug': ['Birthday', 'Birthday Mug'],
  'c19-message-in-a-bottle': ['Birthday', 'Message In a Bottle'],
  'c100-live-plants': ['Live Plants', null],
  'c21-greeting-cards': ['Greeting Cards', null],
  'c35-home-and-table-decoration-gifts': ['Home & Table Decoration', null],
  'c125-beauty-and-personal-care-gifts': ['Birthday', 'Beauty & Personal Care Gifts'],
  'c22-chocolate': ['Chocolates', null],
}

async function main() {
  console.log('Building new category tree (bdgift.com structure)...')

  // Create new top-level categories + children
  const catMap = new Map() // 'Parent>Child' → categoryId
  for (const top of NEW_TREE) {
    const topSlug = slugify(top.name)
    let topCat = await db.category.findFirst({ where: { slug: topSlug, parentId: null } })
    if (!topCat) {
      topCat = await db.category.create({
        data: {
          slug: topSlug,
          icon: top.icon,
          showInSidebar: true,
          sortOrder: NEW_TREE.indexOf(top) + 1,
          i18n: { create: [
            { locale: 'en', name: top.name },
            { locale: 'bn', name: top.name },
          ] },
        },
      })
    }
    catMap.set(top.name, topCat.id)

    for (const childName of top.children) {
      const childSlug = slugify(childName)
      let childCat = await db.category.findFirst({ where: { slug: childSlug, parentId: topCat.id } })
      if (!childCat) {
        childCat = await db.category.create({
          data: {
            slug: childSlug,
            parentId: topCat.id,
            icon: top.icon,
            showInSidebar: false,
            sortOrder: top.children.indexOf(childName) + 1,
            i18n: { create: [
              { locale: 'en', name: childName },
              { locale: 'bn', name: childName },
            ] },
          },
        })
      }
      catMap.set(top.name + '>' + childName, childCat.id)
    }
  }
  console.log('Categories created:', catMap.size)

  // Remap BDG products to new categories
  const products = await db.product.findMany({
    where: { sku: { startsWith: 'BDG-' } },
    include: { categories: true },
  })
  // Load catalog once into a map
  const catalog = JSON.parse(require('fs').readFileSync('/tmp/bdgift_catalog.json', 'utf8'))
  const catalogMap = new Map(catalog.map(c => [c.id, c]))
  console.log(`Remapping ${products.length} products...`)

  let remapped = 0
  for (const p of products) {
    const bdgId = p.sku.replace('BDG-', '')
    const prodData = catalogMap.get(bdgId)
    if (!prodData) { continue }

    const mapping = BDGIFT_TO_NEW[prodData.categories[0]]
    if (!mapping) { continue }

    const [parentName, childName] = mapping
    let targetCatId
    if (childName) {
      targetCatId = catMap.get(parentName + '>' + childName)
    } else {
      targetCatId = catMap.get(parentName)
    }
    if (!targetCatId) { continue }

    // Remove old category associations + add new
    try {
      await db.productCategory.deleteMany({ where: { productId: p.id } })
      await db.productCategory.create({ data: { productId: p.id, categoryId: targetCatId } })
      remapped++
    } catch (e) {
      console.log(`  skip ${p.sku}: ${e.message?.slice(0, 60)}`)
    }
    if (remapped % 30 === 0) console.log(`  ${remapped}/${products.length}`)
  }
  console.log(`Remapped ${remapped} products`)

  // Deactivate old top-level categories (keep new ones active)
  const newTopSlugs = NEW_TREE.map(t => slugify(t.name))
  await db.category.updateMany({
    where: { parentId: null, slug: { notIn: newTopSlugs } },
    data: { showInSidebar: false, isActive: false },
  })

  console.log('Done! New category structure:')
  const tops = await db.category.findMany({ where: { parentId: null, isActive: true }, orderBy: { sortOrder: 'asc' }, include: { children: true, i18n: true } })
  for (const t of tops) {
    const name = t.i18n[0]?.name || t.slug
    console.log(`  ${name} (${t.children.length} children)`)
  }
  process.exit(0)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })

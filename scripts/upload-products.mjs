#!/usr/bin/env node
// Upload scraped bdgift.com products to our Supabase DB.
// Maps bdgift categories to our existing category slugs.

import { db } from '/home/z/giftora-fresh/src/lib/db.js'

const CATALOG = '/tmp/bdgift_catalog.json'
const USD_TO_BDT = 110 // approx rate

// Map bdgift category slug → our category slug
const CAT_MAP = {
  'c182-flower': 'fresh-flower-and-roses',
  'c120-f1-roses-in-bouquet': 'fresh-flower-and-roses',
  'c274-luxury-large-rose-arrangements': 'fresh-flower-and-roses',
  'c126-f3-roses-in-vase': 'fresh-flower-and-roses',
  'c127-f4-roses-in-basket': 'fresh-flower-and-roses',
  'c116-heart-shaped-roses-and-message-hearts': 'fresh-flower-and-roses',
  'c117-f6-imported-flowers-lily-gerbera-orchid-and-carnation': 'fresh-flower-and-roses',
  'c235-exclusive-flower-bouquet': 'fresh-flower-and-roses',
  'c128-f5-mixed-flower-baskets': 'fresh-flower-and-roses',
  'c215-rajanigandha-arrangement': 'fresh-flower-and-roses',
  'c121-f7-roses-with-teddy-bear-and-chocolates': 'fresh-flower-and-roses',
  'c10-send-flowers-to-bangladesh': 'fresh-flower-and-roses',
  'c182-online-flower-shop-in-bangladesh': 'fresh-flower-and-roses',
  'c134-send-birthday-gifts-to-bangladesh': 'gifts-and-toys-for-kids',
  'c183-cake': 'cake-from-well-food',
  'c142-c5-mr-baker-cake': 'cakes-from-mr-baker',
  'c129-c4-coopers-cake': 'cake-from-coopers',
  'c144-c7-hot-cake': 'shumis-hot-cake',
  'c118-c3-kings-cake': 'kings-confectionery-cakes',
  'c265-secret-recipe': 'special-cake-and-pastry',
  'c168-c10-tasty-treat-cake': 'special-cake-and-pastry',
  'c164-c9-well-food-cake': 'cake-from-well-food',
  'c163-c8-california-cake': 'special-cake-and-pastry',
  'c25-c01-swiss-cake': 'special-cake-and-pastry',
  'c211-bread-and-beyond-bread': 'bread-and-beyond-cakes',
  'c270-mini-cake-at-low-price': 'special-cake-and-pastry',
  'c269-cake-storys': 'special-cake-and-pastry',
  'c268-exclusive-design-cupcake': 'special-cake-and-pastry',
  'c267-unique-fondant-cake': 'special-cake-and-pastry',
  'c266-unique-design-chocolate-cake': 'special-cake-and-pastry',
  'c271-customized-cake': 'special-cake-and-pastry',
  'c143-anniversary': 'wedding-gifts-in-bangladesh',
  'c273-anniversary-cake': 'wedding-gifts-in-bangladesh',
  'c275-anniversary-balloons': 'wedding-gifts-in-bangladesh',
  'c276-anniversary-candles': 'wedding-gifts-in-bangladesh',
  'c277-anniversary-teddy-bear': 'teddy-bear-and-soft-toys',
  'c278-chocolate-bouquet': 'chocolate-ice-cream-cookies',
  'c130-food': 'food-court',
  'c279-fakruddin-biryani': 'food-court',
  'c280-star-biryani': 'food-court',
  'c281-sultan-dines-biryani': 'food-court',
  'c282-kacchi-bhai-biryani': 'food-court',
  'c263-gift-baskets': 'gift-packages-for-bd',
  'c262-combo-gifts': 'gift-packages-for-bd',
  'c23-teddy-bear-and-dolls': 'teddy-bear-and-soft-toys',
  'c14-balloons': 'gifts-and-toys-for-kids',
  'c102-candles': 'gifts-and-toys-for-kids',
  'c101-decorated-mug': 'home-decor-and-appliance',
  'c19-message-in-a-bottle': 'gifts-and-toys-for-kids',
  'c100-live-plants': 'aquarium-plant-pet-hobby-gifts',
  'c21-greeting-cards': 'greetings-card',
  'c35-home-and-table-decoration-gifts': 'home-decor-and-appliance',
  'c125-beauty-and-personal-care-gifts': 'gifts-and-dress-for-her',
  'c22-chocolate': 'chocolate-ice-cream-cookies',
  'c28-chocolate-cake': 'cake-from-well-food',
}

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

async function main() {
  const products = JSON.parse(require('fs').readFileSync(CATALOG, 'utf8'))
  console.log(`Uploading ${products.length} products to DB...`)

  // Get all our categories
  const ourCats = await db.category.findMany({ select: { id: true, slug: true } })
  const catBySlug = new Map(ourCats.map(c => [c.slug, c.id]))

  // Delete old scraped products (keep seed products)
  // Actually, just add new ones — dedupe by sku
  let added = 0, skipped = 0
  for (const p of products) {
    const sku = 'BDG-' + p.id
    const existing = await db.product.findUnique({ where: { sku } }).catch(() => null)
    if (existing) { skipped++; continue }

    const slug = slugify(p.name) || p.slug
    const uniqueSlug = await ensureUniqueSlug(slug)
    const priceBdt = Math.round(p.priceUsd * USD_TO_BDT)
    const isCake = p.name.toLowerCase().includes('cake') || p.categories.some(c => c.includes('cake'))
    const catSlug = CAT_MAP[p.categories[0]] || 'gift-packages-for-bd'
    const catId = catBySlug.get(catSlug)

    if (!catId) { console.log('  skip (no cat):', p.name, catSlug); skipped++; continue }

    try {
      const product = await db.product.create({
        data: {
          sku,
          slug: uniqueSlug,
          type: 'PHYSICAL',
          priceBdt,
          stockMode: 'UNLIMITED',
          isCake,
          isActive: true,
          i18n: {
            create: [
              { locale: 'en', name: p.name, shortDescription: p.shortDescription || '', description: p.description || p.name + ' — gift delivery in Bangladesh.' },
              { locale: 'bn', name: p.name, shortDescription: '', description: p.name + ' — বাংলাদেশে উপহার ডেলিভারি।' },
            ],
          },
          images: { create: { url: p.localImage, alt: p.name } },
          categories: catId ? { create: { categoryId: catId } } : undefined,
        },
      })
      added++
      if (added % 20 === 0) console.log(`  added ${added}/${products.length}`)
    } catch (e) {
      console.error('  error:', p.name, e.message?.slice(0, 80))
      skipped++
    }
  }

  console.log(`\n✅ Added: ${added}, Skipped: ${skipped}`)
  const total = await db.product.count()
  console.log(`Total products in DB: ${total}`)
  process.exit(0)
}

async function ensureUniqueSlug(slug) {
  let s = slug
  let i = 1
  while (await db.product.findUnique({ where: { slug: s }, select: { id: true } })) {
    s = `${slug}-${i++}`
  }
  return s
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })

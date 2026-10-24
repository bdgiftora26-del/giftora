#!/usr/bin/env node
// Fast scraper: extract product name, price, image from category listing pages.
// No need to visit each product page — all data is in the listing HTML.
// Input: re-fetches category pages (cached from first scraper run)
// Output: /tmp/bdgift_catalog.json

import fs from 'node:fs'
import { execSync } from 'node:child_process'

const BASE = 'https://www.bdgift.com'
const OUT = '/tmp/bdgift_catalog.json'

const CATEGORY_SLUGS = [
  'c182-flower', 'c120-f1-roses-in-bouquet', 'c274-luxury-large-rose-arrangements',
  'c126-f3-roses-in-vase', 'c127-f4-roses-in-basket', 'c116-heart-shaped-roses-and-message-hearts',
  'c117-f6-imported-flowers-lily-gerbera-orchid-and-carnation', 'c235-exclusive-flower-bouquet',
  'c128-f5-mixed-flower-baskets', 'c215-rajanigandha-arrangement',
  'c121-f7-roses-with-teddy-bear-and-chocolates', 'c10-send-flowers-to-bangladesh',
  'c182-online-flower-shop-in-bangladesh', 'c134-send-birthday-gifts-to-bangladesh',
  'c183-cake', 'c142-c5-mr-baker-cake', 'c129-c4-coopers-cake', 'c144-c7-hot-cake',
  'c118-c3-kings-cake', 'c265-secret-recipe', 'c168-c10-tasty-treat-cake',
  'c164-c9-well-food-cake', 'c163-c8-california-cake', 'c25-c01-swiss-cake',
  'c211-bread-and-beyond-bread', 'c270-mini-cake-at-low-price', 'c269-cake-storys',
  'c268-exclusive-design-cupcake', 'c267-unique-fondant-cake', 'c266-unique-design-chocolate-cake',
  'c271-customized-cake', 'c143-anniversary', 'c273-anniversary-cake', 'c275-anniversary-balloons',
  'c276-anniversary-candles', 'c277-anniversary-teddy-bear', 'c278-chocolate-bouquet',
  'c130-food', 'c279-fakruddin-biryani', 'c280-star-biryani', 'c281-sultan-dines-biryani',
  'c282-kacchi-bhai-biryani', 'c263-gift-baskets', 'c262-combo-gifts',
  'c23-teddy-bear-and-dolls', 'c14-balloons', 'c102-candles', 'c101-decorated-mug',
  'c19-message-in-a-bottle', 'c100-live-plants', 'c21-greeting-cards', 'c35-home-and-table-decoration-gifts',
  'c125-beauty-and-personal-care-gifts', 'c22-chocolate', 'c28-chocolate-cake',
]

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

async function fetchPage(url) {
  const tmpFile = `/tmp/bdg_cat_${Date.now()}_${Math.random().toString(36).slice(2,6)}.json`
  try {
    execSync(`z-ai function -n page_reader -a '${JSON.stringify({ url }).replace(/'/g, "'\\''")}' -o ${tmpFile}`, {
      stdio: 'pipe', timeout: 45000,
    })
    const data = JSON.parse(fs.readFileSync(tmpFile, 'utf8'))
    return data.data?.html || ''
  } catch {
    return ''
  } finally {
    try { fs.unlinkSync(tmpFile) } catch {}
  }
}

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&lsquo;/g, "'").replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').trim()
}

function extractProducts(html, catSlug) {
  // Pattern: <a href="products/ID-SLUG/"><img class="product_thumbnail" src="IMG" alt="NAME"></a>
  // ... <p class="green-caption">NAME</p> <span class="price">US$PRICE</span>
  const products = []
  const cardRegex = /<a\s+href="products\/(\d+)-([^"\/]+)\/?"[^>]*>\s*<img\s+class="product_thumbnail"\s+src="([^"]+)"\s+alt="([^"]*)"[^>]*><\/a>[\s\S]{0,400}?<p\s+class="green-caption">([^<]*)<\/p>\s*<span\s+class="price">([^<]*)<\/span>/gi
  let match
  while ((match = cardRegex.exec(html)) !== null) {
    const [, id, slug, imgPath, altName, captionName, priceStr] = match
    const name = decode(captionName || altName || slug.replace(/-/g, ' '))
    const priceMatch = priceStr.match(/US\$\s*([\d,]+\.?\d*)/i)
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null
    // Convert thumb _s to big _b
    const bigImg = imgPath.replace(/_s\.(jpg|jpeg|png|webp)$/i, '_b.$1')
    products.push({
      id,
      slug,
      name,
      priceUsd: price,
      image: `${BASE}/${bigImg}`,
      imageThumb: `${BASE}/${imgPath}`,
      categorySlug: catSlug,
    })
  }
  return products
}

async function main() {
  const allProducts = new Map()

  console.log(`Fetching ${CATEGORY_SLUGS.length} category pages (with product data)...`)
  for (let i = 0; i < CATEGORY_SLUGS.length; i++) {
    const cat = CATEGORY_SLUGS[i]
    const url = `${BASE}/products/${cat}/`
    process.stdout.write(`[${i + 1}/${CATEGORY_SLUGS.length}] ${cat} ... `)
    const html = await fetchPage(url)
    const products = extractProducts(html, cat)
    for (const p of products) {
      if (!allProducts.has(p.id)) {
        allProducts.set(p.id, { ...p, categories: [cat] })
      } else {
        allProducts.get(p.id).categories.push(cat)
      }
    }
    console.log(`${products.length} products (total: ${allProducts.size})`)
    await sleep(600)
  }

  const arr = [...allProducts.values()]
  // Filter: only products with price > 0 and image
  const valid = arr.filter((p) => p.priceUsd && p.priceUsd > 0 && p.image)
  fs.writeFileSync(OUT, JSON.stringify(valid, null, 2))
  console.log(`\n✅ Saved ${valid.length} valid products (with price+image) to ${OUT}`)
  console.log(`   (filtered from ${arr.length} total)`)
  // Stats
  const byPrice = valid.reduce((acc, p) => { acc[p.priceUsd < 20 ? 'cheap' : p.priceUsd < 50 ? 'mid' : 'high'] = (acc[p.priceUsd < 20 ? 'cheap' : p.priceUsd < 50 ? 'mid' : 'high']||0)+1; return acc }, {})
  console.log('Price distribution:', byPrice)
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1) })

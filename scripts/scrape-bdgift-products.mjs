#!/usr/bin/env node
// Scrape bdgift.com: collect ALL product URLs from ALL category pages.
// Outputs /tmp/bdgift_products.json with unique product list.

import fs from 'node:fs'

const BASE = 'https://www.bdgift.com'
const OUT = '/tmp/bdgift_products.json'

// All product category paths (from mega menu analysis)
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

async function readPage(url) {
  const res = await fetch('https://z-ai-functions-url.local/page_reader', { method: 'POST' }).catch(() => null)
  // Use the z-ai CLI via child_process instead
  return null
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

// Use z-ai CLI to fetch a URL (handles Cloudflare bypass via their service)
async function fetchPage(url) {
  const { execSync } = await import('node:child_process')
  const tmpFile = `/tmp/bdg_fetch_${Date.now()}.json`
  try {
    execSync(`z-ai function -n page_reader -a '${JSON.stringify({ url }).replace(/'/g, "'\\''")}' -o ${tmpFile}`, {
      stdio: 'pipe',
      timeout: 60000,
    })
    const data = JSON.parse(fs.readFileSync(tmpFile, 'utf8'))
    return data.data?.html || ''
  } catch (e) {
    console.error('fetch error for', url, e.message?.slice(0, 100))
    return ''
  } finally {
    try { fs.unlinkSync(tmpFile) } catch {}
  }
}

function extractProducts(html, catSlug) {
  const products = [...html.matchAll(/href="products\/(\d+)-([^"\/]+)\/?"/g)].map((m) => ({
    id: m[1],
    slug: m[2],
    url: `${BASE}/products/${m[1]}-${m[2]}/`,
    categorySlug: catSlug,
  }))
  // dedupe by id
  return [...new Map(products.map((p) => [p.id, p])).values()]
}

async function main() {
  const allProducts = new Map()

  console.log(`Fetching ${CATEGORY_SLUGS.length} category pages...`)
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
    console.log(`${products.length} products (total unique: ${allProducts.size})`)
    await sleep(800) // be polite
  }

  const arr = [...allProducts.values()]
  fs.writeFileSync(OUT, JSON.stringify(arr, null, 2))
  console.log(`\n✅ Saved ${arr.length} unique products to ${OUT}`)
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})

#!/usr/bin/env node
// Scrape product details from bdgift.com product pages.
// Input: /tmp/bdgift_products.json (list of product URLs)
// Output: /tmp/bdgift_product_details.json (with name, price, images, description)

import fs from 'node:fs'
import { execSync } from 'node:child_process'

const INPUT = '/tmp/bdgift_products.json'
const OUTPUT = '/tmp/bdgift_product_details.json'
const BASE = 'https://www.bdgift.com'

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

async function fetchPage(url) {
  const tmpFile = `/tmp/bdg_pd_${Date.now()}_${Math.random().toString(36).slice(2,6)}.json`
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

function stripTags(s) {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractDetails(html, product) {
  if (!html) return null

  // Product name — from title tag (most reliable)
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
  let name = titleMatch?.[1]?.trim() || product.slug.replace(/-/g, ' ')
  // Clean common suffixes
  name = name.replace(/\s*[-|]\s*BDGift.*$/i, '').replace(/\s*-\s*Send.*$/i, '').trim()

  // Price — look for US$ pattern
  const priceMatch = html.match(/US\$\s*([\d,]+\.?\d*)/i)
  const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null

  // Product images — pp/ folder, prefer _b (big) versions, dedupe
  const imgMatches = [...html.matchAll(/src="(pp\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)].map((m) => m[1])
  const imgs = [...new Set(imgMatches)]
    .filter((p) => !p.includes('sideimage') && !p.includes('homepage') && !p.includes('banner'))
    .map((p) => `${BASE}/${p}`)
  // Also catch absolute image URLs
  const absImgs = [...html.matchAll(/src="(https?:\/\/[^"]*bdgift[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)].map((m) => m[1])
  const allImgs = [...new Set([...imgs, ...absImgs])].slice(0, 5)

  // Description — extract <p> blocks with substantial content (the product description)
  const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => stripTags(m[1]))
    .filter((t) => t.length > 40 && t.length < 600)
    .filter((t) => !t.match(/^(copyright|all rights|powered|home|login|register|shopping)/i))
    .filter((t) => !t.includes('function(') && !t.includes('var '))
  // Take first 2 unique paragraphs as description
  const descParas = [...new Set(paras)].slice(0, 2)
  const description = descParas.join('\n\n')

  return {
    ...product,
    name,
    priceUsd: price,
    images: allImgs,
    description,
    shortDescription: descParas[0]?.slice(0, 150) || '',
  }
}

async function main() {
  const products = JSON.parse(fs.readFileSync(INPUT, 'utf8'))

  // Load existing progress (resume support)
  let results = []
  if (fs.existsSync(OUTPUT)) {
    results = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'))
    console.log(`Resuming: ${results.length} already scraped`)
  }
  const doneIds = new Set(results.map((r) => r.id))

  const remaining = products.filter((p) => !doneIds.has(p.id))
  console.log(`Total: ${products.length}, already done: ${doneIds.size}, remaining: ${remaining.length}\n`)

  const BATCH = 50
  for (let i = 0; i < remaining.length; i++) {
    const p = remaining[i]
    process.stdout.write(`[${doneIds.size + i + 1}/${products.length}] ${p.id} ${p.slug.slice(0, 30)}... `)
    const html = await fetchPage(p.url)
    const details = extractDetails(html, p)
    if (details) {
      results.push(details)
      console.log(`${details.name?.slice(0, 40)} | $${details.priceUsd || '?'} | ${details.images.length} imgs`)
    } else {
      console.log('FAILED (no html)')
    }
    // Save progress every BATCH
    if ((i + 1) % BATCH === 0) {
      fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2))
      console.log(`  --- saved ${results.length} ---`)
    }
    await sleep(400)
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2))
  console.log(`\n✅ Saved ${results.length} product details to ${OUTPUT}`)
  // Stats
  const withPrice = results.filter((r) => r.priceUsd && r.priceUsd > 0).length
  const withImg = results.filter((r) => r.images.length > 0).length
  const withDesc = results.filter((r) => r.description.length > 50).length
  console.log(`Stats: ${withPrice} with price, ${withImg} with images, ${withDesc} with description`)
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1) })

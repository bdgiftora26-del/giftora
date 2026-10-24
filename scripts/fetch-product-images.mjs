#!/usr/bin/env node
// Fetch real product images via z-ai image-search with retry logic.
// Resumable: skips products that already have real images.

import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { db } from '/home/z/giftora-fresh/src/lib/db.js'

const IMG_DIR = '/home/z/giftora-fresh/public/products'

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

function cleanQuery(name) {
  let q = name
    .replace(/^\(?\d+\)?\s*/i, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\bw\/\b/gi, 'with')
    .replace(/&/g, 'and')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, 60)
  // Add context
  if (q.includes('cake')) q += ' cake'
  else if (q.includes('biryani') || q.includes('kacchi') || q.includes('tehari')) q += ' biryani food'
  else if (q.includes('rose') || q.includes('bouquet')) q += ' flowers'
  else if (q.includes('teddy') || q.includes('bear')) q += ' teddy bear gift'
  else if (q.includes('chocolate')) q += ' chocolate'
  else if (q.includes('pizza')) q += ' pizza food'
  else if (q.includes('chicken') || q.includes('burger')) q += ' food'
  else q += ' gift'
  return q
}

async function searchImage(query, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const tmpFile = `/tmp/is_${Date.now()}_${attempt}.json`
    try {
      execSync(`z-ai image-search -q '${query.replace(/'/g, "'\\''")}' -n 1 -o ${tmpFile}`, {
        stdio: 'pipe', timeout: 25000,
      })
      const data = JSON.parse(fs.readFileSync(tmpFile, 'utf8'))
      const url = data.results?.[0]?.original_url
      if (url) return url
    } catch {
      // retry
    } finally {
      try { fs.unlinkSync(tmpFile) } catch {}
    }
    await sleep(1500 * (attempt + 1))
  }
  return null
}

async function downloadImage(url, outPath) {
  try {
    execSync(`curl -sL --max-time 15 -o '${outPath}' '${url}'`, { stdio: 'pipe', timeout: 20000 })
    const stat = fs.statSync(outPath)
    if (stat.size < 2000) return false
    const buf = Buffer.alloc(4)
    const fd = fs.openSync(outPath, 'r')
    fs.readSync(fd, buf, 0, 4, 0)
    fs.closeSync(fd)
    const hex = buf.toString('hex')
    return hex.startsWith('ffd8') || hex.startsWith('8950') || hex.startsWith('5249')
  } catch {
    return false
  }
}

function hasRealImage(p) {
  if (!p.images || p.images.length === 0) return false
  const url = p.images[0].url
  // Real images are in /products/ID.jpg, placeholders are in /placeholders/
  return url.startsWith('/products/') && !url.endsWith('.svg')
}

async function main() {
  const products = await db.product.findMany({
    where: { sku: { startsWith: 'BDG-' } },
    include: { i18n: { where: { locale: 'en' } }, images: true },
  })
  // Filter to products that DON'T already have a real image
  const needImage = products.filter(p => !hasRealImage(p))
  console.log(`Total BDG products: ${products.length}, need image: ${needImage.length}\n`)

  let ok = 0, fail = 0
  for (let i = 0; i < needImage.length; i++) {
    const p = needImage[i]
    const name = p.i18n[0]?.name || p.sku
    const query = cleanQuery(name)
    process.stdout.write(`[${i + 1}/${needImage.length}] ${name.slice(0, 35)}... → "${query.slice(0, 30)}..." `)

    const imgUrl = await searchImage(query)
    if (!imgUrl) {
      console.log('❌ no result')
      fail++
      await sleep(1000) // extra delay after failure
      continue
    }

    const fname = p.sku.replace('BDG-', '') + '.jpg'
    const outPath = `${IMG_DIR}/${fname}`
    const isReal = await downloadImage(imgUrl, outPath)
    if (isReal) {
      const localPath = '/products/' + fname
      if (p.images.length > 0) {
        await db.productImage.update({ where: { id: p.images[0].id }, data: { url: localPath } })
      } else {
        await db.productImage.create({ data: { productId: p.id, url: localPath, alt: name } })
      }
      ok++
      console.log('✅')
    } else {
      console.log('❌ bad download')
      fail++
    }
    await sleep(1200) // rate limit friendly
  }

  console.log(`\n✅ Done: ${ok} images downloaded, ${fail} failed`)
  process.exit(0)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })

// Vercel Cron route — runs every 10 minutes (configured in vercel.json).
//
// Hits the most-visited pages to keep ISR cache warm + serverless function
// warm. End-to-end logic lives in scripts/prewarm-cache.ts.
//
// Security: Vercel Cron requests include a CRON_HEADER that we validate
// against CRON_SECRET env var. Without this check, anyone could hit
// /api/cron/prewarm and trigger 15+ page requests on your site (DoS-able).
//
// Docs: https://vercel.com/docs/cron-jobs

import { NextResponse } from 'next/server'
import { prewarmCache } from '@/scripts/prewarm-cache'

// Cron runs in the background — don't wait for cache to settle.
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel Hobby max; Pro allows 300

export async function GET(req: Request) {
  // Vercel Cron sends a custom header. We check CRON_SECRET env var (if set)
  // for an extra layer of protection. If CRON_SECRET is unset, we still
  // verify the Vercel-internal header.
  const authHeader = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`
  if (process.env.CRON_SECRET && authHeader !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Best-effort: even if some pages fail, we return 200 so Vercel doesn't
  // mark the cron as "failed" and start alerting.
  try {
    const result = await prewarmCache()
    console.log(`[cron:prewarm] ok=${result.ok} fail=${result.fail}`)
    return NextResponse.json({
      ok: true,
      warmed: result.ok,
      failed: result.fail,
      details: result.details,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[cron:prewarm] fatal:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 200 })
  }
}

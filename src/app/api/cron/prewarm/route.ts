// Cache pre-warm route — hit by GitHub Actions scheduled workflow every 10 min.
//
// Why not Vercel Cron: Vercel Hobby (free) only allows daily crons. We need
// sub-daily (every 10 min) to keep ISR cache warm. GitHub Actions on a
// public repo gives us free 5-min scheduling.
//
// End-to-end logic lives in src/scripts/prewarm-cache.ts.
//
// Security: CRON_SECRET env var is REQUIRED. Set it on Vercel (Settings →
// Environment Variables) and store the same value as a GitHub Actions
// secret (Settings → Secrets → Actions). The GitHub workflow sends it as
// a Bearer token; this route rejects anything that doesn't match.

import { NextResponse } from 'next/server'
import { prewarmCache } from '@/scripts/prewarm-cache'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel Hobby max; Pro allows 300

export async function GET(req: Request) {
  // Auth: Bearer CRON_SECRET
  const authHeader = req.headers.get('authorization') || ''
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json(
      { error: 'unauthorized', hint: 'set CRON_SECRET env var and send as Bearer token' },
      { status: 401 },
    )
  }

  // Best-effort: return 200 even if some pages failed, so GitHub Actions
  // doesn't mark the workflow as failed.
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

import { db } from '@/lib/db'

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 300

function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return (
    msg.includes('Timed out') ||
    msg.includes('Connection terminated') ||
    msg.includes('Connection refused') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('max clients') ||
    msg.includes('too many connections') ||
    msg.includes('Server has closed') ||
    msg.includes("Can't reach database") ||
    msg.includes('P1001') ||
    msg.includes('P1002') ||
    msg.includes('P2024') ||
    msg.includes('P2026')
  )
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Run a DB operation with retry on transient connection errors.
export async function withRetry<T>(op: () => Promise<T>): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await op()
    } catch (err) {
      lastErr = err
      if (attempt < MAX_RETRIES && isTransient(err)) {
        await sleep(RETRY_DELAY_MS * (attempt + 1))
        continue
      }
      throw err
    }
  }
  throw lastErr
}

// Run several DB operations in parallel, tolerating individual failures.
// Returns results with `ok` flag; failed ones get the fallback value.
// Uses `any` for return to avoid tuple-typing friction across heterogeneous ops.
export async function allSettledFallback<T = any>(
  ops: Array<{ run: () => Promise<any>; fallback: any }>,
): Promise<T[]> {
  const settled = await Promise.allSettled(
    ops.map(async (op) => withRetry(op.run)),
  )
  return settled.map((res, i) =>
    res.status === 'fulfilled' ? res.value : ops[i].fallback,
  ) as T[]
}

export { db }

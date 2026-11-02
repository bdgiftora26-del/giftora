import { PrismaClient } from '@prisma/client'

// Ensure the Supabase pooler URL has a generous pool_timeout. The default
// is 10s, but the Supabase pooler (PgBouncer) limits us to 1 connection on
// the free tier. When the home page runs 9 parallel queries through that
// single connection, the queue can exceed 10s and time out (Prisma error
// P2024). Bumping to 30s gives plenty of headroom.
//
// We append `pool_timeout=30` only if the URL doesn't already specify one
// (don't override an explicit user choice).
function withPoolTimeout(url: string | undefined): string | undefined {
  if (!url) return url
  if (url.includes('pool_timeout=')) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}pool_timeout=30`
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const datasourceUrl = withPoolTimeout(process.env.DATABASE_URL)

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    ...(datasourceUrl
      ? { datasources: { db: { url: datasourceUrl } } }
      : {}),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

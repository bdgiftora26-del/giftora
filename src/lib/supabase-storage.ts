// Supabase Storage helper — uploads files via the REST API (no SDK needed).
//
// Why: Vercel's filesystem is read-only at runtime, so saving uploaded images
// to /public/uploads/ doesn't work in production. Supabase Storage gives us a
// persistent, CDN-backed, publicly-accessible home for all user-uploaded images
// (banners, product images, etc.). The project already uses Supabase for the
// DB, so this reuses the same credentials.

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BUCKET = 'uploads'

function credentials() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in env')
  }
  return { url: SUPABASE_URL, key: SERVICE_ROLE_KEY }
}

/**
 * Upload a file to Supabase Storage. Returns the PUBLIC URL of the uploaded
 * object (works on Vercel, localhost, and any environment).
 *
 * @param buffer  File contents
 * @param mimeType e.g. 'image/png'
 * @param ext     File extension without dot, e.g. 'png'
 * @returns       Public URL like https://xxx.supabase.co/storage/v1/object/public/uploads/2024-01/uuid.png
 */
export async function uploadToSupabase(
  buffer: Buffer,
  mimeType: string,
  ext: string,
): Promise<string> {
  const { url, key } = credentials()
  const now = new Date()
  const monthDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const fileName = `${crypto.randomUUID()}.${ext}`
  const objectPath = `${monthDir}/${fileName}`

  // Upload — upsert=true so re-uploads don't 409
  const uploadUrl = `${url}/storage/v1/object/${BUCKET}/${objectPath}`
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: buffer,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Supabase upload failed: ${res.status} ${body}`)
  }

  // Public URL (bucket is public, so no signed URL needed)
  return `${url}/storage/v1/object/public/${BUCKET}/${objectPath}`
}

/**
 * Ensure the 'uploads' bucket exists (public). Safe to call multiple times —
 * returns silently if it already exists. Called on server start.
 */
export async function ensureUploadsBucket() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
    })
    // 200 = created, 409 = already exists — both fine
    if (!res.ok && res.status !== 409) {
      console.warn(`[supabase] bucket ensure returned ${res.status}`)
    }
  } catch (e) {
    console.warn('[supabase] could not ensure bucket:', e)
  }
}

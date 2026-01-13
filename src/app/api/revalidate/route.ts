/**
 * ISR Revalidation API Route
 *
 * Triggers on-demand revalidation of Next.js pages when content changes.
 * Called from Payload CMS afterChange hooks to ensure fresh content
 * is served immediately after publishing.
 *
 * Security:
 * - Validates secret token to prevent unauthorized revalidation
 * - Only accepts POST requests
 * - Logs all revalidation attempts for debugging
 *
 * Usage:
 * POST /api/revalidate
 * Body: { "path": "/blog/my-article", "secret": "..." }
 *
 * @see PAY-027 in PRD for acceptance criteria
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration
 */
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Revalidation request body structure
 */
interface RevalidateBody {
  /** Path to revalidate (e.g., '/blog/my-article') */
  path?: string
  /** Cache tag to revalidate (alternative to path) */
  tag?: string
  /** Secret token for authentication */
  secret?: string
  /** Type of content being revalidated (for logging) */
  type?: string
}

/**
 * POST /api/revalidate
 *
 * Triggers on-demand revalidation for a specific path or tag.
 * Protected by secret token to prevent unauthorized access.
 */
export async function POST(request: NextRequest) {
  try {
    const body: RevalidateBody = await request.json()
    const { path, tag, secret, type } = body

    // Validate secret token
    const expectedSecret = process.env.REVALIDATION_SECRET || process.env.PAYLOAD_SECRET
    if (secret !== expectedSecret) {
      console.warn('[Revalidate] Invalid secret token')
      return NextResponse.json(
        { error: 'Invalid secret token', revalidated: false },
        { status: 401 }
      )
    }

    // Require at least one target (path or tag)
    if (!path && !tag) {
      return NextResponse.json(
        { error: 'Missing path or tag parameter', revalidated: false },
        { status: 400 }
      )
    }

    // Revalidate the specified path and/or tag
    const results: { path?: string; tag?: string }[] = []

    if (path) {
      revalidatePath(path)
      results.push({ path })
      console.log(`[Revalidate] Path revalidated: ${path} (type: ${type || 'unknown'})`)
    }

    if (tag) {
      // Next.js 16 requires a cacheLife profile as second argument
      // Using 'max' for SWR (stale-while-revalidate) behavior
      revalidateTag(tag, 'max')
      results.push({ tag })
      console.log(`[Revalidate] Tag revalidated: ${tag} (type: ${type || 'unknown'})`)
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      results,
    })
  } catch (error) {
    console.error('[Revalidate] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', revalidated: false },
      { status: 500 }
    )
  }
}

/**
 * GET /api/revalidate
 *
 * Simple health check and usage info for the revalidation endpoint.
 * Does not actually revalidate - use POST for that.
 */
export async function GET() {
  return NextResponse.json({
    message: 'Revalidation endpoint',
    usage: 'POST with { path: "/your/path", secret: "your-secret" }',
    status: 'ready',
  })
}

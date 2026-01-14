/**
 * Redirect Lookup API Route
 *
 * Called by middleware to check if a URL path should be redirected.
 * Returns redirect information or 404 if no redirect exists.
 *
 * This route runs on the Node.js runtime (not Edge) so it can use
 * the Payload client directly.
 *
 * @see PAY-052 in PRD for acceptance criteria
 * @see src/lib/supabase/middleware.ts for middleware integration
 */
import { NextResponse } from 'next/server'
import { getRedirect } from '@/lib/payload/client'

// Ensure this route uses Node.js runtime for Payload compatibility
export const runtime = 'nodejs'

/**
 * GET /api/redirects/lookup?path=/old-page
 *
 * Look up a redirect by source path.
 *
 * @param request - Request with 'path' query parameter
 * @returns { redirect: { destination, type } } or 404 if not found
 *
 * @example
 * fetch('/api/redirects/lookup?path=/old-page')
 *   .then(res => res.json())
 *   .then(data => {
 *     if (data.redirect) {
 *       window.location.href = data.redirect.destination
 *     }
 *   })
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  // Validate path parameter
  if (!path) {
    return NextResponse.json(
      { error: 'Missing path parameter' },
      { status: 400 }
    )
  }

  try {
    const redirect = await getRedirect(path)

    if (!redirect) {
      return NextResponse.json(
        { redirect: null },
        { status: 404 }
      )
    }

    // Return redirect info (only what middleware needs)
    return NextResponse.json({
      redirect: {
        destination: redirect.destination,
        type: redirect.type,
      },
    })
  } catch (error) {
    console.error('[Redirect Lookup] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

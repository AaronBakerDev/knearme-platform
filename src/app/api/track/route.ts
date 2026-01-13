/**
 * Page View Tracking API Endpoint
 *
 * Privacy-friendly endpoint for tracking article page views.
 * Does NOT store any PII (no user IDs, emails, or IP addresses).
 *
 * Privacy principles:
 * - Respects DNT header (client should check before calling)
 * - No IP address storage
 * - Country derived from Vercel geo headers, not stored IP
 * - Device type derived from user agent, UA not stored
 * - Session ID is anonymous hash for deduplication only
 *
 * @see PAY-064 in PRD for acceptance criteria
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Derive device type from user agent string
 * Simple heuristic - not stored, just categorized
 */
function getDeviceType(userAgent: string | null): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  if (!userAgent) return 'unknown'

  const ua = userAgent.toLowerCase()

  // Check for tablets first (iPad, Android tablet, etc.)
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    return 'tablet'
  }

  // Check for mobile devices
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    return 'mobile'
  }

  // Default to desktop for everything else
  return 'desktop'
}

/**
 * Clean referrer URL for storage
 * Strips query params and fragments for privacy
 */
function cleanReferrer(referrer: string | null): string {
  if (!referrer) return 'direct'

  try {
    const url = new URL(referrer)
    // Return just origin + pathname, no query params
    return `${url.origin}${url.pathname}`
  } catch {
    return 'unknown'
  }
}

/**
 * POST /api/track
 *
 * Track a page view for an article.
 *
 * Request body:
 * - articleId: string (required) - Article slug or ID
 * - timestamp: string (optional) - ISO timestamp, defaults to server time
 * - source: string (optional) - Referrer URL
 * - sessionId: string (optional) - Anonymous session hash
 *
 * Response:
 * - 200: { success: true }
 * - 400: { error: 'Missing articleId' }
 * - 500: { error: 'Failed to track view' }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { articleId, timestamp, source, sessionId } = body

    // Validate required field
    if (!articleId || typeof articleId !== 'string') {
      return NextResponse.json(
        { error: 'Missing articleId' },
        { status: 400 }
      )
    }

    // Get device type from user agent (UA not stored)
    const userAgent = request.headers.get('user-agent')
    const device = getDeviceType(userAgent)

    // Get country from Vercel geo headers (IP not stored)
    // Falls back to empty if not available (local dev)
    const country = request.headers.get('x-vercel-ip-country') || ''

    // Clean referrer for storage
    const cleanedSource = cleanReferrer(source || request.headers.get('referer'))

    // Initialize Payload
    const payload = await getPayload({ config })

    // Create page view record
    // Type assertion needed due to CollectionSlug type generation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).create({
      collection: 'page-views',
      data: {
        articleId,
        timestamp: timestamp || new Date().toISOString(),
        source: cleanedSource,
        device,
        country,
        sessionId: sessionId || null,
      },
    })

    // Return success (no data to prevent tracking the tracker)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Track API] Error recording page view:', error)

    // Return success even on error to prevent tracking detection
    // The view just won't be recorded
    return NextResponse.json({ success: true })
  }
}

/**
 * OPTIONS /api/track
 *
 * Handle CORS preflight for cross-origin tracking
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}

/**
 * Cron Endpoint: Publish Scheduled Articles
 *
 * This endpoint finds all articles with status='scheduled' and publishedAt in the past,
 * then updates their status to 'published'. This is optional functionality since the
 * blog listing queries already handle scheduled content visibility at runtime.
 *
 * Benefits of running this cron:
 * - Cleaner admin UX (status reflects actual state)
 * - Better metrics/reporting (status is accurate)
 * - Optional: trigger notifications when content goes live
 *
 * Usage:
 * - Call via Vercel Cron, external scheduler, or manually
 * - Protected by CRON_SECRET environment variable
 *
 * Vercel Cron config (in vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/publish-scheduled",
 *     "schedule": "* * * * *"  // Every minute (or adjust as needed)
 *   }]
 * }
 *
 * @see PAY-049 in PRD for content scheduling requirements
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

/**
 * Verify cron request authorization
 * Uses CRON_SECRET env var for protection
 */
function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // If no secret configured, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === 'development'
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const payload = await getPayload({ config })
    const now = new Date().toISOString()

    // Find scheduled articles with past publishedAt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scheduledResult = await (payload as any).find({
      collection: 'articles',
      where: {
        and: [
          { status: { equals: 'scheduled' } },
          { publishedAt: { less_than_equal: now } },
        ],
      },
      limit: 100, // Process in batches
    })

    const articles = scheduledResult.docs || []

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled articles to publish',
        published: 0,
      })
    }

    // Update each article to published status
    const updates = await Promise.all(
      articles.map(async (article: { id: string; title: string }) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (payload as any).update({
            collection: 'articles',
            id: article.id,
            data: {
              status: 'published',
            },
          })
          return { id: article.id, title: article.title, success: true }
        } catch (error) {
          console.error(`Failed to publish article ${article.id}:`, error)
          return { id: article.id, title: article.title, success: false, error: String(error) }
        }
      })
    )

    const successCount = updates.filter((u) => u.success).length
    const failCount = updates.filter((u) => !u.success).length

    return NextResponse.json({
      success: true,
      message: `Published ${successCount} articles${failCount > 0 ? `, ${failCount} failed` : ''}`,
      published: successCount,
      failed: failCount,
      details: updates,
    })
  } catch (error) {
    console.error('[cron/publish-scheduled] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduled articles',
        details: String(error),
      },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: Request) {
  return GET(request)
}

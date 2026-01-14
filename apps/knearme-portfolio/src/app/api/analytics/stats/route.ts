/**
 * Analytics Stats API Route
 *
 * Returns aggregated page view statistics for the analytics dashboard.
 * Supports date range filtering and returns views over time data.
 *
 * @see PAY-063 in PRD for acceptance criteria
 * @see src/payload/views/AnalyticsDashboard.tsx for consumer
 */
import { NextRequest, NextResponse } from 'next/server'
import { createLocalReq } from 'payload'
import { getPayloadClient, type PageView } from '@/lib/payload/client'

/**
 * Aggregate page views by day
 *
 * @param views - Array of page view records
 * @returns Array of daily view counts sorted by date
 */
function aggregateViewsByDay(
  views: PageView[]
): Array<{ date: string; views: number }> {
  const dayMap = new Map<string, number>()

  for (const view of views) {
    // Extract date portion (YYYY-MM-DD)
    const date = view.timestamp?.split('T')[0] ?? 'unknown'
    dayMap.set(date, (dayMap.get(date) || 0) + 1)
  }

  // Convert to array and sort by date
  return Array.from(dayMap.entries())
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * GET /api/analytics/stats
 *
 * Query params:
 * - startDate: ISO date string for filtering views (optional)
 * - endDate: ISO date string for filtering views (optional)
 * - articleId: Filter to specific article (optional)
 * - topN: Number of top articles to return (default 10)
 *
 * Returns:
 * - totalViews: Total number of page views
 * - uniqueSessions: Count of unique session IDs
 * - byDevice: View counts by device type
 * - byCountry: View counts by country
 * - topArticles: Top N articles by view count
 * - viewsByDay: Daily view counts for charting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const articleId = searchParams.get('articleId') || undefined
    const topN = parseInt(searchParams.get('topN') || '10', 10)

    const payload = await getPayloadClient()
    let authUser: Record<string, unknown> | null = null

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authResult = await (payload as any).auth({
        headers: request.headers,
      })
      authUser = authResult.user as Record<string, unknown> | null
    } catch {
      authUser = null
    }

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const req = await (createLocalReq as any)(
      {
        user: authUser,
      },
      payload
    )

    // Build where clause for filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {}

    if (articleId) {
      where.articleId = { equals: articleId }
    }

    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.greater_than_equal = startDate
      }
      if (endDate) {
        where.timestamp.less_than_equal = endDate
      }
    }

    // Fetch all matching views
    // Note: For very large datasets, consider implementing cursor-based pagination
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'page-views',
      where,
      limit: 10000, // Max for aggregation
      pagination: false,
      req,
      overrideAccess: false,
    })

    const views = (result.docs || []) as PageView[]

    // Compute aggregates
    const sessionSet = new Set<string>()
    const deviceCounts: Record<string, number> = {}
    const countryCounts: Record<string, number> = {}
    const articleCounts: Record<string, number> = {}

    for (const view of views) {
      // Unique sessions
      if (view.sessionId) {
        sessionSet.add(view.sessionId)
      }

      // Device breakdown
      const device = view.device || 'unknown'
      deviceCounts[device] = (deviceCounts[device] || 0) + 1

      // Country breakdown
      const country = view.country || 'unknown'
      countryCounts[country] = (countryCounts[country] || 0) + 1

      // Article counts
      articleCounts[view.articleId] = (articleCounts[view.articleId] || 0) + 1
    }

    // Sort articles by view count and take top N
    let topArticles = Object.entries(articleCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([articleId, views]) => ({ articleId, views }))

    // Aggregate views by day for chart
    const viewsByDay = aggregateViewsByDay(views)

    // Enrich top articles with titles for better admin UX
    if (topArticles.length > 0) {
      const slugConditions = topArticles.map((article) => ({
        slug: { equals: article.articleId },
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const articlesResult = await (payload as any).find({
        collection: 'articles',
        where: { or: slugConditions },
        limit: slugConditions.length,
        depth: 0,
        select: { slug: true, title: true },
        req,
        overrideAccess: false,
      })

      const titleBySlug = new Map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (articlesResult.docs || []).map((doc: any) => [doc.slug, doc.title])
      )

      topArticles = topArticles.map((entry) => ({
        ...entry,
        title: titleBySlug.get(entry.articleId) || entry.articleId,
      }))
    }

    return NextResponse.json({
      totalViews: views.length,
      uniqueSessions: sessionSet.size,
      byDevice: deviceCounts,
      byCountry: countryCounts,
      topArticles,
      viewsByDay,
    })
  } catch (error) {
    console.error('Analytics stats error:', error)

    // Return empty stats on error (dashboard handles gracefully)
    return NextResponse.json({
      totalViews: 0,
      uniqueSessions: 0,
      byDevice: {},
      byCountry: {},
      topArticles: [],
      viewsByDay: [],
    })
  }
}

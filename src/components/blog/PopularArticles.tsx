/**
 * PopularArticles Widget Component
 *
 * Displays top articles by view count with configurable time period filtering.
 * Designed to be placed in sidebars, footers, or any widget area.
 *
 * Features:
 * - Configurable time periods (week, month, all-time)
 * - Shows view count badge for each article
 * - Lazy-loaded images for performance
 * - Responsive design for sidebar or footer placement
 *
 * @see PAY-065 in PRD for acceptance criteria
 * @see src/lib/payload/client.ts getPopularArticles() for data fetching
 */

import Link from 'next/link'
import {
  getPopularArticles,
  type PopularArticle,
  type TimePeriod,
} from '@/lib/payload/client'
import { LazyImage } from './LazyImage'
import { TrendingUp, Eye, Clock } from 'lucide-react'

/**
 * Props for PopularArticles component
 */
interface PopularArticlesProps {
  /**
   * Time period to calculate popularity
   * @default 'week'
   */
  period?: TimePeriod
  /**
   * Maximum number of articles to display
   * @default 5
   */
  limit?: number
  /**
   * Optional title override
   * @default "Popular Articles"
   */
  title?: string
  /**
   * Whether to show view counts
   * @default true
   */
  showViewCounts?: boolean
  /**
   * Display variant
   * @default 'sidebar'
   */
  variant?: 'sidebar' | 'footer' | 'compact'
}

/**
 * Format view count for display
 * Shows "1.2K" for thousands
 */
function formatViews(views: number): string {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`
  }
  return views.toString()
}

/**
 * Get period label for display
 */
function getPeriodLabel(period: TimePeriod): string {
  switch (period) {
    case 'week':
      return 'This Week'
    case 'month':
      return 'This Month'
    case 'all':
      return 'All Time'
  }
}

/**
 * PopularArticles - Server Component for displaying top articles
 *
 * @example
 * ```tsx
 * // In a sidebar
 * <PopularArticles period="week" limit={5} />
 *
 * // In footer with compact layout
 * <PopularArticles period="month" variant="footer" />
 *
 * // All-time popular articles
 * <PopularArticles period="all" title="Most Read" />
 * ```
 */
export async function PopularArticles({
  period = 'week',
  limit = 5,
  title = 'Popular Articles',
  showViewCounts = true,
  variant = 'sidebar',
}: PopularArticlesProps) {
  // Fetch popular articles from the Payload client
  const popularArticles = await getPopularArticles({ period, limit })

  // Don't render if no popular articles
  if (popularArticles.length === 0) {
    return null
  }

  return (
    <div className="popular-articles">
      {/* Header with title and period badge */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {title}
        </h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {getPeriodLabel(period)}
        </span>
      </div>

      {/* Articles list */}
      <ul
        className={
          variant === 'footer'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }
      >
        {popularArticles.map(({ article, views }, index) => (
          <PopularArticleItem
            key={article.id}
            article={article}
            views={views}
            rank={index + 1}
            showViewCount={showViewCounts}
            variant={variant}
          />
        ))}
      </ul>
    </div>
  )
}

/**
 * Individual popular article item
 */
interface PopularArticleItemProps {
  article: PopularArticle['article']
  views: number
  rank: number
  showViewCount: boolean
  variant: 'sidebar' | 'footer' | 'compact'
}

function PopularArticleItem({
  article,
  views,
  rank,
  showViewCount,
  variant,
}: PopularArticleItemProps) {
  const featuredImage =
    typeof article.featuredImage === 'object' ? article.featuredImage : null

  // Compact variant - minimal display
  if (variant === 'compact') {
    return (
      <li className="flex items-center gap-3 group">
        <span className="text-2xl font-bold text-muted-foreground/50 min-w-[2rem]">
          {rank}
        </span>
        <Link
          href={`/blog/${article.slug}`}
          className="flex-1 text-sm font-medium hover:text-primary transition-colors line-clamp-2"
        >
          {article.title}
        </Link>
        {showViewCount && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatViews(views)}
          </span>
        )}
      </li>
    )
  }

  // Sidebar variant - detailed with image
  if (variant === 'sidebar') {
    return (
      <li className="group">
        <Link href={`/blog/${article.slug}`} className="flex gap-3">
          {/* Rank badge */}
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-bold text-sm shrink-0">
            {rank}
          </span>

          {/* Thumbnail */}
          {featuredImage?.url && (
            <div className="relative w-16 h-16 rounded overflow-hidden shrink-0">
              <LazyImage
                src={featuredImage.url}
                alt={featuredImage.alt || article.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {showViewCount && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatViews(views)} views
                </span>
              )}
              {article.readingTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.readingTime} min
                </span>
              )}
            </div>
          </div>
        </Link>
      </li>
    )
  }

  // Footer variant - card style
  return (
    <li className="group">
      <Link href={`/blog/${article.slug}`} className="block">
        {/* Thumbnail */}
        {featuredImage?.url && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-3">
            <LazyImage
              src={featuredImage.url}
              alt={featuredImage.alt || article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Rank badge overlay */}
            <span className="absolute top-2 left-2 flex items-center justify-center w-8 h-8 rounded-full bg-black/70 text-white font-bold text-sm">
              #{rank}
            </span>
          </div>
        )}

        {/* Content */}
        <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h4>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {showViewCount && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatViews(views)} views
            </span>
          )}
          {article.readingTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readingTime} min
            </span>
          )}
        </div>
      </Link>
    </li>
  )
}

// Export type for use in other components
export type { PopularArticlesProps, TimePeriod }

/**
 * Blog Listing Page
 *
 * Displays published articles from Payload CMS with pagination.
 * Uses Server Components for SEO and Payload's getPayload for data fetching.
 *
 * Features:
 * - Published articles sorted by date (newest first)
 * - Article cards with title, excerpt, author, date, reading time, featured image
 * - Pagination (10 articles per page)
 * - SEO metadata
 *
 * @see PAY-041 in PRD for acceptance criteria
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

/**
 * Page metadata for SEO
 */
export const metadata: Metadata = {
  title: 'Blog | KnearMe',
  description: 'Tips, guides, and insights for contractors to grow their business and showcase their work.',
  openGraph: {
    title: 'Blog | KnearMe',
    description: 'Tips, guides, and insights for contractors to grow their business and showcase their work.',
    type: 'website',
  },
}

/**
 * Revalidate every 60 seconds for fresh content
 */
export const revalidate = 60

const ARTICLES_PER_PAGE = 10

interface BlogPageProps {
  searchParams: Promise<{ page?: string; tag?: string }>
}

/**
 * Tag type for filtering
 */
interface TagWithSlug {
  id: string
  name: string
  slug: string
}

/**
 * Article type from Payload with populated relationships
 */
interface ArticleWithRelations {
  id: string
  title: string
  slug: string
  excerpt?: string
  publishedAt?: string
  readingTime?: number
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  featuredImage?: {
    url?: string
    alt?: string
    width?: number
    height?: number
  } | string
  author?: {
    name?: string
    slug?: string
  } | string
  category?: {
    name?: string
    slug?: string
  } | string
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page: pageParam, tag: tagSlug } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10))

  const payload = await getPayload({ config })

  // Look up tag by slug if filtering
  let activeTag: TagWithSlug | null = null
  if (tagSlug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tagResult = await (payload as any).find({
      collection: 'tags',
      where: {
        slug: { equals: tagSlug },
      },
      limit: 1,
    })
    activeTag = (tagResult.docs?.[0] || null) as TagWithSlug | null
  }

  // Build where clause - show published articles and scheduled articles with past publishedAt
  // This enables content scheduling: scheduled articles auto-appear when their publishedAt passes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: Record<string, any> = {
    or: [
      // Published articles
      { status: { equals: 'published' } },
      // Scheduled articles where publishedAt is in the past
      {
        and: [
          { status: { equals: 'scheduled' } },
          { publishedAt: { less_than_equal: new Date().toISOString() } },
        ],
      },
    ],
  }

  // If tag filter is active and tag exists, filter articles that contain this tag
  if (activeTag) {
    whereClause.tags = { contains: activeTag.id }
  }

  // Fetch published articles with pagination
  // Note: 'articles' collection type not in generated CollectionSlug yet
  // TODO: Remove eslint-disable after running `npx payload generate:types`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articlesResult = await (payload as any).find({
    collection: 'articles',
    where: whereClause,
    sort: '-publishedAt',
    limit: ARTICLES_PER_PAGE,
    page: currentPage,
    depth: 1, // Populate author, category relationships
  })

  const articles = (articlesResult.docs || []) as ArticleWithRelations[]
  const totalPages = articlesResult.totalPages as number
  const totalDocs = articlesResult.totalDocs as number

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Page Header */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
          {activeTag ? `Articles tagged "${activeTag.name}"` : 'Blog'}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {activeTag
            ? `Showing ${totalDocs} ${totalDocs === 1 ? 'article' : 'articles'} with tag "${activeTag.name}"`
            : 'Tips, guides, and insights for contractors to grow their business and showcase their work.'}
        </p>
        {activeTag && (
          <Link
            href="/blog"
            className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Clear filter and view all articles
          </Link>
        )}
      </header>

      {/* Articles Grid */}
      {articles.length > 0 ? (
        <>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalDocs={totalDocs}
              tagSlug={activeTag?.slug}
            />
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            {activeTag
              ? `No articles found with tag "${activeTag.name}".`
              : 'No articles published yet.'}
          </p>
          <p className="text-gray-400 mt-2">
            {activeTag ? (
              <Link href="/blog" className="text-blue-600 hover:text-blue-800 transition-colors">
                View all articles
              </Link>
            ) : (
              'Check back soon for new content!'
            )}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Article Card Component
 *
 * Displays a single article preview with image, title, excerpt,
 * author, date, and reading time.
 */
function ArticleCard({ article }: { article: ArticleWithRelations }) {
  const author = typeof article.author === 'object' ? article.author : null
  const category = typeof article.category === 'object' ? article.category : null
  const featuredImage = typeof article.featuredImage === 'object' ? article.featuredImage : null

  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt)
    : null

  return (
    <article className="group flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Featured Image */}
      {featuredImage?.url && (
        <Link href={`/blog/${article.slug}`} className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={featuredImage.url}
            alt={featuredImage.alt || article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>
      )}

      <div className="flex flex-col flex-1 p-5">
        {/* Category Badge */}
        {category?.name && (
          <Link
            href={`/blog/category/${category.slug}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 uppercase tracking-wide mb-2"
          >
            {category.name}
          </Link>
        )}

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          <Link href={`/blog/${article.slug}`} className="hover:text-blue-600 transition-colors">
            {article.title}
          </Link>
        </h2>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
            {article.excerpt}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {author?.name && (
              <Link
                href={`/blog/author/${author.slug}`}
                className="font-medium hover:text-gray-900 transition-colors"
              >
                {author.name}
              </Link>
            )}
            {author?.name && publishedDate && <span>&middot;</span>}
            {publishedDate && (
              <time dateTime={publishedDate.toISOString()}>
                {formatDistanceToNow(publishedDate, { addSuffix: true })}
              </time>
            )}
          </div>
          {article.readingTime && (
            <span>{article.readingTime} min read</span>
          )}
        </div>
      </div>
    </article>
  )
}

/**
 * Pagination Component
 *
 * Displays page navigation with prev/next and page numbers.
 * Uses SEO-friendly links with rel=prev/next for crawlers.
 * Preserves tag filter in pagination links when active.
 */
function Pagination({
  currentPage,
  totalPages,
  totalDocs,
  tagSlug,
}: {
  currentPage: number
  totalPages: number
  totalDocs: number
  tagSlug?: string
}) {
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  // Generate page numbers to show (max 5)
  const pageNumbers: number[] = []
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, start + 4)

  for (let i = start; i <= end; i++) {
    pageNumbers.push(i)
  }

  // Build URL with optional tag filter preserved
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (tagSlug) {
      params.set('tag', tagSlug)
    }
    return `/blog?${params.toString()}`
  }

  return (
    <nav className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-8 border-t border-gray-200 gap-4">
      {/* Page Info */}
      <p className="text-sm text-gray-500">
        Showing page {currentPage} of {totalPages} ({totalDocs} articles)
      </p>

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {/* Previous */}
        {hasPrev ? (
          <Link
            href={buildPageUrl(currentPage - 1)}
            rel="prev"
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Previous
          </Link>
        ) : (
          <span className="px-3 py-2 text-sm font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed">
            Previous
          </span>
        )}

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((num) => (
            <Link
              key={num}
              href={buildPageUrl(num)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                num === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {num}
            </Link>
          ))}
        </div>

        {/* Next */}
        {hasNext ? (
          <Link
            href={buildPageUrl(currentPage + 1)}
            rel="next"
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Next
          </Link>
        ) : (
          <span className="px-3 py-2 text-sm font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed">
            Next
          </span>
        )}
      </div>
    </nav>
  )
}

/**
 * Category Page - Lists articles in a specific category
 *
 * Displays category info and paginated list of articles belonging to that category.
 * Uses Server Components for SEO and Payload's getPayload for data fetching.
 *
 * Features:
 * - Category name, description, and article count
 * - Articles filtered by category, sorted by date (newest first)
 * - Pagination (10 articles per page)
 * - SEO metadata from category SEO fields
 *
 * @see PAY-043 in PRD for acceptance criteria
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

/**
 * Revalidate every 60 seconds for fresh content
 */
export const revalidate = 60

const ARTICLES_PER_PAGE = 10

/**
 * Category type with optional relationships
 */
interface CategoryWithRelations {
  id: string
  name: string
  slug: string
  description?: string
  featuredImage?: {
    url?: string
    alt?: string
    width?: number
    height?: number
  } | string
  parent?: {
    name?: string
    slug?: string
  } | string
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: {
      url?: string
    } | string
  }
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

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

/**
 * Fetch category by slug
 */
async function getCategory(slug: string): Promise<CategoryWithRelations | null> {
  const payload = await getPayload({ config })

  // Note: 'categories' collection type not in generated CollectionSlug yet
  // TODO: Remove eslint-disable after running `npx payload generate:types`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'categories',
    where: {
      slug: { equals: slug },
    },
    depth: 1, // Populate parent relationship
    limit: 1,
  })

  return (result.docs?.[0] || null) as CategoryWithRelations | null
}

/**
 * Generate static params for all categories
 * Enables static generation at build time.
 * Falls back to dynamic generation if database is unavailable during build.
 */
export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'categories',
      limit: 1000,
      select: { slug: true },
    })

    return (result.docs || []).map((category: { slug: string }) => ({
      slug: category.slug,
    }))
  } catch {
    // Database unavailable during build
    console.warn('[generateStaticParams] Database unavailable, using dynamic generation')
    return []
  }
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)

  if (!category) {
    return {
      title: 'Category Not Found | KnearMe',
    }
  }

  const title = category.seo?.metaTitle || `${category.name} Articles`
  const description = category.seo?.metaDescription || category.description || `Browse all articles in the ${category.name} category.`
  const ogImage = typeof category.seo?.ogImage === 'object' ? category.seo.ogImage?.url : undefined
  const featuredImage = typeof category.featuredImage === 'object' ? category.featuredImage?.url : undefined

  return {
    title: `${title} | KnearMe Blog`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: ogImage || featuredImage ? [{ url: ogImage || featuredImage || '' }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage || featuredImage ? [ogImage || featuredImage || ''] : [],
    },
  }
}

/**
 * Category Page Component
 */
export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10))

  const category = await getCategory(slug)

  if (!category) {
    notFound()
  }

  const payload = await getPayload({ config })

  // Fetch published articles in this category with pagination
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articlesResult = await (payload as any).find({
    collection: 'articles',
    where: {
      status: { equals: 'published' },
      category: { equals: category.id },
    },
    sort: '-publishedAt',
    limit: ARTICLES_PER_PAGE,
    page: currentPage,
    depth: 1, // Populate author relationship
  })

  const articles = (articlesResult.docs || []) as ArticleWithRelations[]
  const totalPages = articlesResult.totalPages as number
  const totalDocs = articlesResult.totalDocs as number

  const featuredImage = typeof category.featuredImage === 'object' ? category.featuredImage : null
  const parent = typeof category.parent === 'object' ? category.parent : null

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-gray-500">
        <Link href="/blog" className="hover:text-gray-900 transition-colors">
          Blog
        </Link>
        {parent?.name && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/blog/category/${parent.slug}`}
              className="hover:text-gray-900 transition-colors"
            >
              {parent.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-900">{category.name}</span>
      </nav>

      {/* Category Header */}
      <header className="mb-12">
        {/* Featured Image */}
        {featuredImage?.url && (
          <div className="relative aspect-[21/9] mb-8 rounded-lg overflow-hidden">
            <Image
              src={featuredImage.url}
              alt={featuredImage.alt || category.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
          </div>
        )}

        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
          {category.name}
        </h1>

        {category.description && (
          <p className="text-lg text-gray-600 max-w-2xl">
            {category.description}
          </p>
        )}

        <p className="mt-4 text-sm text-gray-500">
          {totalDocs} {totalDocs === 1 ? 'article' : 'articles'} in this category
        </p>
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
              categorySlug={slug}
            />
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No articles in this category yet.</p>
          <p className="text-gray-400 mt-2">
            <Link href="/blog" className="text-blue-600 hover:text-blue-800 transition-colors">
              Browse all articles
            </Link>
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
 */
function Pagination({
  currentPage,
  totalPages,
  totalDocs,
  categorySlug,
}: {
  currentPage: number
  totalPages: number
  totalDocs: number
  categorySlug: string
}) {
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages
  const basePath = `/blog/category/${categorySlug}`

  // Generate page numbers to show (max 5)
  const pageNumbers: number[] = []
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, start + 4)

  for (let i = start; i <= end; i++) {
    pageNumbers.push(i)
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
            href={`${basePath}?page=${currentPage - 1}`}
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
              href={`${basePath}?page=${num}`}
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
            href={`${basePath}?page=${currentPage + 1}`}
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

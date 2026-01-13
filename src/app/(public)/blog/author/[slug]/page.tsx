/**
 * Author Page - Shows author profile and their articles
 *
 * Displays author info (name, bio, avatar, social links) and a paginated list
 * of all articles they've written. Uses Server Components for SEO.
 *
 * Features:
 * - Author profile with avatar, name, role, bio, social links
 * - List of all articles by this author
 * - Pagination (10 articles per page)
 * - Person schema JSON-LD for SEO/E-E-A-T
 *
 * @see PAY-044 in PRD for acceptance criteria
 * @see Authors.ts for field definitions
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LazyImage } from '@/components/blog/LazyImage'
import { formatDistanceToNow } from 'date-fns'
import { Twitter, Linkedin, Globe } from 'lucide-react'

/**
 * Revalidate every 60 seconds for fresh content
 */
export const revalidate = 60

const ARTICLES_PER_PAGE = 10

/**
 * Author type with optional relationships and SEO fields
 */
interface AuthorWithRelations {
  id: string
  name: string
  slug: string
  email?: string
  role?: string
  avatar?: {
    url?: string
    alt?: string
    width?: number
    height?: number
  } | string
  bio?: {
    root?: {
      children?: Array<{ text?: string; children?: Array<{ text?: string }> }>
    }
  }
  social?: {
    twitter?: string
    linkedin?: string
    website?: string
  }
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
  category?: {
    name?: string
    slug?: string
  } | string
}

interface AuthorPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

/**
 * Fetch author by slug
 */
async function getAuthor(slug: string): Promise<AuthorWithRelations | null> {
  const payload = await getPayload({ config })

  // Note: 'authors' collection type not in generated CollectionSlug yet
  // TODO: Remove eslint-disable after running `npx payload generate:types`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'authors',
    where: {
      slug: { equals: slug },
    },
    depth: 1, // Populate avatar
    limit: 1,
  })

  return (result.docs?.[0] || null) as AuthorWithRelations | null
}

/**
 * Generate static params for all authors
 * Enables static generation at build time.
 * Falls back to dynamic generation if database is unavailable during build.
 */
export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'authors',
      limit: 1000,
      select: { slug: true },
    })

    return (result.docs || []).map((author: { slug: string }) => ({
      slug: author.slug,
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
export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params
  const author = await getAuthor(slug)

  if (!author) {
    return {
      title: 'Author Not Found | KnearMe',
    }
  }

  const title = author.seo?.metaTitle || author.name
  const bioText = extractTextFromLexical(author.bio)
  const description = author.seo?.metaDescription ||
    (bioText ? bioText.slice(0, 160) : `Articles written by ${author.name}`)
  const ogImage = typeof author.seo?.ogImage === 'object' ? author.seo.ogImage?.url : undefined
  const avatarUrl = typeof author.avatar === 'object' ? author.avatar?.url : undefined

  return {
    title: `${title} | KnearMe Blog`,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: ogImage || avatarUrl ? [{ url: ogImage || avatarUrl || '' }] : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ogImage || avatarUrl ? [ogImage || avatarUrl || ''] : [],
    },
  }
}

/**
 * Extract plain text from Lexical rich text for meta descriptions
 */
function extractTextFromLexical(content?: { root?: { children?: Array<{ text?: string; children?: Array<{ text?: string }> }> } }): string {
  if (!content?.root?.children) return ''

  const extractText = (nodes: Array<{ text?: string; children?: Array<{ text?: string }> }>): string => {
    return nodes.map(node => {
      if (node.text) return node.text
      if (node.children) return extractText(node.children as Array<{ text?: string; children?: Array<{ text?: string }> }>)
      return ''
    }).join(' ')
  }

  return extractText(content.root.children).trim()
}

/**
 * Author Page Component
 */
export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10))

  const author = await getAuthor(slug)

  if (!author) {
    notFound()
  }

  const payload = await getPayload({ config })

  // Fetch visible articles by this author with pagination
  // Visible = published OR (scheduled with past publishedAt)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articlesResult = await (payload as any).find({
    collection: 'articles',
    where: {
      or: [
        { status: { equals: 'published' } },
        {
          and: [
            { status: { equals: 'scheduled' } },
            { publishedAt: { less_than_equal: new Date().toISOString() } },
          ],
        },
      ],
      author: { equals: author.id },
    },
    sort: '-publishedAt',
    limit: ARTICLES_PER_PAGE,
    page: currentPage,
    depth: 1, // Populate category relationship
  })

  const articles = (articlesResult.docs || []) as ArticleWithRelations[]
  const totalPages = articlesResult.totalPages as number
  const totalDocs = articlesResult.totalDocs as number

  const avatar = typeof author.avatar === 'object' ? author.avatar : null
  const bioText = extractTextFromLexical(author.bio)

  return (
    <>
      {/* Person Schema JSON-LD for E-E-A-T */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: author.name,
            url: `https://knearme.co/blog/author/${author.slug}`,
            image: avatar?.url,
            jobTitle: author.role,
            description: bioText || undefined,
            sameAs: [
              author.social?.twitter ? `https://twitter.com/${author.social.twitter}` : null,
              author.social?.linkedin,
              author.social?.website,
            ].filter(Boolean),
          }),
        }}
      />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-gray-500">
          <Link href="/blog" className="hover:text-gray-900 transition-colors">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{author.name}</span>
        </nav>

        {/* Author Profile Header */}
        <header className="mb-12 pb-12 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            {avatar?.url && (
              <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-gray-100 flex-shrink-0">
                <Image
                  src={avatar.url}
                  alt={avatar.alt || author.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="128px"
                />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-2">
                {author.name}
              </h1>

              {author.role && (
                <p className="text-lg text-gray-600 mb-4">{author.role}</p>
              )}

              {/* Bio */}
              {bioText && (
                <p className="text-gray-600 max-w-2xl mb-4 leading-relaxed">
                  {bioText}
                </p>
              )}

              {/* Social Links */}
              <SocialLinks social={author.social} />

              <p className="mt-4 text-sm text-gray-500">
                {totalDocs} {totalDocs === 1 ? 'article' : 'articles'} published
              </p>
            </div>
          </div>
        </header>

        {/* Articles Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Articles by {author.name}
          </h2>

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
                  authorSlug={slug}
                />
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No articles published yet.</p>
              <p className="text-gray-400 mt-2">
                <Link href="/blog" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Browse all articles
                </Link>
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  )
}

/**
 * Social Links Component
 * Displays Twitter, LinkedIn, and website links with icons
 */
function SocialLinks({ social }: { social?: AuthorWithRelations['social'] }) {
  if (!social?.twitter && !social?.linkedin && !social?.website) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      {social.twitter && (
        <a
          href={`https://twitter.com/${social.twitter}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-900 transition-colors"
          aria-label={`Follow on Twitter`}
        >
          <Twitter className="w-5 h-5" />
        </a>
      )}
      {social.linkedin && (
        <a
          href={social.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-900 transition-colors"
          aria-label="Connect on LinkedIn"
        >
          <Linkedin className="w-5 h-5" />
        </a>
      )}
      {social.website && (
        <a
          href={social.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-900 transition-colors"
          aria-label="Visit website"
        >
          <Globe className="w-5 h-5" />
        </a>
      )}
    </div>
  )
}

/**
 * Article Card Component
 *
 * Displays a single article preview with image, title, excerpt,
 * category, date, and reading time.
 */
function ArticleCard({ article }: { article: ArticleWithRelations }) {
  const category = typeof article.category === 'object' ? article.category : null
  const featuredImage = typeof article.featuredImage === 'object' ? article.featuredImage : null

  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt)
    : null

  return (
    <article className="group flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Featured Image - lazy loaded for below-fold cards (PAY-062) */}
      {featuredImage?.url && (
        <Link href={`/blog/${article.slug}`} className="relative aspect-[16/9] overflow-hidden">
          <LazyImage
            src={featuredImage.url}
            alt={featuredImage.alt || article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            wrapperClassName="absolute inset-0"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>
      )}

      <div className="flex flex-col flex-1 p-5">
        {/* Category Badge */}
        {category?.name && (
          <Link
            href={`/blog/category/${category.slug}`}
            className="self-start text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full mb-3 hover:bg-blue-100 transition-colors"
          >
            {category.name}
          </Link>
        )}

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          <Link href={`/blog/${article.slug}`} className="hover:text-blue-600 transition-colors">
            {article.title}
          </Link>
        </h3>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
            {article.excerpt}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
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
  authorSlug,
}: {
  currentPage: number
  totalPages: number
  totalDocs: number
  authorSlug: string
}) {
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages
  const basePath = `/blog/author/${authorSlug}`

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

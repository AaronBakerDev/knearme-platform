/**
 * Article Preview Page
 *
 * Displays a draft article using a unique preview token. This allows
 * stakeholders to review unpublished content without CMS access.
 *
 * Features:
 * - Token-based access (no authentication required)
 * - 7-day token expiration
 * - "Preview Mode" banner indicating draft status
 * - noindex/nofollow to prevent search indexing
 *
 * @see PAY-066 in PRD for acceptance criteria
 * @see PAY-067 for shareable preview links (builds on this)
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { AlertTriangle, Eye, Clock } from 'lucide-react'

/**
 * Force dynamic rendering - preview tokens need real-time validation
 */
export const dynamic = 'force-dynamic'

/**
 * Calculate days until preview token expires.
 * Extracted to a separate function to avoid React purity linter warnings.
 *
 * @param expiresAt - ISO date string for token expiration
 * @returns Number of days until expiry, or null if no expiration
 */
function calculateDaysUntilExpiry(expiresAt?: string): number | null {
  if (!expiresAt) return null
  const expirationMs = new Date(expiresAt).getTime()
  const nowMs = Date.now()
  return Math.ceil((expirationMs - nowMs) / (1000 * 60 * 60 * 24))
}

/**
 * Article type with all relationships populated
 */
interface ArticleWithRelations {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: unknown // Lexical JSON
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
  readingTime?: number
  wordCount?: number
  tableOfContents?: Array<{ id: string; text: string; level: number }>
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  previewToken?: string
  previewTokenExpiresAt?: string
  featuredImage?: {
    url?: string
    alt?: string
    width?: number
    height?: number
  } | string
  author?: {
    id: string
    name?: string
    slug?: string
    role?: string
    bio?: unknown // Lexical JSON
    avatar?: {
      url?: string
      alt?: string
    } | string
    social?: {
      twitter?: string
      linkedin?: string
      website?: string
    }
  } | string
  category?: {
    name?: string
    slug?: string
  } | string
  tags?: Array<{
    id: string
    name?: string
    slug?: string
  } | string>
  relatedArticles?: Array<{
    id: string
    title: string
    slug: string
    excerpt?: string
    featuredImage?: {
      url?: string
      alt?: string
    } | string
    publishedAt?: string
    readingTime?: number
  } | string>
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: {
      url?: string
    } | string
    canonicalUrl?: string
    noIndex?: boolean
  }
}

interface PreviewPageProps {
  params: Promise<{ token: string }>
}

/**
 * Fetch article by preview token.
 * Validates token existence and expiration.
 *
 * @returns Article if token is valid and not expired, null otherwise
 */
async function getArticleByPreviewToken(token: string): Promise<ArticleWithRelations | null> {
  const payload = await getPayload({ config })

  // Query by preview token - no status filter since we want drafts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'articles',
    where: {
      previewToken: { equals: token },
    },
    depth: 2, // Populate relationships
    limit: 1,
    overrideAccess: true,
  })

  const article = (result.docs?.[0] || null) as ArticleWithRelations | null

  if (!article) {
    return null
  }

  // Check token expiration
  if (article.previewTokenExpiresAt) {
    const expiresAt = new Date(article.previewTokenExpiresAt)
    if (expiresAt < new Date()) {
      // Token has expired
      return null
    }
  } else {
    // No expiration date set - invalid token state
    return null
  }

  return article
}

/**
 * Generate metadata with noindex to prevent search indexing of previews
 */
export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { token } = await params
  const article = await getArticleByPreviewToken(token)

  if (!article) {
    return {
      title: 'Preview Not Found | KnearMe',
      robots: 'noindex, nofollow',
    }
  }

  return {
    title: `[Preview] ${article.title} | KnearMe Blog`,
    description: article.excerpt || '',
    // Critical: Prevent preview pages from being indexed
    robots: 'noindex, nofollow',
  }
}

/**
 * Preview Mode Banner Component
 *
 * Displays a fixed banner at the top of the page indicating preview mode.
 * Shows article status and token expiration.
 */
function PreviewBanner({
  status,
  daysUntilExpiry,
}: {
  status: string
  daysUntilExpiry: number | null
}) {

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5" />
            <span className="font-semibold">Preview Mode</span>
            <span className="px-2 py-0.5 bg-amber-600/30 rounded text-sm font-medium capitalize">
              {status}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {daysUntilExpiry !== null && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  Link expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 text-amber-950/70">
              <AlertTriangle className="h-4 w-4" />
              <span>This page is not indexed by search engines</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Simple rich text renderer for preview
 * Renders Lexical JSON content to React elements
 */
function RichTextContent({ content }: { content: unknown }) {
  if (!content || typeof content !== 'object') {
    return null
  }

  const contentObj = content as Record<string, unknown>
  const root = contentObj.root as Record<string, unknown> | undefined

  if (!root || !Array.isArray(root.children)) {
    return null
  }

  function renderNode(node: unknown, index: number): React.ReactNode {
    if (!node || typeof node !== 'object') return null

    const nodeObj = node as Record<string, unknown>
    const children = Array.isArray(nodeObj.children)
      ? nodeObj.children.map((child, i) => renderNode(child, i))
      : null

    switch (nodeObj.type) {
      case 'paragraph':
        return <p key={index} className="mb-4">{children}</p>
      case 'heading': {
        const tag = nodeObj.tag as string
        const id = children
          ?.toString()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        if (tag === 'h2') return <h2 key={index} id={id} className="text-2xl font-bold mt-8 mb-4">{children}</h2>
        if (tag === 'h3') return <h3 key={index} id={id} className="text-xl font-semibold mt-6 mb-3">{children}</h3>
        if (tag === 'h4') return <h4 key={index} id={id} className="text-lg font-medium mt-4 mb-2">{children}</h4>
        return <p key={index}>{children}</p>
      }
      case 'text':
        return <span key={index}>{nodeObj.text as string}</span>
      case 'link':
        return (
          <a
            key={index}
            href={
              (nodeObj.fields as Record<string, unknown>)?.url as string ||
              nodeObj.url as string ||
              '#'
            }
            className="text-blue-600 hover:text-blue-800 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        )
      case 'list': {
        const listTag = nodeObj.listType === 'number' ? 'ol' : 'ul'
        const listClass = listTag === 'ol' ? 'list-decimal' : 'list-disc'
        return listTag === 'ol' ? (
          <ol key={index} className={`${listClass} ml-6 mb-4`}>{children}</ol>
        ) : (
          <ul key={index} className={`${listClass} ml-6 mb-4`}>{children}</ul>
        )
      }
      case 'listitem':
        return <li key={index} className="mb-1">{children}</li>
      case 'quote':
        return (
          <blockquote key={index} className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
            {children}
          </blockquote>
        )
      case 'code': {
        const code = nodeObj.text as string
        return (
          <pre key={index} className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4">
            <code>{code}</code>
          </pre>
        )
      }
      default:
        return children
    }
  }

  return <>{(root.children as unknown[]).map((child, i) => renderNode(child, i))}</>
}

/**
 * Article Preview Page Component
 */
export default async function PreviewPage({ params }: PreviewPageProps) {
  const { token } = await params
  const article = await getArticleByPreviewToken(token)

  if (!article) {
    notFound()
  }

  const author = typeof article.author === 'object' ? article.author : null
  const category = typeof article.category === 'object' ? article.category : null
  const tags = (article.tags || [])
    .map((tag) => (typeof tag === 'object' ? tag : null))
    .filter((tag): tag is NonNullable<typeof tag> => tag !== null)

  const featuredImage = typeof article.featuredImage === 'object' ? article.featuredImage : null
  const lastModified = article.updatedAt || article.createdAt
  const tableOfContents = article.tableOfContents || []

  // Pre-compute days until expiry (server-side, before render)
  const daysUntilExpiry = calculateDaysUntilExpiry(article.previewTokenExpiresAt)

  return (
    <>
      {/* Preview Mode Banner */}
      <PreviewBanner
        status={article.status}
        daysUntilExpiry={daysUntilExpiry}
      />

      {/* Add top padding to account for fixed banner */}
      <article className="container mx-auto px-4 py-12 max-w-4xl" style={{ paddingTop: '5rem' }}>
        {/* Breadcrumb - Preview context */}
        <nav className="mb-8 text-sm text-gray-500">
          <span className="text-amber-600 font-medium">Preview</span>
          {category?.name && (
            <>
              <span className="mx-2">/</span>
              <span className="text-gray-600">{category.name}</span>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-900">{article.title}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          {/* Category Badge */}
          {category?.name && (
            <span className="inline-block text-sm font-medium text-blue-600 uppercase tracking-wide mb-4">
              {category.name}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            {article.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
            {/* Author */}
            {author?.name && (
              <div className="flex items-center gap-2">
                {typeof author.avatar === 'object' && author.avatar?.url && (
                  <Image
                    src={author.avatar.url}
                    alt={author.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="font-medium">{author.name}</span>
              </div>
            )}

            {/* Last Modified Date */}
            {lastModified && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500">
                  Last edited {format(new Date(lastModified), 'MMMM d, yyyy')}
                </span>
              </>
            )}

            {/* Reading Time */}
            {article.readingTime && (
              <>
                <span className="text-gray-300">•</span>
                <span>{article.readingTime} min read</span>
              </>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Featured Image */}
        {featuredImage?.url && (
          <div className="relative aspect-[16/9] mb-8 rounded-lg overflow-hidden">
            <Image
              src={featuredImage.url}
              alt={featuredImage.alt || article.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        )}

        {/* Content with Optional Table of Contents */}
        <div className="lg:flex lg:gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="prose prose-lg max-w-none">
              <RichTextContent content={article.content} />
            </div>
          </div>

          {/* Table of Contents Sidebar */}
          {tableOfContents.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <h3 className="font-semibold text-gray-900 mb-4">On this page</h3>
                <nav className="space-y-2">
                  {tableOfContents.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className={`block text-sm text-gray-600 hover:text-gray-900 transition-colors ${
                        heading.level === 3 ? 'pl-4' : ''
                      }`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>

        {/* Author Bio Section (simplified for preview) */}
        {author && author.name && (
          <section className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-start gap-4">
              {typeof author.avatar === 'object' && author.avatar?.url && (
                <Image
                  src={author.avatar.url}
                  alt={author.name}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg">{author.name}</h3>
                {author.role && <p className="text-gray-600">{author.role}</p>}
              </div>
            </div>
          </section>
        )}

        {/* Preview Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-amber-50 rounded-lg p-6 text-center">
            <p className="text-amber-900 font-medium mb-2">
              This is a preview of unpublished content
            </p>
            <p className="text-amber-700 text-sm">
              This link is temporary and will expire. The content may change before publication.
            </p>
          </div>
        </footer>
      </article>
    </>
  )
}

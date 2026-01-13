/**
 * Article Detail Page
 *
 * Displays a single article with full content, author info, related articles,
 * and SEO metadata. Uses Server Components for optimal performance and SEO.
 *
 * Features:
 * - Full article content with rich text rendering
 * - Author info with avatar, bio, and social links
 * - Category and tags with links
 * - Table of contents sidebar (for articles with headings)
 * - Related articles section (max 3)
 * - JSON-LD structured data for BlogPosting schema
 *
 * @see PAY-042 in PRD for acceptance criteria
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'

/**
 * Revalidate every 60 seconds for fresh content
 */
export const revalidate = 60

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
  readingTime?: number
  wordCount?: number
  tableOfContents?: Array<{ id: string; text: string; level: number }>
  status: 'draft' | 'scheduled' | 'published' | 'archived'
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

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

/**
 * Fetch article by slug
 */
async function getArticle(slug: string): Promise<ArticleWithRelations | null> {
  const payload = await getPayload({ config })

  // Note: 'articles' collection type not in generated CollectionSlug yet
  // TODO: Remove eslint-disable after running `npx payload generate:types`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'articles',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    depth: 2, // Populate author, category, tags, relatedArticles
    limit: 1,
  })

  return (result.docs?.[0] || null) as ArticleWithRelations | null
}

/**
 * Generate static params for all published articles
 * This enables static generation at build time.
 * Falls back to dynamic generation if database is unavailable during build.
 */
export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'articles',
      where: {
        status: { equals: 'published' },
      },
      limit: 1000,
      select: { slug: true },
    })

    return (result.docs || []).map((article: { slug: string }) => ({
      slug: article.slug,
    }))
  } catch {
    // Database unavailable during build (e.g., no local Postgres)
    // Return empty array to enable dynamic generation at runtime
    console.warn('[generateStaticParams] Database unavailable, using dynamic generation')
    return []
  }
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    return {
      title: 'Article Not Found | KnearMe',
    }
  }

  const title = article.seo?.metaTitle || article.title
  const description = article.seo?.metaDescription || article.excerpt || ''
  const ogImage = typeof article.seo?.ogImage === 'object' ? article.seo.ogImage?.url : undefined
  const featuredImage = typeof article.featuredImage === 'object' ? article.featuredImage?.url : undefined

  return {
    title: `${title} | KnearMe Blog`,
    description,
    robots: article.seo?.noIndex ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: typeof article.author === 'object' ? [article.author.name || ''] : [],
      images: ogImage || featuredImage ? [{ url: ogImage || featuredImage || '' }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage || featuredImage ? [ogImage || featuredImage || ''] : [],
    },
    alternates: article.seo?.canonicalUrl ? { canonical: article.seo.canonicalUrl } : {},
  }
}

/**
 * Article Detail Page Component
 */
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    notFound()
  }

  const author = typeof article.author === 'object' ? article.author : null
  const category = typeof article.category === 'object' ? article.category : null
  const tags = (article.tags || [])
    .map((tag) => (typeof tag === 'object' ? tag : null))
    .filter((tag): tag is NonNullable<typeof tag> => tag !== null)
  const relatedArticles = (article.relatedArticles || [])
    .map((related) => (typeof related === 'object' ? related : null))
    .filter((related): related is NonNullable<typeof related> => related !== null)
    .slice(0, 3)

  const featuredImage = typeof article.featuredImage === 'object' ? article.featuredImage : null
  const publishedDate = article.publishedAt ? new Date(article.publishedAt) : null
  const tableOfContents = article.tableOfContents || []

  // Generate JSON-LD for BlogPosting schema
  const jsonLd = generateBlogPostingSchema(article)

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-gray-500">
          <Link href="/blog" className="hover:text-gray-900 transition-colors">
            Blog
          </Link>
          {category?.name && (
            <>
              <span className="mx-2">/</span>
              <Link
                href={`/blog/category/${category.slug}`}
                className="hover:text-gray-900 transition-colors"
              >
                {category.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-900">{article.title}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          {/* Category Badge */}
          {category?.name && (
            <Link
              href={`/blog/category/${category.slug}`}
              className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800 uppercase tracking-wide mb-4"
            >
              {category.name}
            </Link>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            {article.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
            {/* Author */}
            {author?.name && (
              <Link
                href={`/blog/author/${author.slug}`}
                className="flex items-center gap-2 hover:text-gray-900 transition-colors"
              >
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
              </Link>
            )}

            {/* Date */}
            {publishedDate && (
              <>
                <span className="text-gray-300">•</span>
                <time dateTime={publishedDate.toISOString()}>
                  {format(publishedDate, 'MMMM d, yyyy')}
                </time>
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
                <Link
                  key={tag.id}
                  href={`/blog?tag=${tag.slug}`}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {tag.name}
                </Link>
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

        {/* Author Bio Section */}
        {author && (
          <AuthorSection author={author as AuthorObject} />
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <RelatedArticles articles={relatedArticles} />
        )}
      </article>
    </>
  )
}

/**
 * Rich Text Content Renderer
 *
 * Renders Lexical JSON content to HTML.
 * Handles common node types: paragraphs, headings, lists, links, text formatting.
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

  return (
    <>
      {(root.children as unknown[]).map((node, index) => (
        <RenderNode key={index} node={node} />
      ))}
    </>
  )
}

/**
 * Recursive node renderer for Lexical content
 */
function RenderNode({ node }: { node: unknown }) {
  if (!node || typeof node !== 'object') return null

  const nodeObj = node as Record<string, unknown>
  const type = nodeObj.type as string
  const tag = nodeObj.tag as string | undefined
  const children = nodeObj.children as unknown[] | undefined

  // Text node with formatting
  if (type === 'text') {
    let text = nodeObj.text as string
    const format = nodeObj.format as number | undefined

    // Handle text formatting (bitmask: 1=bold, 2=italic, 4=strikethrough, 8=underline, 16=code)
    if (format) {
      if (format & 16) text = `<code>${text}</code>`
      if (format & 1) text = `<strong>${text}</strong>`
      if (format & 2) text = `<em>${text}</em>`
      if (format & 4) text = `<s>${text}</s>`
      if (format & 8) text = `<u>${text}</u>`
    }

    return <span dangerouslySetInnerHTML={{ __html: text }} />
  }

  // Paragraph
  if (type === 'paragraph') {
    return (
      <p>
        {children?.map((child, i) => <RenderNode key={i} node={child} />)}
      </p>
    )
  }

  // Headings - add ID for table of contents navigation
  if (type === 'heading' && tag) {
    const headingText = extractNodeText(children)
    const headingId = headingText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const HeadingTag = tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    return (
      <HeadingTag id={headingId}>
        {children?.map((child, i) => <RenderNode key={i} node={child} />)}
      </HeadingTag>
    )
  }

  // Lists
  if (type === 'list') {
    const listTag = nodeObj.listType === 'number' ? 'ol' : 'ul'
    const ListTag = listTag as 'ol' | 'ul'
    return (
      <ListTag>
        {children?.map((child, i) => <RenderNode key={i} node={child} />)}
      </ListTag>
    )
  }

  // List item
  if (type === 'listitem') {
    return (
      <li>
        {children?.map((child, i) => <RenderNode key={i} node={child} />)}
      </li>
    )
  }

  // Link
  if (type === 'link') {
    const url = (nodeObj.fields as Record<string, unknown>)?.url as string || '#'
    const newTab = (nodeObj.fields as Record<string, unknown>)?.newTab as boolean
    return (
      <a
        href={url}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
      >
        {children?.map((child, i) => <RenderNode key={i} node={child} />)}
      </a>
    )
  }

  // Quote/Blockquote
  if (type === 'quote') {
    return (
      <blockquote>
        {children?.map((child, i) => <RenderNode key={i} node={child} />)}
      </blockquote>
    )
  }

  // Code block
  if (type === 'code') {
    const code = extractNodeText(children)
    return (
      <pre>
        <code>{code}</code>
      </pre>
    )
  }

  // Line break
  if (type === 'linebreak') {
    return <br />
  }

  // Default: render children if present
  if (children) {
    return (
      <>
        {children.map((child, i) => <RenderNode key={i} node={child} />)}
      </>
    )
  }

  return null
}

/**
 * Extract plain text from node children
 */
function extractNodeText(children: unknown[] | undefined): string {
  if (!children) return ''

  return children
    .map((child) => {
      if (!child || typeof child !== 'object') return ''
      const childObj = child as Record<string, unknown>
      if (childObj.type === 'text') return childObj.text as string
      if (Array.isArray(childObj.children)) {
        return extractNodeText(childObj.children as unknown[])
      }
      return ''
    })
    .join('')
}

/**
 * Author object type (extracted for clarity)
 */
interface AuthorObject {
  id: string
  name?: string
  slug?: string
  role?: string
  bio?: unknown
  avatar?: {
    url?: string
    alt?: string
  } | string
  social?: {
    twitter?: string
    linkedin?: string
    website?: string
  }
}

/**
 * Author Section Component
 */
function AuthorSection({ author }: { author: AuthorObject }) {
  const avatar = typeof author.avatar === 'object' ? author.avatar : null

  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {avatar?.url && (
          <Link href={`/blog/author/${author.slug}`}>
            <Image
              src={avatar.url}
              alt={author.name || 'Author'}
              width={64}
              height={64}
              className="rounded-full"
            />
          </Link>
        )}

        <div className="flex-1">
          {/* Name and Role */}
          <Link
            href={`/blog/author/${author.slug}`}
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            {author.name}
          </Link>
          {author.role ? (
            <p className="text-sm text-gray-500">{author.role}</p>
          ) : null}

          {/* Bio (first paragraph only for brevity) */}
          {author.bio ? (
            <div className="mt-2 text-gray-600 text-sm line-clamp-3">
              <RichTextContent content={author.bio} />
            </div>
          ) : null}

          {/* Social Links */}
          {author.social && (
            <div className="mt-3 flex gap-4">
              {author.social.twitter && (
                <a
                  href={`https://twitter.com/${author.social.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-500 transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {author.social.linkedin && (
                <a
                  href={author.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-700 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              )}
              {author.social.website && (
                <a
                  href={author.social.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                  aria-label="Website"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/**
 * Related Articles Component
 */
function RelatedArticles({ articles }: { articles: Array<NonNullable<ArticleWithRelations['relatedArticles']>[number] & object> }) {
  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => {
          if (typeof article === 'string') return null

          const featuredImage = typeof article.featuredImage === 'object' ? article.featuredImage : null
          const publishedDate = article.publishedAt ? new Date(article.publishedAt) : null

          return (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="group block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              {featuredImage?.url && (
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={featuredImage.url}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              )}

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {article.excerpt}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  {publishedDate && (
                    <time dateTime={publishedDate.toISOString()}>
                      {format(publishedDate, 'MMM d, yyyy')}
                    </time>
                  )}
                  {article.readingTime && (
                    <>
                      <span>•</span>
                      <span>{article.readingTime} min read</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/**
 * Generate BlogPosting JSON-LD schema
 * @see https://schema.org/BlogPosting
 */
function generateBlogPostingSchema(article: ArticleWithRelations) {
  const author = typeof article.author === 'object' ? article.author : null
  const featuredImage = typeof article.featuredImage === 'object' ? article.featuredImage : null
  const ogImage = typeof article.seo?.ogImage === 'object' ? article.seo.ogImage : null

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt || '',
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    wordCount: article.wordCount,
    ...(featuredImage?.url || ogImage?.url
      ? { image: featuredImage?.url || ogImage?.url }
      : {}),
    author: author
      ? {
          '@type': 'Person',
          name: author.name,
          url: author.slug ? `/blog/author/${author.slug}` : undefined,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'KnearMe',
      url: 'https://knearme.co',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `/blog/${article.slug}`,
    },
  }
}

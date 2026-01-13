/**
 * RSS Feed Route Handler
 *
 * Generates an RSS 2.0 feed for the blog with the 20 most recent published articles.
 *
 * @see PAY-045 in PRD for acceptance criteria
 * @see https://www.rssboard.org/rss-specification for RSS 2.0 spec
 *
 * Usage: Navigate to /blog/rss.xml to get the feed
 */
import { getArticles, getSiteSettings, type Article, type Author } from '@/lib/payload/client'

/**
 * Site URL for generating absolute links
 * @todo Consider moving to environment variable or site settings
 */
const SITE_URL = 'https://knearme.co'

/**
 * Escape XML special characters to prevent injection and malformed XML
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Convert a date string to RFC 822 format required by RSS 2.0
 * @see https://www.rssboard.org/rss-specification#optionalChannelElements
 */
function toRfc822Date(dateString: string): string {
  const date = new Date(dateString)
  return date.toUTCString()
}

/**
 * Get the author name from an article, handling both populated and ID-only references
 */
function getAuthorName(author: Author | string | undefined): string {
  if (!author) return 'KnearMe Team'
  if (typeof author === 'string') return 'KnearMe Team'
  return author.name || 'KnearMe Team'
}

/**
 * Generate RSS item XML for a single article
 */
function generateItem(article: Article): string {
  const link = `${SITE_URL}/blog/${article.slug}`
  const pubDate = article.publishedAt ? toRfc822Date(article.publishedAt) : toRfc822Date(article.createdAt)
  const author = getAuthorName(article.author)
  const description = article.excerpt || article.title

  return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${link}</link>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(author)}</author>
      <guid isPermaLink="true">${link}</guid>
    </item>`
}

/**
 * Generate the complete RSS 2.0 feed XML
 */
async function generateRssFeed(): Promise<string> {
  // Fetch site settings for feed metadata
  let siteName = 'KnearMe Blog'
  let siteDescription = 'Turn your finished work into your best salesperson.'

  try {
    const settings = await getSiteSettings()
    if (settings?.siteName) siteName = settings.siteName
    if (settings?.defaultMetaDescription) siteDescription = settings.defaultMetaDescription
  } catch {
    // Use defaults if settings unavailable
  }

  // Fetch the 20 most recent published articles
  const { docs: articles } = await getArticles({
    status: 'published',
    limit: 20,
    page: 1,
  })

  const items = articles.map(generateItem).join('\n')

  // Get last build date from most recent article, or current time if no articles
  let lastBuildDate = toRfc822Date(new Date().toISOString())
  const firstArticle = articles[0]
  if (firstArticle && firstArticle.publishedAt) {
    lastBuildDate = toRfc822Date(firstArticle.publishedAt)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`
}

/**
 * GET handler for the RSS feed
 * Returns XML with proper content type headers
 */
export async function GET() {
  try {
    const feed = await generateRssFeed()

    return new Response(feed, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
      },
    })
  } catch (error) {
    console.error('Failed to generate RSS feed:', error)

    // Return a minimal valid RSS feed on error
    const errorFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>KnearMe Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Blog feed temporarily unavailable</description>
  </channel>
</rss>`

    return new Response(errorFeed, {
      status: 200, // Return 200 to avoid breaking feed readers
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'no-cache', // Don't cache error state
      },
    })
  }
}

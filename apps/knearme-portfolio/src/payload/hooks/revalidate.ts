/**
 * Payload CMS Revalidation Hooks
 *
 * Triggers on-demand ISR revalidation when content is created, updated, or deleted.
 * Works with the /api/revalidate endpoint to ensure fresh content is served
 * immediately after publishing.
 *
 * @see PAY-027 in PRD for acceptance criteria
 * @see src/app/api/revalidate/route.ts for the revalidation endpoint
 */
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

/**
 * Get the site URL for revalidation requests.
 * Uses environment variable in production, localhost in development.
 */
function getSiteUrl(): string {
  // In production, use the configured site URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  // In development, use localhost (Next.js dev server)
  return 'http://localhost:3000'
}

/**
 * Get the revalidation secret from environment.
 * Falls back to PAYLOAD_SECRET if REVALIDATION_SECRET not set.
 */
function getRevalidationSecret(): string {
  return process.env.REVALIDATION_SECRET || process.env.PAYLOAD_SECRET || ''
}

/**
 * Trigger revalidation for specified paths.
 *
 * @param paths - Array of paths to revalidate (e.g., ['/blog', '/blog/my-article'])
 * @param type - Type of content for logging purposes
 */
async function triggerRevalidation(paths: string[], type: string): Promise<void> {
  const siteUrl = getSiteUrl()
  const secret = getRevalidationSecret()

  // Skip revalidation if no secret configured
  if (!secret) {
    console.warn('[Revalidate Hook] No revalidation secret configured, skipping')
    return
  }

  // Trigger revalidation for each path
  const revalidationPromises = paths.map(async (path) => {
    try {
      const response = await fetch(`${siteUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, secret, type }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error(`[Revalidate Hook] Failed to revalidate ${path}:`, error)
      } else {
        console.log(`[Revalidate Hook] Successfully revalidated: ${path}`)
      }
    } catch (error) {
      // Network errors in development are expected (server might not be running)
      console.warn(`[Revalidate Hook] Could not reach revalidation endpoint for ${path}:`, error)
    }
  })

  await Promise.all(revalidationPromises)
}

/**
 * Creates an afterChange hook for collections that revalidates specified paths.
 *
 * @param getPathsFn - Function that returns paths to revalidate based on document
 * @param collectionName - Name of the collection for logging
 * @returns Payload afterChange hook function
 *
 * @example
 * // In Articles collection:
 * hooks: {
 *   afterChange: [
 *     createRevalidateHook(
 *       (doc) => ['/blog', `/blog/${doc.slug}`],
 *       'articles'
 *     ),
 *   ],
 * }
 */
export function createRevalidateHook<T extends { id: string | number; slug?: string; _status?: string }>(
  getPathsFn: (doc: T) => string[],
  collectionName: string
): CollectionAfterChangeHook<T> {
  return async ({ doc, operation }) => {
    // Only revalidate on create/update, and only for published content
    // or when status changes (to catch publish/unpublish events)
    if (operation === 'create' || operation === 'update') {
      const paths = getPathsFn(doc)

      // If document has _status field, only revalidate when published
      // This handles draft saves without triggering unnecessary revalidation
      if (doc._status && doc._status !== 'published') {
        console.log(`[Revalidate Hook] Skipping revalidation for draft ${collectionName}`)
        return doc
      }

      if (paths.length > 0) {
        // Fire and forget - don't block the save operation
        triggerRevalidation(paths, collectionName).catch((error) => {
          console.error(`[Revalidate Hook] Error in ${collectionName} afterChange:`, error)
        })
      }
    }
    return doc
  }
}

/**
 * Creates an afterDelete hook for collections that revalidates specified paths.
 *
 * @param getPathsFn - Function that returns paths to revalidate based on document
 * @param collectionName - Name of the collection for logging
 * @returns Payload afterDelete hook function
 */
export function createRevalidateDeleteHook<T extends { id: string | number; slug?: string }>(
  getPathsFn: (doc: T) => string[],
  collectionName: string
): CollectionAfterDeleteHook<T> {
  return async ({ doc }) => {
    const paths = getPathsFn(doc)
    if (paths.length > 0) {
      triggerRevalidation(paths, `${collectionName}-delete`).catch((error) => {
        console.error(`[Revalidate Hook] Error in ${collectionName} afterDelete:`, error)
      })
    }
    return doc
  }
}

/**
 * Creates an afterChange hook for globals that revalidates specified paths.
 *
 * @param paths - Array of paths to revalidate
 * @param globalName - Name of the global for logging
 * @returns Payload global afterChange hook function
 */
export function createGlobalRevalidateHook(
  paths: string[],
  globalName: string
): GlobalAfterChangeHook {
  return async ({ doc }) => {
    triggerRevalidation(paths, globalName).catch((error) => {
      console.error(`[Revalidate Hook] Error in ${globalName} afterChange:`, error)
    })
    return doc
  }
}

/**
 * Pre-built path generators for common collection types
 */
export const revalidatePaths = {
  /**
   * Article revalidation paths: listing page + article detail page + sitemap
   * Sitemap is revalidated to ensure new articles appear in search engines.
   * @see PAY-053 in PRD for sitemap revalidation requirement
   */
  article: (doc: { slug?: string }) => [
    '/blog',
    ...(doc.slug ? [`/blog/${doc.slug}`] : []),
    '/sitemap-main.xml', // Revalidate sitemap when articles change
  ],

  /**
   * Author revalidation paths: author page + blog listing + sitemap
   * Sitemap is revalidated to ensure new author pages appear in search engines.
   */
  author: (doc: { slug?: string }) => [
    '/blog',
    ...(doc.slug ? [`/blog/author/${doc.slug}`] : []),
    '/sitemap-main.xml', // Revalidate sitemap when authors change
  ],

  /**
   * Category revalidation paths: category page + blog listing + sitemap
   * Sitemap is revalidated to ensure new category pages appear in search engines.
   */
  category: (doc: { slug?: string }) => [
    '/blog',
    ...(doc.slug ? [`/blog/category/${doc.slug}`] : []),
    '/sitemap-main.xml', // Revalidate sitemap when categories change
  ],

  /**
   * Landing page content paths (FAQs, Pricing, Features, Testimonials)
   */
  landingContent: () => ['/'],

  /**
   * Service type revalidation paths: services listing + service detail
   */
  serviceType: (doc: { slug?: string }) => [
    '/services',
    ...(doc.slug ? [`/services/${doc.slug}`] : []),
  ],

  /**
   * Puck page revalidation paths: page URL + sitemap
   * Revalidates the public URL of the Puck page when published.
   * @see PUCK-012 in PRD for ISR revalidation requirement
   */
  puckPage: (doc: { slug?: string }) => [
    ...(doc.slug ? [`/${doc.slug}`] : []),
    '/sitemap-main.xml', // Revalidate sitemap when pages change
  ],
}

/**
 * Puck Page Render Utility
 *
 * Provides helper functions for rendering Puck pages at clean URLs.
 * This enables migrating from /p/[slug] to clean URLs like /about, /services, etc.
 *
 * Usage:
 * ```tsx
 * // app/(marketing)/about/page.tsx
 * import { renderPuckPage, generatePuckMetadata } from '@/lib/puck/render'
 * import type { Metadata } from 'next'
 *
 * export async function generateMetadata(): Promise<Metadata> {
 *   return generatePuckMetadata('about')
 * }
 *
 * export default async function AboutPage() {
 *   return renderPuckPage('about')
 * }
 * ```
 *
 * @see PUCK-039 in PRD for acceptance criteria
 * @see /app/(marketing)/p/[...slug]/page.tsx for original implementation
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Render } from '@puckeditor/core'
import type { Data } from '@puckeditor/core'
import { config as puckConfig } from '@/lib/puck/config'

/**
 * PuckPage document type from Payload
 * Matches the puck-pages collection schema
 */
export interface PuckPageDocument {
  id: string
  title: string
  slug: string
  puckData: Data | null
  status: 'draft' | 'published'
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: {
      url?: string
    } | string
    noIndex?: boolean
  }
  updatedAt: string
  createdAt: string
}

/**
 * Options for rendering Puck pages
 */
export interface RenderPuckPageOptions {
  /**
   * Custom URL to use in structured data instead of /p/[slug]
   * Useful when rendering at a clean URL like /about
   */
  canonicalUrl?: string
}

/**
 * Fetch a published Puck page by slug
 *
 * @param slug - The page slug to fetch
 * @returns The page document or null if not found/not published
 */
export async function getPuckPage(slug: string): Promise<PuckPageDocument | null> {
  const payload = await getPayload({ config })

  // Query puck-pages collection for published page with matching slug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'puck-pages',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    limit: 1,
  })

  return (result.docs?.[0] || null) as PuckPageDocument | null
}

/**
 * Generate metadata for a Puck page
 *
 * Use this in your page's generateMetadata function to automatically
 * pull SEO data from the Puck page document.
 *
 * @example
 * ```tsx
 * // app/(marketing)/about/page.tsx
 * export async function generateMetadata(): Promise<Metadata> {
 *   return generatePuckMetadata('about')
 * }
 * ```
 *
 * @param slug - The page slug to fetch metadata for
 * @param canonicalUrl - Optional custom canonical URL (defaults to /p/[slug])
 * @returns Metadata object for Next.js
 */
export async function generatePuckMetadata(
  slug: string,
  canonicalUrl?: string
): Promise<Metadata> {
  const page = await getPuckPage(slug)

  if (!page) {
    return {
      title: 'Page Not Found | KnearMe',
    }
  }

  const title = page.seo?.metaTitle || page.title
  const description = page.seo?.metaDescription || ''
  const ogImage = typeof page.seo?.ogImage === 'object' ? page.seo.ogImage?.url : undefined
  const url = canonicalUrl || `https://knearme.co/p/${page.slug}`

  return {
    title: `${title} | KnearMe`,
    description,
    robots: page.seo?.noIndex ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  }
}

/**
 * Render a Puck page by slug
 *
 * Fetches the published Puck page and renders it using the Puck Render component.
 * Calls notFound() if the page doesn't exist or is not published.
 *
 * @example
 * ```tsx
 * // app/(marketing)/about/page.tsx
 * export default async function AboutPage() {
 *   return renderPuckPage('about')
 * }
 *
 * // With custom canonical URL for structured data
 * export default async function AboutPage() {
 *   return renderPuckPage('about', { canonicalUrl: 'https://knearme.co/about' })
 * }
 * ```
 *
 * @param slug - The page slug to render
 * @param options - Optional configuration for rendering
 * @returns JSX element containing the rendered Puck page
 * @throws notFound() if page doesn't exist or is not published
 */
export async function renderPuckPage(
  slug: string,
  options: RenderPuckPageOptions = {}
): Promise<React.ReactElement> {
  const page = await getPuckPage(slug)

  if (!page) {
    notFound()
  }

  // If no puckData, show empty page (newly created page without content)
  const data = page.puckData || {
    root: {},
    content: [],
    zones: {},
  }

  // Use custom canonical URL or default to /p/[slug]
  const pageUrl = options.canonicalUrl || `https://knearme.co/p/${page.slug}`

  // Generate JSON-LD structured data
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.seo?.metaTitle || page.title,
    description: page.seo?.metaDescription || '',
    url: pageUrl,
    dateModified: page.updatedAt,
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      {/* Render Puck page content */}
      <div className="puck-page">
        <Render config={puckConfig} data={data} />
      </div>
    </>
  )
}

/**
 * Check if a Puck page exists and is published
 *
 * Useful for conditional rendering or redirects.
 *
 * @param slug - The page slug to check
 * @returns true if the page exists and is published
 */
export async function puckPageExists(slug: string): Promise<boolean> {
  const page = await getPuckPage(slug)
  return page !== null
}

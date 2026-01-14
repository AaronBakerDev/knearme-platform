/**
 * Puck Pages Public Render Route
 *
 * Renders published Puck visual editor pages on the public frontend.
 * Uses the Puck Render component with the same config as the editor.
 *
 * Route: /p/[slug] (e.g., /p/about, /p/landing)
 * Using /p/ prefix to avoid conflicts with other marketing routes.
 *
 * Features:
 * - Server-side rendering for SEO
 * - ISR with hourly revalidation
 * - Only shows published pages (draft returns 404)
 * - Dynamic metadata from page SEO fields
 * - JSON-LD structured data for WebPage schema
 *
 * @see PUCK-011 in PRD for acceptance criteria
 * @see https://puckeditor.com/docs/api-reference/components/render
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Render } from '@puckeditor/core'
import type { Data } from '@puckeditor/core'
import { config as puckConfig } from '@/lib/puck/config'

/**
 * Revalidate every hour for ISR
 * Payload afterChange hook also triggers on-demand revalidation
 */
export const revalidate = 3600

/**
 * PuckPage document type from Payload
 */
interface PuckPageDocument {
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

interface PuckPageProps {
  params: Promise<{ slug: string[] }>
}

/**
 * Fetch a published Puck page by slug
 * Returns null if page doesn't exist or is not published
 */
async function getPuckPage(slug: string): Promise<PuckPageDocument | null> {
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
 * Generate static params for all published Puck pages
 * Enables static generation at build time
 */
export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'puck-pages',
      where: {
        status: { equals: 'published' },
      },
      limit: 1000,
      select: { slug: true },
    })

    return (result.docs || []).map((page: { slug: string }) => ({
      slug: [page.slug],
    }))
  } catch {
    // Database unavailable during build - use dynamic generation
    console.warn('[generateStaticParams] Puck pages: Database unavailable, using dynamic generation')
    return []
  }
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({ params }: PuckPageProps): Promise<Metadata> {
  const { slug: slugParts } = await params
  const slug = slugParts.join('/')
  const page = await getPuckPage(slug)

  if (!page) {
    return {
      title: 'Page Not Found | KnearMe',
    }
  }

  const title = page.seo?.metaTitle || page.title
  const description = page.seo?.metaDescription || ''
  const ogImage = typeof page.seo?.ogImage === 'object' ? page.seo.ogImage?.url : undefined

  return {
    title: `${title} | KnearMe`,
    description,
    robots: page.seo?.noIndex ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      title,
      description,
      type: 'website',
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
 * Puck Page Render Component
 *
 * Fetches published Puck page data and renders using Puck's Render component.
 * Returns 404 for non-existent or draft pages.
 */
export default async function PuckPage({ params }: PuckPageProps) {
  const { slug: slugParts } = await params
  const slug = slugParts.join('/')
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

  // Generate JSON-LD structured data
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.seo?.metaTitle || page.title,
    description: page.seo?.metaDescription || '',
    url: `https://knearme.co/p/${page.slug}`,
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

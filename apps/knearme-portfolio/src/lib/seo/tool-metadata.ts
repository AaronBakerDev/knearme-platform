import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/tools/catalog'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com'

/**
 * Generate consistent SEO metadata for homeowner tools.
 *
 * Tools are the primary inbound assets, so each should have a unique
 * title, description, and canonical URL.
 */
export function generateToolMetadata(slug: string, overrides: Partial<Metadata> = {}): Metadata {
  const tool = getToolBySlug(slug)

  const canonical = `${SITE_URL}/tools/${slug}`
  const title = tool
    ? `${tool.title} | Homeowner Tool | KnearMe`
    : 'Homeowner Tool | KnearMe'
  const description = tool?.description ?? 'Free, practical tools for homeowners planning masonry repairs.'

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: tool?.title ?? title,
      description,
      type: 'website',
      url: canonical,
    },
    ...overrides,
  }
}


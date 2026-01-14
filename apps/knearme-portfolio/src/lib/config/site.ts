const DEFAULT_SITE_URL = 'https://knearme.co'

const normalizeUrl = (url: string) => url.replace(/\/+$/, '')

/**
 * Canonical site URL used for metadata, OpenGraph, sitemaps, and structured data.
 * Pull from NEXT_PUBLIC_SITE_URL when provided, otherwise fall back to the live knearme.co domain.
 */
export const SITE_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL,
)

export const metadataBase = new URL(SITE_URL)

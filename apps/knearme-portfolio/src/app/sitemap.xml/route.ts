/**
 * Sitemap Index Route - /sitemap.xml
 *
 * Returns a sitemap index file that points to segmented sitemaps.
 * This is the entry point for search engine crawlers.
 *
 * Segmentation strategy:
 * - /sitemap-main.xml: Static pages, portfolios, contractors, learning center
 *
 * @see https://www.sitemaps.org/protocol.html#index
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 24 hours

export async function GET() {
  try {
    // Generate sitemap index XML
    const sitemapUrls = [
      // Main sitemap (static pages, portfolios, contractors, etc.)
      {
        loc: `${SITE_URL}/sitemap-main.xml`,
        lastmod: new Date().toISOString(),
      },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    (sitemap) => `  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24 hours
      },
    });
  } catch (error) {
    logger.error('[sitemap.xml] Error generating sitemap index', { error });

    // Return minimal sitemap on error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-main.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;

    return new NextResponse(fallbackXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour on error
      },
    });
  }
}

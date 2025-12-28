/**
 * Per-State Business Sitemap Route - /sitemap-directory-[state].xml
 *
 * Dynamic route that generates a sitemap for all business listings in a specific state.
 * Each state gets its own sitemap to keep file sizes manageable and comply with
 * Google's 50,000 URL limit per sitemap.
 *
 * Examples:
 * - /sitemap-directory-colorado.xml (all Colorado businesses)
 * - /sitemap-directory-texas.xml (all Texas businesses)
 *
 * URL format: /find/{state}/{city}/{category}/{business-slug}
 *
 * Note: We currently don't have business detail pages implemented, so these URLs
 * will 404 until we build those pages. This sitemap prepares for that feature.
 */

import { NextResponse } from 'next/server';
import { getBusinessesForState, getStateBySlug } from '@/lib/data/directory';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 24 hours (business listings change less frequently)

/**
 * Generates sitemap entry XML for a single URL
 */
function generateUrlEntry(
  url: string,
  lastmod: Date,
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
  priority: number
): string {
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(2)}</priority>
  </url>`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<Record<string, string>> }
) {
  try {
    const { state } = await context.params as { state: string };

    // Validate state exists
    const stateData = await getStateBySlug(state);
    if (!stateData) {
      return new NextResponse('State not found', { status: 404 });
    }

    // Get all businesses for this state
    const businesses = await getBusinessesForState(state);

    // Generate sitemap entries
    const urls: string[] = businesses.map((business) => {
      const url = `${SITE_URL}/find/${business.state_slug}/${business.city_slug}/${business.category_slug}/${business.slug}`;

      // Use current date as lastmod (we don't track individual business updates yet)
      // In the future, add updated_at column to directory_places table
      return generateUrlEntry(url, new Date(), 'monthly', 0.5);
    });

    console.log(
      `[sitemap-directory-${state}.xml] Generated ${urls.length} business URLs for ${stateData.state_name}`
    );

    // Check if we're approaching the 50,000 URL limit
    if (urls.length > 45000) {
      console.warn(
        `[sitemap-directory-${state}.xml] WARNING: ${stateData.state_name} has ${urls.length} businesses, approaching 50k limit. Consider further segmentation.`
      );
    }

    // Generate sitemap XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24 hours
      },
    });
  } catch (error) {
    console.error('[sitemap-directory-[state].xml] Error generating sitemap:', error);

    // Return empty sitemap on error (better than 500 error for SEO)
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

    return new NextResponse(fallbackXml, {
      status: 500,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=600, s-maxage=600', // 10 minutes on error
      },
    });
  }
}

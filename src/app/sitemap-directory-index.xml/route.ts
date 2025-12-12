/**
 * Directory Index Sitemap Route - /sitemap-directory-index.xml
 *
 * Contains directory navigation pages (not individual business listings):
 * - /find (directory landing page)
 * - /find/{state} (state pages)
 * - /find/{state}/{city} (city pages)
 * - /find/{state}/{city}/{category} (category pages)
 *
 * Individual business detail pages are in per-state sitemaps
 * (/sitemap-directory-[state].xml) for better scalability.
 *
 * Expected URL count: ~3,000 (613 cities + categories)
 */

import { NextResponse } from 'next/server';
import { getStateStats, getCitiesForState, getCategoriesForCity } from '@/lib/data/directory';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hour

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

export async function GET() {
  try {
    const urls: string[] = [];

    // Directory landing page
    urls.push(
      generateUrlEntry(`${SITE_URL}/find`, new Date(), 'weekly', 0.8)
    );

    // Get all states
    const states = await getStateStats();

    // State pages
    states.forEach((state) => {
      urls.push(
        generateUrlEntry(
          `${SITE_URL}/find/${state.state_slug}`,
          new Date(),
          'weekly',
          0.7
        )
      );
    });

    // City pages and category pages
    for (const state of states) {
      const cities = await getCitiesForState(state.state_slug);

      for (const city of cities) {
        // City page
        urls.push(
          generateUrlEntry(
            `${SITE_URL}/find/${state.state_slug}/${city.city_slug}`,
            new Date(),
            'weekly',
            0.6
          )
        );

        // Category pages for this city
        const categories = await getCategoriesForCity(state.state_slug, city.city_slug);

        categories.forEach((category) => {
          urls.push(
            generateUrlEntry(
              `${SITE_URL}/find/${state.state_slug}/${city.city_slug}/${category.category_slug}`,
              new Date(),
              'weekly',
              0.65
            )
          );
        });
      }
    }

    console.log(
      `[sitemap-directory-index.xml] Generated ${urls.length} directory navigation URLs`
    );

    // Generate sitemap XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour
      },
    });
  } catch (error) {
    console.error('[sitemap-directory-index.xml] Error generating sitemap:', error);

    // Return minimal sitemap on error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/find</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=600, s-maxage=600', // 10 minutes on error
      },
    });
  }
}

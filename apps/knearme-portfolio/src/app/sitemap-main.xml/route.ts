/**
 * Main Sitemap Route - /sitemap-main.xml
 *
 * Contains all static and dynamic pages.
 * Includes:
 * - Static pages (home, businesses, etc.)
 * - National service landing pages
 * - Learning center articles
 * - Homeowner tools
 * - Published portfolio projects
 * - Business profiles
 * - City landing pages
 * - City masonry hub pages
 * - Service type by city pages
 *
 * @see /src/app/sitemap.ts (old implementation - being replaced)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getServiceTypeSlugs } from '@/lib/data/services';
import { getAllArticles } from '@/lib/content/mdx';
import { LIVE_TOOLS } from '@/lib/tools/catalog';
import { logger } from '@/lib/logging';
import type { Database } from '@/types/database';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hour

interface ReviewArticleRow {
  slug: string;
  generated_at: string;
  status: string;
}

type ReviewArticleInsert = ReviewArticleRow;
type ReviewArticleUpdate = Partial<ReviewArticleRow>;

type SitemapDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      review_articles: {
        Row: ReviewArticleRow;
        Insert: ReviewArticleInsert;
        Update: ReviewArticleUpdate;
        Relationships: [];
      };
    };
  };
};

type SitemapSupabaseClient = SupabaseClient<SitemapDatabase>;

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

    // Static pages
    urls.push(
      generateUrlEntry(SITE_URL, new Date(), 'daily', 1.0),
      generateUrlEntry(`${SITE_URL}/businesses`, new Date(), 'daily', 0.8)
    );

    // National service landing pages (from database)
    const serviceSlugs = await getServiceTypeSlugs();
    serviceSlugs.forEach((type) => {
      urls.push(
        generateUrlEntry(`${SITE_URL}/services/${type}`, new Date(), 'weekly', 0.75)
      );
    });

    // Learning center - MDX articles
    const articles = getAllArticles();
    urls.push(
      generateUrlEntry(`${SITE_URL}/learn`, new Date(), 'weekly', 0.7)
    );
    articles.forEach((article) => {
      const lastmod = article.frontmatter.updatedAt
        ? new Date(article.frontmatter.updatedAt)
        : new Date(article.frontmatter.publishedAt);

      urls.push(
        generateUrlEntry(`${SITE_URL}/learn/${article.slug}`, lastmod, 'monthly', 0.6)
      );
    });

    // Homeowner tools
    urls.push(
      generateUrlEntry(`${SITE_URL}/tools`, new Date(), 'weekly', 0.75)
    );
    LIVE_TOOLS.forEach((tool) => {
      urls.push(
        generateUrlEntry(`${SITE_URL}/tools/${tool.slug}`, new Date(), 'monthly', 0.7)
      );
    });

    // Dynamic content from database (if service role key is available)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createAdminClient() as SitemapSupabaseClient;

      // Review articles from database (Learning center)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: reviewArticles } = await (supabase as any)
        .from('review_articles')
        .select('slug, generated_at')
        .eq('status', 'published');

      const reviewList = (reviewArticles ?? []) as ReviewArticleRow[];

      reviewList.forEach((article) => {
        urls.push(
          generateUrlEntry(
            `${SITE_URL}/learn/${article.slug}`,
            new Date(article.generated_at),
            'monthly',
            0.6
          )
        );
      });

      // Published projects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: projects } = await (supabase as any)
        .from('projects')
        .select('slug, city_slug, project_type_slug, updated_at, published_at')
        .eq('status', 'published')
        .not('slug', 'is', null)
        .not('city_slug', 'is', null)
        .not('project_type_slug', 'is', null);

      type SitemapProject = {
        slug: string;
        city_slug: string;
        project_type_slug: string;
        updated_at: string | null;
        published_at: string | null;
      };
      const projectsList = (projects ?? []) as SitemapProject[];

      projectsList.forEach((project) => {
        const lastmod = new Date(project.updated_at || project.published_at!);
        urls.push(
          generateUrlEntry(
            `${SITE_URL}/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`,
            lastmod,
            'weekly',
            0.7
          )
        );
      });

      // Businesses with published projects (contractors table)
      const { data: contractors } = await supabase
        .from('contractors')
        .select(`
          id,
          profile_slug,
          city_slug,
          updated_at,
          projects!inner(status)
        `)
        .eq('projects.status', 'published')
        .not('city_slug', 'is', null)
        .not('profile_slug', 'is', null);

      type SitemapContractor = {
        id: string;
        profile_slug: string;
        city_slug: string;
        updated_at: string;
      };
      const contractorsList = (contractors ?? []) as SitemapContractor[];

      // Deduplicate contractors (join may return duplicates)
      const uniqueContractors = new Map<string, SitemapContractor>();
      contractorsList.forEach((c) => {
        if (!uniqueContractors.has(c.id)) {
          uniqueContractors.set(c.id, c);
        }
      });

      Array.from(uniqueContractors.values()).forEach((contractor) => {
        urls.push(
          generateUrlEntry(
            `${SITE_URL}/businesses/${contractor.city_slug}/${contractor.profile_slug}`,
            new Date(contractor.updated_at),
            'weekly',
            0.6
          )
        );
      });

      // City landing pages
      const cities = new Set<string>();
      projectsList.forEach((p) => {
        if (p.city_slug) cities.add(p.city_slug);
      });

      Array.from(cities).forEach((city) => {
        urls.push(
          generateUrlEntry(`${SITE_URL}/${city}`, new Date(), 'weekly', 0.6)
        );
      });

      // City masonry hub pages
      Array.from(cities).forEach((city) => {
        urls.push(
          generateUrlEntry(`${SITE_URL}/${city}/masonry`, new Date(), 'weekly', 0.65)
        );
      });

      // Service type by city pages
      const cityTypeComboSet = new Set<string>();
      projectsList.forEach((p) => {
        if (p.city_slug && p.project_type_slug) {
          cityTypeComboSet.add(`${p.city_slug}|${p.project_type_slug}`);
        }
      });

      Array.from(cityTypeComboSet).forEach((combo) => {
        const [city, type] = combo.split('|');
        const projectCount = projectsList.filter(
          (p) => p.city_slug === city && p.project_type_slug === type
        ).length;

        // Higher priority for combos with more projects (0.55 - 0.7)
        const priority = Math.min(0.7, 0.55 + projectCount * 0.03);

        urls.push(
          generateUrlEntry(
            `${SITE_URL}/${city}/masonry/${type}`,
            new Date(),
            'weekly',
            priority
          )
        );
      });
    }

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
    logger.error('[sitemap-main.xml] Error generating sitemap', { error });

    // Return minimal sitemap on error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.00</priority>
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

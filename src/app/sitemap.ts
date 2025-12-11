/**
 * Dynamic sitemap generator for SEO.
 *
 * Generates sitemap.xml with all published projects and contractor profiles.
 * Updates automatically as new content is published.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/sitemap
 */

import { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { NATIONAL_SERVICE_TYPES } from '@/lib/data/services';
import { getAllArticles } from '@/lib/content/mdx';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages (always included)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/contractors`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // National service landing pages (/services/{type})
  // These are static pages that target informational keywords
  const nationalServicePages: MetadataRoute.Sitemap = NATIONAL_SERVICE_TYPES.map((type) => ({
    url: `${SITE_URL}/services/${type}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  // Learning center pages (/learn and /learn/{slug})
  // Educational content for SEO and user engagement
  const articles = getAllArticles();
  const learnPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/learn`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...articles.map((article) => ({
      url: `${SITE_URL}/learn/${article.slug}`,
      lastModified: article.frontmatter.updatedAt
        ? new Date(article.frontmatter.updatedAt)
        : new Date(article.frontmatter.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  // If service role key is missing, return static pages + national service pages + learn pages
  // Dynamic content will be added when the key is configured
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[sitemap] Skipping dynamic content: SUPABASE_SERVICE_ROLE_KEY not configured');
    return [...staticPages, ...nationalServicePages, ...learnPages];
  }

  try {
    const supabase = createAdminClient();

    // Published projects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: projects } = await (supabase as any)
      .from('projects')
      .select('slug, city_slug, project_type_slug, updated_at, published_at')
      .eq('status', 'published')
      .not('slug', 'is', null)
      .not('city_slug', 'is', null)
      .not('project_type_slug', 'is', null);

    // Type assertion for projects
    type SitemapProject = {
      slug: string;
      city_slug: string;
      project_type_slug: string;
      updated_at: string | null;
      published_at: string | null;
    };
    const projectsList = (projects || []) as SitemapProject[];

    const projectPages: MetadataRoute.Sitemap = projectsList.map((project) => ({
      url: `${SITE_URL}/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`,
      lastModified: new Date(project.updated_at || project.published_at!),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Contractors with published projects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contractors } = await (supabase as any)
      .from('contractors')
      .select(`
        id,
        city_slug,
        updated_at,
        projects!inner(status)
      `)
      .eq('projects.status', 'published')
      .not('city_slug', 'is', null);

    // Type assertion for contractors
    type SitemapContractor = {
      id: string;
      city_slug: string;
      updated_at: string;
    };
    const contractorsList = (contractors || []) as SitemapContractor[];

    // Deduplicate contractors (the join may return duplicates)
    const uniqueContractors = new Map<string, SitemapContractor>();
    contractorsList.forEach((c) => {
      if (!uniqueContractors.has(c.id)) {
        uniqueContractors.set(c.id, c);
      }
    });

    const contractorPages: MetadataRoute.Sitemap = Array.from(uniqueContractors.values()).map(
      (contractor) => ({
        url: `${SITE_URL}/contractors/${contractor.city_slug}/${contractor.id}`,
        lastModified: new Date(contractor.updated_at),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    );

    // City landing pages (aggregate by city)
    const cities = new Set<string>();
    projectsList.forEach((p) => {
      if (p.city_slug) cities.add(p.city_slug);
    });

    const cityPages: MetadataRoute.Sitemap = Array.from(cities).map((city) => ({
      url: `${SITE_URL}/${city}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    // City hub masonry pages (/{city}/masonry)
    const cityMasonryPages: MetadataRoute.Sitemap = Array.from(cities).map((city) => ({
      url: `${SITE_URL}/${city}/masonry`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.65,
    }));

    // Service type by city pages (/{city}/masonry/{type})
    // Aggregate unique city + service type combinations
    const cityTypeComboSet = new Set<string>();
    projectsList.forEach((p) => {
      if (p.city_slug && p.project_type_slug) {
        cityTypeComboSet.add(`${p.city_slug}|${p.project_type_slug}`);
      }
    });

    const serviceTypePages: MetadataRoute.Sitemap = Array.from(cityTypeComboSet).map((combo) => {
      const [city, type] = combo.split('|');
      // Count projects for this combo to set priority
      const projectCount = projectsList.filter(
        (p) => p.city_slug === city && p.project_type_slug === type
      ).length;

      return {
        url: `${SITE_URL}/${city}/masonry/${type}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        // Higher priority for combos with more projects (0.55 - 0.7)
        priority: Math.min(0.7, 0.55 + (projectCount * 0.03)),
      };
    });

    return [
      ...staticPages,
      ...nationalServicePages,
      ...learnPages,
      ...projectPages,
      ...contractorPages,
      ...cityPages,
      ...cityMasonryPages,
      ...serviceTypePages,
    ];
  } catch (error) {
    console.error('[sitemap] Error generating dynamic sitemap:', error);
    return [...staticPages, ...nationalServicePages, ...learnPages];
  }
}

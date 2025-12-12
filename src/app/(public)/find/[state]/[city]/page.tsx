/**
 * City Directory Hub Page - /find/{state}/{city}
 *
 * Shows all available contractor categories in a city with stats.
 * Provides navigation to category-specific listings.
 *
 * Features:
 * - City hero with business stats
 * - Category cards grid with counts
 * - Top-rated businesses preview
 * - Cross-linking to portfolio projects
 * - ISR with 24-hour revalidation
 *
 * @see /src/lib/data/directory.ts for data layer
 * @see /src/lib/constants/directory-categories.ts for category metadata
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Building2, Star, ArrowRight } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import {
  getCityStats,
  getCategoriesForCity,
  getCategoryListings,
} from '@/lib/data/directory';
import { getCategoryMeta } from '@/lib/constants/directory-categories';
import { generateBreadcrumbSchema, schemaToString } from '@/lib/seo/structured-data';
import type { DirectoryPlace } from '@/types/directory';

// ISR: Revalidate every 24 hours
export const revalidate = 86400;

type PageParams = {
  params: Promise<{
    state: string;
    city: string;
  }>;
};

/**
 * Pre-render top 50 cities by business count.
 */
export async function generateStaticParams() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[generateStaticParams] Skipping: SUPABASE_SERVICE_ROLE_KEY not configured');
    return [];
  }

  try {
    const supabase = createAdminClient();

    // Get top cities across all states by business count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('directory_places')
      .select('state_slug, city_slug')
      .not('state_slug', 'is', null)
      .not('city_slug', 'is', null)
      .limit(1000);

    if (!data) return [];

    // Count businesses per city
    const cityMap = new Map<string, { state_slug: string; city_slug: string; count: number }>();

    data.forEach((place: { state_slug: string; city_slug: string }) => {
      const key = `${place.state_slug}/${place.city_slug}`;
      const existing = cityMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        cityMap.set(key, {
          state_slug: place.state_slug,
          city_slug: place.city_slug,
          count: 1,
        });
      }
    });

    // Sort by count and take top 50
    return Array.from(cityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)
      .map((city) => ({
        state: city.state_slug,
        city: city.city_slug,
      }));
  } catch (error) {
    console.error('[generateStaticParams] Error:', error);
    return [];
  }
}

/**
 * Generate metadata for city page.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { state, city } = await params;
  const cityStats = await getCityStats(state, city);

  if (!cityStats) {
    return { title: 'City Not Found' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';
  const title = `Contractors in ${cityStats.city_name}, ${cityStats.state_name}`;
  const description = `Find ${cityStats.business_count} verified contractors in ${cityStats.city_name}. Browse ${cityStats.category_count} categories including masonry, roofing, concrete, and more.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/find/${state}/${city}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${siteUrl}/find/${state}/${city}`,
    },
  };
}

/**
 * City Directory Hub Page Component.
 */
export default async function CityDirectoryPage({ params }: PageParams) {
  const { state, city } = await params;

  // Fetch city stats
  const cityStats = await getCityStats(state, city);
  if (!cityStats) {
    notFound();
  }

  // Fetch categories for this city
  const categories = await getCategoriesForCity(state, city);

  // Fetch top 3 businesses from any category for preview
  let topBusinesses: DirectoryPlace[] = [];
  if (categories.length > 0) {
    const topCategory = categories[0]!;
    topBusinesses = await getCategoryListings(state, city, topCategory.category_slug, 1, 3);
  }

  // Check if there are portfolio projects in this city
  const supabase = createAdminClient();
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('city_slug', city)
    .eq('status', 'published');

  // Breadcrumbs
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Find Contractors', url: '/find' },
    { name: cityStats.state_name, url: `/find/${state}` },
    { name: cityStats.city_name, url: `/find/${state}/${city}` },
  ];

  // Service schema for areaServed
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Contractor Directory - ${cityStats.city_name}`,
    description: `Browse ${cityStats.business_count} contractors in ${cityStats.city_name} across ${cityStats.category_count} categories`,
    areaServed: {
      '@type': 'City',
      name: cityStats.city_name,
      containedInPlace: {
        '@type': 'State',
        name: cityStats.state_name,
      },
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(serviceSchema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Header with Breadcrumbs */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* City Hero */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-medium">
                {cityStats.city_name}, {cityStats.state_name}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Contractors in {cityStats.city_name}
            </h1>

            <p className="text-lg text-muted-foreground mb-6">
              Browse {cityStats.business_count.toLocaleString()} verified contractors across{' '}
              {cityStats.category_count} categories. Find the right professional for your project.
            </p>

            {/* City Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{cityStats.business_count}</div>
                  <div className="text-xs text-muted-foreground">Businesses</div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                <Star className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{cityStats.category_count}</div>
                  <div className="text-xs text-muted-foreground">Categories</div>
                </div>
              </div>

              {cityStats.avg_rating && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold">{cityStats.avg_rating.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Avg Rating</div>
                  </div>
                </div>
              )}
            </div>

            {/* Portfolio Cross-link */}
            {projectCount && projectCount > 0 && (
              <Card className="mt-6 border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <p className="text-sm mb-3">
                    <strong>{projectCount}</strong> masonry portfolio{' '}
                    {projectCount === 1 ? 'project' : 'projects'} available in {cityStats.city_name}
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${city}/masonry`}>
                      View Portfolio Projects <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Categories Grid */}
          <section className="max-w-6xl mx-auto mb-12">
            <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                const meta = getCategoryMeta(category.category_slug);

                return (
                  <Link
                    key={category.category_slug}
                    href={`/find/${state}/${city}/${category.category_slug}`}
                  >
                    <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg">{category.category_name}</CardTitle>
                          <Badge variant="secondary" className="ml-2 shrink-0">
                            {category.business_count}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {meta?.shortDescription || `Find ${category.category_name.toLowerCase()} services in ${cityStats.city_name}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          {category.avg_rating && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{category.avg_rating.toFixed(1)}</span>
                            </div>
                          )}
                          <span className="text-primary font-medium">
                            View All <ArrowRight className="inline h-4 w-4 ml-1" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Top-Rated Businesses Preview */}
          {topBusinesses.length > 0 && (
            <section className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Featured Businesses</h2>

              <div className="space-y-4">
                {topBusinesses.map((business) => (
                  <Card key={business.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{business.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {business.category}
                          </p>
                          {business.address && (
                            <p className="text-sm text-muted-foreground flex items-start gap-1">
                              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                              <span>{business.address}</span>
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          {business.rating && (
                            <div className="flex items-center gap-1 mb-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-semibold">{business.rating.toFixed(1)}</span>
                              {business.rating_count && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({business.rating_count})
                                </span>
                              )}
                            </div>
                          )}
                          {business.website && (
                            <Button asChild variant="outline" size="sm" className="mt-2">
                              <a
                                href={business.website}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Visit Website
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {categories.length > 0 && (
                <div className="text-center mt-6">
                  <Button asChild variant="outline">
                    <Link href={`/find/${state}/${city}/${categories[0]!.category_slug}`}>
                      View All {categories[0]!.category_name} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </>
  );
}

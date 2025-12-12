/**
 * State Hub Page - Browse contractors and cities in a specific state.
 *
 * URL: /find/{state-slug}
 * Example: /find/colorado
 *
 * Features:
 * - State-level statistics and hero
 * - City grid showing all cities in the state
 * - Category breakdown for the state
 * - JSON-LD ItemList of cities for SEO
 * - Pre-rendered for top 20 states by business count
 *
 * @see /src/lib/data/directory.ts for data layer
 * @see /src/components/directory/CityGrid.tsx for city grid component
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Building2, Star, ArrowRight } from 'lucide-react';
import { getStateBySlug, getCitiesForState, getStateStats } from '@/lib/data/directory';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type PageParams = {
  params: Promise<{
    state: string;
  }>;
};

/**
 * Format state slug to display name.
 * @example "colorado" -> "Colorado"
 */
function formatStateName(stateSlug: string, stateName?: string): string {
  if (stateName) return stateName;
  return stateSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate static params for pre-rendering state pages.
 * Pre-renders top 20 states by business count.
 */
export async function generateStaticParams() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[generateStaticParams] Skipping: SUPABASE_SERVICE_ROLE_KEY not configured');
    return [];
  }

  try {
    const states = await getStateStats();

    // Pre-render top 20 states by business count
    return states.slice(0, 20).map((state) => ({
      state: state.state_slug,
    }));
  } catch (error) {
    console.error('[generateStaticParams] Error fetching states:', error);
    return [];
  }
}

/**
 * Generate metadata for SEO including OG tags.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

  const state = await getStateBySlug(stateSlug);

  if (!state) {
    return {
      title: 'State Not Found',
    };
  }

  const stateName = formatStateName(stateSlug, state.state_name);
  const title = `Find Contractors in ${stateName} | KnearMe`;
  const description = `Browse ${state.business_count.toLocaleString()} verified contractors across ${state.city_count} ${state.city_count === 1 ? 'city' : 'cities'} in ${stateName}. View portfolios, read reviews, and connect with local professionals.`;

  return {
    title,
    description,
    keywords: `contractors ${stateName}, ${stateName} contractors, find contractors ${stateName}, local contractors, home improvement ${stateName}`,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/find/${stateSlug}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${siteUrl}/find/${stateSlug}`,
    },
  };
}

/**
 * State Hub Page Component.
 */
export default async function StateHubPage({ params }: PageParams) {
  const { state: stateSlug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

  // Fetch state statistics
  const state = await getStateBySlug(stateSlug);

  if (!state) {
    notFound();
  }

  // Fetch cities in this state
  const cities = await getCitiesForState(stateSlug);

  const stateName = formatStateName(stateSlug, state.state_name);

  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Find Contractors', url: '/find' },
    { name: stateName, url: `/find/${stateSlug}` },
  ];

  // JSON-LD ItemList schema for cities
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Cities in ${stateName}`,
    description: `List of cities with contractors in ${stateName}`,
    numberOfItems: cities.length,
    itemListElement: cities.map((city, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Place',
        name: city.city_name,
        url: `${siteUrl}/find/${stateSlug}/${city.city_slug}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: city.city_name,
          addressRegion: stateName,
        },
      },
    })),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Header with Breadcrumbs */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 md:p-12">
            <div className="text-5xl mb-4">📍</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Contractors in {stateName}
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-[70ch] mx-auto leading-relaxed">
              Browse verified contractors across {state.city_count} {state.city_count === 1 ? 'city' : 'cities'} in {stateName}.
              View portfolios, read reviews, and connect with local professionals for your next project.
            </p>

            {/* State Stats */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <strong className="text-foreground">{state.business_count.toLocaleString()}</strong> contractors
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <strong className="text-foreground">{state.city_count}</strong> {state.city_count === 1 ? 'city' : 'cities'}
              </span>
              {state.avg_rating && (
                <span className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <strong className="text-foreground">{state.avg_rating.toFixed(1)}</strong> average rating
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cities Grid */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">
              Browse by City
            </h2>
          </div>

          {cities.length === 0 ? (
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  No cities available yet in {stateName}. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cities.map((city) => (
                <Link
                  key={city.city_slug}
                  href={`/find/${stateSlug}/${city.city_slug}`}
                  className="group"
                >
                  <Card className="border-0 bg-card hover:shadow-md transition-all duration-200 h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {city.city_name}
                        </h3>
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">
                          {city.business_count}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {city.category_count} {city.category_count === 1 ? 'category' : 'categories'}
                        {city.avg_rating && (
                          <span className="ml-2">
                            • {city.avg_rating.toFixed(1)}★ avg
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs text-primary group-hover:gap-2 transition-all">
                        Browse contractors
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="max-w-3xl mx-auto text-center py-12">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4 tracking-tight">
              Looking for a Different State?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-[60ch] mx-auto leading-relaxed">
              Browse our full directory to find contractors in your area.
            </p>
            <Button asChild>
              <Link href="/find">View All States</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}

// ISR: Revalidate every 24 hours
export const revalidate = 86400;

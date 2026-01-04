/**
 * Business Portfolios Landing Page
 *
 * Highlights real project work and routes visitors to portfolio hubs
 * by city and service type.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MapPin, Hammer } from 'lucide-react';
import { Badge, Button, Card, CardContent } from '@/components/ui';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { createAdminClient } from '@/lib/supabase/server';
import { getServiceCatalog } from '@/lib/services';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

export const metadata: Metadata = {
  title: 'Business Portfolios | Browse Real Project Work | KnearMe',
  description:
    'Browse real project work from local businesses. Filter by city or service type and choose with confidence.',
  openGraph: {
    title: 'Business Portfolios | KnearMe',
    description:
      'Browse real project work from local businesses. Filter by city or service type and choose with confidence.',
    type: 'website',
    url: `${SITE_URL}/businesses`,
  },
  alternates: {
    canonical: `${SITE_URL}/businesses`,
  },
};

type CityCard = {
  slug: string;
  name: string;
  projectCount: number;
};

function formatCityName(citySlug: string): string {
  const parts = citySlug.split('-');
  if (parts.length < 2) return citySlug;
  const state = parts.pop()?.toUpperCase() || '';
  const city = parts.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return `${city}, ${state}`;
}

async function getTopCities(limit: number = 18): Promise<CityCard[]> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('projects')
    .select('city_slug')
    .eq('status', 'published')
    .not('city_slug', 'is', null);

  if (error) {
    console.error('[ContractorsLanding] Error fetching cities:', error);
    return [];
  }

  type CityRow = { city_slug: string };
  const rows = (data || []) as CityRow[];

  const cityCounts = new Map<string, number>();
  rows.forEach((row) => {
    if (!row.city_slug) return;
    cityCounts.set(row.city_slug, (cityCounts.get(row.city_slug) || 0) + 1);
  });

  return Array.from(cityCounts.entries())
    .map(([slug, count]) => ({
      slug,
      name: formatCityName(slug),
      projectCount: count,
    }))
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, limit);
}

export default async function ContractorsLandingPage() {
  // Fetch service catalog and cities in parallel
  const [services, cities] = await Promise.all([
    getServiceCatalog(),
    getTopCities(),
  ]);

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Businesses', url: '/businesses' },
  ];

  // Build service cards from catalog (already merged with fallback)
  const serviceCards = services.map((service) => ({
    slug: service.urlSlug,
    label: service.label,
    shortDescription: service.shortDescription,
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="relative bg-hero-gradient hero-pattern overflow-hidden">
        <div className="container mx-auto px-4 pt-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <Badge variant="secondary" className="mb-6">
            Business Portfolios
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
            Every project is proof.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            Browse real project work from local businesses. Filter by city or service
            type and choose with confidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="#cities">Browse by city</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/services">Browse services</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-16">
        <section id="cities" className="space-y-6">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
            <h2 className="text-2xl font-semibold">Browse portfolios by city</h2>
            <p className="text-muted-foreground">
              See completed projects from businesses in your area.
            </p>
            </div>
            <Link href="/services" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              Explore services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {cities.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cities.map((city) => (
                <Link key={city.slug} href={`/${city.slug}/masonry`}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{city.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {city.projectCount} {city.projectCount === 1 ? 'project' : 'projects'}
                        </p>
                      </div>
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-muted-foreground">
                Project portfolios are loading. Check back soon for cities near you.
              </CardContent>
            </Card>
          )}
        </section>

        <section id="services" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Browse by service</h2>
            <p className="text-muted-foreground">
              See the work behind the service, not just a list of options.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviceCards.map((service) => (
              <Link key={service.slug} href={`/services/${service.slug}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Hammer className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold">{service.label}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {service.shortDescription}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-muted/30 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Want to see full portfolios?</h2>
            <p className="text-muted-foreground max-w-xl">
              Browse complete project stories with photos, materials, and results.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/examples">View portfolio examples</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}

/**
 * Business Detail Page - /find/{state}/{city}/{category}/{slug}
 *
 * Individual business detail page within the directory.
 * Displays complete business information, contact details, map, and related businesses.
 *
 * Features:
 * - Business hero with name, rating, category, and address
 * - Contact section (phone, website, map link)
 * - Business info card with services and Google Maps link
 * - Related businesses (same category in same city)
 * - Cross-links to portfolio projects
 * - LocalBusiness schema with full structured data
 * - ISR with 1-hour revalidation
 *
 * @see /src/lib/data/directory.ts for data layer
 * @see /src/lib/constants/directory-categories.ts for category metadata
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Star, Phone, Globe, ExternalLink, ArrowRight, ChevronLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { StaticMap } from '@/components/directory/StaticMap';
import { NearbyBusinesses } from '@/components/directory/NearbyBusinesses';
import {
  getBusinessBySlug,
  getCityStats,
  getCategoryListings,
  getNearbyBusinesses,
} from '@/lib/data/directory';
import {
  getCategoryMeta,
} from '@/lib/constants/directory-categories';
import { generateDirectoryBusinessSchema, schemaToString } from '@/lib/seo/structured-data';
import type { DirectoryPlace } from '@/types/directory';

// ISR: Revalidate every 1 hour
export const revalidate = 3600;

type PageParams = {
  params: Promise<{
    state: string;
    city: string;
    category: string;
    slug: string;
  }>;
};

/**
 * Generate metadata with business name, category, city, and structured data.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { state, city, category, slug } = await params;

  const business = await getBusinessBySlug(state, city, category, slug);
  const cityStats = await getCityStats(state, city);
  const categoryMeta = getCategoryMeta(category);

  if (!business || !cityStats || !categoryMeta) {
    return { title: 'Business Not Found' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';
  const canonicalUrl = `${siteUrl}/find/${state}/${city}/${category}/${slug}`;

  const title = `${business.title} - ${categoryMeta.name} in ${cityStats.city_name}, ${cityStats.state_name}`;
  const description = business.address
    ? `${business.title} is a ${categoryMeta.name} located at ${business.address}. ${business.rating ? `Rated ${business.rating.toFixed(1)} stars with ${business.rating_count || 0} reviews.` : ''} Contact for ${categoryMeta.name.toLowerCase()} services in ${cityStats.city_name}.`
    : `${business.title} - ${categoryMeta.name} serving ${cityStats.city_name}, ${cityStats.state_name}. ${business.rating ? `Rated ${business.rating.toFixed(1)} stars.` : ''} Professional ${categoryMeta.name.toLowerCase()} services.`;

  return {
    title,
    description,
    keywords: [
      business.title,
      categoryMeta.name,
      cityStats.city_name,
      cityStats.state_name,
      ...categoryMeta.services.slice(0, 5),
    ].join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'KnearMe',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

/**
 * Business Detail Page Component.
 */
export default async function BusinessDetailPage({ params }: PageParams) {
  const { state, city, category, slug } = await params;

  // Fetch business details
  const business = await getBusinessBySlug(state, city, category, slug);
  const cityStats = await getCityStats(state, city);
  const categoryMeta = getCategoryMeta(category);

  if (!business || !cityStats || !categoryMeta) {
    notFound();
  }

  // Fetch related businesses (same category, same city, different business)
  const allBusinesses = await getCategoryListings(state, city, category, 1, 50);
  const relatedBusinesses = allBusinesses
    .filter((b) => b.slug !== slug)
    .slice(0, 6);

  // Fetch nearby businesses based on geolocation (if coordinates available)
  const nearbyBusinesses = business.latitude && business.longitude
    ? await getNearbyBusinesses(
        business.latitude,
        business.longitude,
        business.slug,
        25, // 25 mile radius
        6   // limit to 6 results
      )
    : [];

  // Check if there are portfolio projects for this category in this city
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
    { name: categoryMeta.pluralName, url: `/find/${state}/${city}/${category}` },
    { name: business.title, url: `/find/${state}/${city}/${category}/${slug}` },
  ];

  // LocalBusiness schema
  const businessSchema = generateDirectoryBusinessSchema(business);

  // Google Maps link using CID
  const googleMapsUrl = business.cid
    ? `https://www.google.com/maps?cid=${business.cid}`
    : business.latitude && business.longitude
    ? `https://www.google.com/maps?q=${business.latitude},${business.longitude}`
    : null;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(businessSchema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Header with Breadcrumbs */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-[1fr_350px] gap-8">
            {/* Main Content */}
            <div>
              {/* Business Hero */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{business.category}</Badge>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                  {business.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {business.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-lg">{business.rating.toFixed(1)}</span>
                      </div>
                      {business.rating_count && (
                        <span className="text-muted-foreground">
                          ({business.rating_count} {business.rating_count === 1 ? 'review' : 'reviews'})
                        </span>
                      )}
                    </div>
                  )}

                  {business.address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-5 w-5 mt-0.5 shrink-0" />
                      <span>{business.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Section */}
              <section className="mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {business.phone_number && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <a
                            href={`tel:${business.phone_number}`}
                            className="text-lg font-semibold hover:text-primary transition-colors"
                          >
                            {business.phone_number}
                          </a>
                        </div>
                      </div>
                    )}

                    {business.website && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Website</p>
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lg font-semibold text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Visit Website
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    {business.address && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="text-lg">{business.address}</p>
                          {googleMapsUrl && (
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                            >
                              View on Google Maps
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {!business.phone_number && !business.website && !business.address && (
                      <p className="text-muted-foreground text-sm">
                        Contact information not available for this business.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Map Section */}
              {(business.latitude && business.longitude) && (
                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Location</h2>
                  <StaticMap
                    latitude={business.latitude}
                    longitude={business.longitude}
                    businessName={business.title}
                    address={business.address || undefined}
                  />
                </section>
              )}

              {/* Business Info Card */}
              <section className="mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Business</CardTitle>
                    <CardDescription>
                      {categoryMeta.name} in {cityStats.city_name}, {cityStats.state_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Services Typically Offered</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        As a {categoryMeta.name}, this business may offer the following services:
                      </p>
                      <ul className="grid sm:grid-cols-2 gap-2">
                        {categoryMeta.services.slice(0, 6).map((service) => (
                          <li key={service} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">•</span>
                            <span>{service}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {googleMapsUrl && (
                      <div className="pt-4 border-t">
                        <Button asChild variant="outline" className="w-full">
                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Full Profile on Google Maps
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Nearby Businesses (Geolocation-based) */}
              <NearbyBusinesses
                businesses={nearbyBusinesses}
                currentCity={cityStats.city_name}
              />

              {/* Related Businesses */}
              {relatedBusinesses.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">
                    Other {categoryMeta.pluralName} in {cityStats.city_name}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {relatedBusinesses.map((relatedBusiness) => (
                      <RelatedBusinessCard
                        key={relatedBusiness.id}
                        business={relatedBusiness}
                        state={state}
                        city={city}
                        category={category}
                      />
                    ))}
                  </div>
                  <div className="mt-6">
                    <Button asChild variant="outline">
                      <Link href={`/find/${state}/${city}/${category}`}>
                        View All {categoryMeta.pluralName}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-4 h-fit space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {business.phone_number && (
                    <Button asChild className="w-full">
                      <a href={`tel:${business.phone_number}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call Now
                      </a>
                    </Button>
                  )}

                  {business.website && (
                    <Button asChild variant="outline" className="w-full">
                      <a href={business.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="mr-2 h-4 w-4" />
                        Visit Website
                      </a>
                    </Button>
                  )}

                  {googleMapsUrl && (
                    <Button asChild variant="outline" className="w-full">
                      <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="mr-2 h-4 w-4" />
                        Get Directions
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Portfolio Cross-link */}
              {projectCount && projectCount > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Portfolio Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">
                      See <strong>{projectCount}</strong> masonry portfolio{' '}
                      {projectCount === 1 ? 'project' : 'projects'} completed in {cityStats.city_name}.
                    </p>
                    <Button asChild variant="default" size="sm" className="w-full">
                      <Link href={`/${city}/masonry`}>
                        View {categoryMeta.name} Portfolio Projects
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Back to Category */}
              <Card>
                <CardContent className="pt-6">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/find/${state}/${city}/${category}`}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back to {categoryMeta.pluralName}
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Back to City */}
              <Card>
                <CardContent className="pt-6">
                  <Button asChild variant="ghost" className="w-full">
                    <Link href={`/find/${state}/${city}`}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      All Categories in {cityStats.city_name}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}

/**
 * Related Business Card Component - displays a related business listing.
 */
function RelatedBusinessCard({
  business,
  state,
  city,
  category,
}: {
  business: DirectoryPlace;
  state: string;
  city: string;
  category: string;
}) {
  const detailUrl = `/find/${state}/${city}/${category}/${business.slug}`;

  return (
    <Link href={detailUrl}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold line-clamp-2 flex-1">{business.title}</h3>
            {business.rating && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-sm">{business.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {business.address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{business.address}</span>
            </div>
          )}

          {business.phone_number && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{business.phone_number}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

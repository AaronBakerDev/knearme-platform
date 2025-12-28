/**
 * Category Listing Page - /find/{state}/{city}/{category} (THE MONEY PAGE)
 *
 * Shows all businesses in a specific category for a city.
 * This is the primary revenue-generating SEO page with high commercial intent.
 *
 * Features:
 * - Category hero with rich metadata
 * - Paginated business listings
 * - Services offered section
 * - FAQ section with FAQPage schema
 * - Related categories sidebar
 * - Cross-linking to portfolio projects
 * - ISR with 1-hour revalidation
 *
 * @see /src/lib/data/directory.ts for data layer
 * @see /src/lib/constants/directory-categories.ts for category metadata
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Star, Phone, Globe, ArrowRight, ChevronLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Pagination } from '@/components/directory/Pagination';
import {
  getCityStats,
  getCategoryListings,
  getTotalBusinessCount,
  type ListingFilters,
} from '@/lib/data/directory';
import { getCategoryMeta, isValidCategorySlug } from '@/lib/constants/directory-categories';
import { generateFAQSchema, schemaToString } from '@/lib/seo/structured-data';
import type { DirectoryPlace } from '@/types/directory';
import { DirectoryFilters } from '@/components/directory/DirectoryFilters';
import { RelatedCategories } from '@/components/directory/RelatedCategories';

// ISR: Revalidate every 1 hour (more frequent for listing pages)
export const revalidate = 3600;

const BUSINESSES_PER_PAGE = 20;

type PageParams = {
  params: Promise<{
    state: string;
    city: string;
    category: string;
  }>;
  searchParams: Promise<{
    page?: string;
    minRating?: string;
    hasWebsite?: string;
    hasPhone?: string;
  }>;
};

/**
 * Generate metadata with category, city, count, and canonical URL.
 */
export async function generateMetadata({ params, searchParams }: PageParams): Promise<Metadata> {
  const { state, city, category } = await params;
  const { page, minRating, hasWebsite, hasPhone } = await searchParams;
  const currentPage = parseInt(page || '1', 10);

  // Build filters from searchParams
  const filters: ListingFilters = {};
  if (minRating) {
    filters.minRating = parseInt(minRating, 10);
  }
  if (hasWebsite === 'true') {
    filters.hasWebsite = true;
  }
  if (hasPhone === 'true') {
    filters.hasPhone = true;
  }

  const cityStats = await getCityStats(state, city);
  const categoryMeta = getCategoryMeta(category);
  const totalCount = await getTotalBusinessCount(state, city, category, filters);

  if (!cityStats || !categoryMeta) {
    return { title: 'Category Not Found' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';
  const baseUrl = `${siteUrl}/find/${state}/${city}/${category}`;

  // Replace placeholders in template
  const title = categoryMeta.headline.replace('{city}', `${cityStats.city_name}, ${cityStats.state_name}`);
  const description = categoryMeta.description
    .replace('{city}', cityStats.city_name)
    .replace('{count}', totalCount.toString());

  // Canonical URL (use base URL for page 1, add ?page=N for others)
  const canonicalUrl = currentPage === 1 ? baseUrl : `${baseUrl}?page=${currentPage}`;

  return {
    title: currentPage > 1 ? `${title} - Page ${currentPage}` : title,
    description,
    keywords: categoryMeta.services.join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
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
 * Category Listing Page Component.
 */
export default async function CategoryListingPage({ params, searchParams }: PageParams) {
  const { state, city, category } = await params;
  const { page, minRating, hasWebsite, hasPhone } = await searchParams;
  const currentPage = parseInt(page || '1', 10);

  // Build filters from searchParams
  const filters: ListingFilters = {};
  if (minRating) {
    filters.minRating = parseInt(minRating, 10);
  }
  if (hasWebsite === 'true') {
    filters.hasWebsite = true;
  }
  if (hasPhone === 'true') {
    filters.hasPhone = true;
  }

  // Validate category slug
  if (!isValidCategorySlug(category)) {
    notFound();
  }

  // Fetch data
  const cityStats = await getCityStats(state, city);
  const categoryMeta = getCategoryMeta(category);

  if (!cityStats || !categoryMeta) {
    notFound();
  }

  // Fetch businesses with pagination and filters
  const businesses = await getCategoryListings(state, city, category, currentPage, BUSINESSES_PER_PAGE, filters);
  const totalCount = await getTotalBusinessCount(state, city, category, filters);

  if (businesses.length === 0 && currentPage === 1) {
    notFound();
  }

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / BUSINESSES_PER_PAGE);

  // Related categories

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
  ];

  // ItemList schema for businesses
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${categoryMeta.pluralName} in ${cityStats.city_name}`,
    numberOfItems: totalCount,
    itemListElement: businesses.map((business, index) => ({
      '@type': 'ListItem',
      position: (currentPage - 1) * BUSINESSES_PER_PAGE + index + 1,
      item: {
        '@type': 'LocalBusiness',
        name: business.title,
        address: business.address || undefined,
        ...(business.rating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: business.rating,
            ratingCount: business.rating_count || 1,
          },
        }),
      },
    })),
  };

  // FAQPage schema
  const faqSchema = generateFAQSchema(categoryMeta.faqs);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(faqSchema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Header with Breadcrumbs */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="min-w-0">
              {/* Category Hero */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {cityStats.city_name}, {cityStats.state_name}
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                  {categoryMeta.pluralName} in {cityStats.city_name}
                </h1>

                <p className="text-lg text-muted-foreground mb-6">
                  {categoryMeta.description
                    .replace('{city}', cityStats.city_name)
                    .replace('{count}', totalCount.toString())}
                </p>

                {/* Portfolio Cross-link */}
                {projectCount && projectCount > 0 && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-sm">
                        <strong>{projectCount}</strong> masonry portfolio{' '}
                        {projectCount === 1 ? 'project' : 'projects'} in {cityStats.city_name}
                      </p>
                      <Button asChild variant="link" size="sm" className="px-0">
                        <Link href={`/${city}/masonry`}>
                          View Portfolio Projects <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Filters */}
              <DirectoryFilters />

              {/* Business Listings */}
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    All {categoryMeta.pluralName}
                    <span className="text-muted-foreground font-normal text-lg ml-2">
                      ({totalCount})
                    </span>
                  </h2>
                </div>

                <div className="space-y-4">
                  {businesses.map((business) => (
                    <BusinessCard key={business.id} business={business} />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl={`/find/${state}/${city}/${category}`}
                />
              </section>

              {/* Services Offered Section */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">Common Services</h2>
                <Card>
                  <CardContent className="pt-6">
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {categoryMeta.services.map((service) => (
                        <li key={service} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span className="text-sm">{service}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>

              {/* FAQ Section */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {categoryMeta.faqs.map((faq, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar - Stacks below main content on mobile */}
            <aside className="lg:sticky lg:top-4 h-fit space-y-4 lg:space-y-6 order-last lg:order-none">
              {/* Related Categories with business counts */}
              <RelatedCategories
                currentCategory={category}
                stateSlug={state}
                citySlug={city}
                cityName={cityStats.city_name}
              />

              {/* Back to City Hub */}
              <Card>
                <CardContent className="pt-6">
                  <Button asChild variant="outline" className="w-full">
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
 * Business Card Component - displays a single business listing.
 */
function BusinessCard({ business }: { business: DirectoryPlace }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1 truncate">{business.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{business.category}</p>

            <div className="space-y-2">
              {business.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{business.address}</span>
                </div>
              )}

              {business.phone_number && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a
                    href={`tel:${business.phone_number}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {business.phone_number}
                  </a>
                </div>
              )}

              {business.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end gap-3 sm:gap-2 shrink-0">
            {business.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{business.rating.toFixed(1)}</span>
                {business.rating_count && (
                  <span className="text-xs text-muted-foreground">
                    ({business.rating_count})
                  </span>
                )}
              </div>
            )}

            {business.website && (
              <Button asChild variant="outline" size="sm">
                <a href={business.website} target="_blank" rel="noopener noreferrer">
                  Contact
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

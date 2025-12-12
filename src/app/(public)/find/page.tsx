/**
 * Directory Landing Page - Main entry point for finding contractors.
 *
 * URL: /find
 *
 * Features:
 * - Hero section with search placeholder
 * - Platform statistics (total contractors, states, categories)
 * - State grid showing all states with business counts
 * - Featured categories with links to category pages
 * - JSON-LD WebSite schema with SearchAction
 *
 * @see /src/lib/data/directory.ts for data layer
 * @see /src/components/directory/StateGrid.tsx for state grid component
 * @see /src/components/directory/CategoryCard.tsx for category cards
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Building2, Wrench } from 'lucide-react';
import { getStateStats } from '@/lib/data/directory';
import { getAllCategories } from '@/lib/constants/directory-categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DirectorySearch } from '@/components/directory/DirectorySearch';

/**
 * Generate metadata for the directory landing page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';
  const title = 'Find Trusted Contractors Near You | KnearMe';
  const description = 'Browse verified contractors by location and service type. View portfolios, read reviews, and connect with local professionals for your next project.';

  return {
    title,
    description,
    keywords: 'find contractors, local contractors, contractor directory, masonry contractors, home improvement, service providers',
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/find`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${siteUrl}/find`,
    },
  };
}

/**
 * Directory Landing Page Component.
 */
export default async function DirectoryLandingPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

  // Fetch state statistics
  const states = await getStateStats();

  // Get all categories for featured section
  const allCategories = getAllCategories();
  const featuredCategories = allCategories.slice(0, 6); // Show first 6 categories

  // Calculate platform stats
  const totalContractors = states.reduce((sum, state) => sum + state.business_count, 0);
  const totalStates = states.length;
  const totalCities = states.reduce((sum, state) => sum + state.city_count, 0);
  const totalCategories = allCategories.length;

  // JSON-LD WebSite schema with SearchAction
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'KnearMe',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/find?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Find Trusted Contractors Near You
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-[70ch] mx-auto leading-relaxed">
            Browse verified contractors by location and service type. View portfolios, read reviews, and connect with local professionals for your next project.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-6">
            <DirectorySearch />
          </div>

          {/* Platform Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {totalContractors.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Contractors</div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {totalStates}
                </div>
                <div className="text-sm text-muted-foreground">States</div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {totalCities.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Cities</div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {totalCategories}
                </div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Browse by State */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Browse by State</h2>
          </div>

          {states.length === 0 ? (
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No states available yet. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {states.map((state) => (
                <Link
                  key={state.state_slug}
                  href={`/find/${state.state_slug}`}
                  className="group"
                >
                  <Card className="border-0 bg-card hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {state.state_name}
                        </h3>
                        <Badge variant="secondary" className="ml-2">
                          {state.business_count}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {state.city_count} {state.city_count === 1 ? 'city' : 'cities'}
                        {state.avg_rating && (
                          <span className="ml-2">
                            • {state.avg_rating.toFixed(1)}★ avg
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured Categories */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Wrench className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Featured Categories</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {featuredCategories.map((category) => {
              // Get icon component dynamically
              const IconComponent = Building2; // Default icon, would need dynamic import for real icons

              return (
                <Card key={category.slug} className="border-0 bg-card hover:shadow-md transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-2">
                          {category.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.shortDescription}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Service tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {category.services.slice(0, 3).map((service) => (
                        <Badge key={service} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                      {category.services.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.services.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href={`/find/category/${category.slug}`}>
                        Browse {category.pluralName}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {allCategories.length > featuredCategories.length && (
            <div className="text-center">
              <Button variant="outline" asChild>
                <Link href="/find/categories">
                  View All {allCategories.length} Categories
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="max-w-3xl mx-auto text-center py-12">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
              Are You a Contractor?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-[60ch] mx-auto leading-relaxed">
              Join KnearMe to showcase your work, generate SEO-optimized portfolios, and connect with homeowners looking for your services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/signup">Get Started Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// ISR: Revalidate every 24 hours
export const revalidate = 86400;

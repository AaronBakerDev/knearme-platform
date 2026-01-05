/**
 * NearbyCities Component - Shows links to other cities with projects.
 *
 * This component is important for SEO:
 * - Creates internal linking between city pages
 * - Helps users discover projects in neighboring areas
 * - Improves site navigation and crawlability
 *
 * Note: Currently uses state-based grouping since we don't have
 * geospatial data. Future enhancement could use PostGIS for
 * actual distance-based "nearby" cities.
 *
 * @see /docs/SEO-DISCOVERY-STRATEGY.md for internal linking architecture
 */

import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type CityInfo = {
  /** City slug for URL (e.g., "denver-co") */
  slug: string;
  /** Display name (e.g., "Denver, CO") */
  name: string;
  /** Number of projects in this city */
  projectCount: number;
  /** State code extracted from slug */
  state?: string;
};

type NearbyCitiesProps = {
  /** Array of cities to display */
  cities: CityInfo[];
  /** Current city slug to exclude from list */
  currentCitySlug?: string;
  /** Title for the section */
  title?: string;
  /** Maximum number of cities to show */
  maxCities?: number;
  /** Show project count badge */
  showCount?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Service type slug for linking to service-specific pages */
  serviceTypeSlug?: string;
};

/**
 * Format city slug to display name.
 * @example "denver-co" -> "Denver, CO"
 */
function formatCityName(citySlug: string): string {
  const parts = citySlug.split('-');
  if (parts.length < 2) return citySlug;

  const state = parts.pop()?.toUpperCase() || '';
  const city = parts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `${city}, ${state}`;
}

/**
 * Extract state code from city slug.
 * @example "denver-co" -> "CO"
 */
function extractState(citySlug: string): string {
  const parts = citySlug.split('-');
  return parts[parts.length - 1]?.toUpperCase() || '';
}

export function NearbyCities({
  cities,
  currentCitySlug,
  title = 'Explore Other Cities',
  maxCities = 8,
  showCount = true,
  className = '',
  serviceTypeSlug,
}: NearbyCitiesProps) {
  // Filter out current city and limit results
  const filteredCities = cities
    .filter((city) => city.slug !== currentCitySlug)
    .slice(0, maxCities);

  if (filteredCities.length === 0) {
    return null;
  }

  // Group cities by state for better organization
  const citiesByState = filteredCities.reduce((acc, city) => {
    const state = city.state || extractState(city.slug);
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(city);
    return acc;
  }, {} as Record<string, CityInfo[]>);

  // Sort states by total project count (most active states first)
  const sortedStates = Object.entries(citiesByState).sort((a, b) => {
    const aTotal = a[1].reduce((sum, c) => sum + c.projectCount, 0);
    const bTotal = b[1].reduce((sum, c) => sum + c.projectCount, 0);
    return bTotal - aTotal;
  });

  // Build URL path based on whether we're linking to service-specific pages
  const buildCityUrl = (citySlug: string) => {
    if (serviceTypeSlug) {
      return `/${citySlug}/masonry/${serviceTypeSlug}`;
    }
    return `/${citySlug}/masonry`;
  };

  return (
    <section className={`bg-muted/30 rounded-xl p-5 ${className}`}>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        {title}
      </h2>

      {/* Single state or multiple states */}
      {sortedStates.length === 1 ? (
        // Simple list for single state
        <div className="flex flex-wrap gap-2">
          {filteredCities
            .sort((a, b) => b.projectCount - a.projectCount)
            .map((city) => (
              <Link key={city.slug} href={buildCityUrl(city.slug)}>
                <Badge
                  variant="secondary"
                  className="cursor-pointer bg-background hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all px-3 py-1.5"
                >
                  {city.name || formatCityName(city.slug)}
                  {showCount && (
                    <span className="text-muted-foreground ml-1">
                      ({city.projectCount})
                    </span>
                  )}
                </Badge>
              </Link>
            ))}
        </div>
      ) : (
        // Grouped by state for multiple states
        <div className="space-y-4">
          {sortedStates.map(([state, stateCities]) => (
            <div key={state}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {state}
              </h3>
              <div className="flex flex-wrap gap-2">
                {stateCities
                  .sort((a, b) => b.projectCount - a.projectCount)
                  .map((city) => (
                    <Link key={city.slug} href={buildCityUrl(city.slug)}>
                      <Badge
                        variant="secondary"
                        className="cursor-pointer bg-background hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all px-3 py-1.5"
                      >
                        {city.name || formatCityName(city.slug)}
                        {showCount && (
                          <span className="text-muted-foreground ml-1">
                            ({city.projectCount})
                          </span>
                        )}
                      </Badge>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link to browse all */}
      <Link
        href="/businesses"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4"
      >
        Browse all service areas
        <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}

/**
 * Server-side helper to fetch cities with project counts.
 *
 * @param supabase - Supabase client
 * @param serviceTypeSlug - Optional filter by service type
 * @param limit - Maximum number of cities to return
 */
export async function fetchCitiesWithProjects(
  supabase: SupabaseClient<Database>,
  serviceTypeSlug?: string,
  limit: number = 20
): Promise<CityInfo[]> {
  // Build query
  let query = supabase
    .from('projects')
    .select('city_slug, city')
    .eq('status', 'published')
    .not('city_slug', 'is', null);

  // Filter by service type if provided
  if (serviceTypeSlug) {
    query = query.eq('project_type_slug', serviceTypeSlug);
  }

  const { data } = await query;

  if (!data) return [];

  // Count projects per city
  const cityCounts = new Map<string, { name: string; count: number }>();

  (data as Array<{ city_slug: string; city: string | null }>).forEach((p) => {
    const existing = cityCounts.get(p.city_slug);
    if (existing) {
      existing.count++;
    } else {
      cityCounts.set(p.city_slug, {
        name: p.city || formatCityName(p.city_slug),
        count: 1,
      });
    }
  });

  // Convert to array, sort by count, and limit
  const cities: CityInfo[] = Array.from(cityCounts.entries())
    .map(([slug, info]) => ({
      slug,
      name: info.name,
      projectCount: info.count,
      state: extractState(slug),
    }))
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, limit);

  return cities;
}

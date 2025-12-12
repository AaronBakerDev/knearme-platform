/**
 * CityGrid component for displaying city listings.
 *
 * Shows a responsive grid of city cards for state directory pages.
 * Each city card displays name, business count, category count, and avg rating.
 *
 * @see /src/types/directory.ts for CityStats type
 */

import Link from 'next/link';
import { Building2, Tag, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CityStats } from '@/types/directory';

interface CityGridProps {
  /** Array of city statistics */
  cities: CityStats[];
  /** State slug for routing */
  stateSlug: string;
}

/**
 * Displays a grid of city cards for state directory pages.
 *
 * Cities are displayed in a responsive 3-column grid and link to:
 * /directory/{stateSlug}/{citySlug}
 *
 * @example
 * <CityGrid cities={cityStats} stateSlug="colorado" />
 */
export function CityGrid({ cities, stateSlug }: CityGridProps) {
  // Sort cities by business count (descending)
  const sortedCities = [...cities].sort(
    (a, b) => b.business_count - a.business_count
  );

  if (cities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No cities found in this state.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {sortedCities.map((city) => (
        <Link
          key={city.city_slug}
          href={`/directory/${stateSlug}/${city.city_slug}`}
          className="block group"
        >
          <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all min-h-[180px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors truncate">
                {city.city_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground truncate">{city.state_name}</p>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Business Count */}
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="size-4 text-muted-foreground shrink-0" />
                <span className="font-medium">
                  {city.business_count.toLocaleString()}
                </span>
                <span className="text-muted-foreground truncate">
                  {city.business_count === 1 ? 'business' : 'businesses'}
                </span>
              </div>

              {/* Category Count */}
              <div className="flex items-center gap-2 text-sm">
                <Tag className="size-4 text-muted-foreground shrink-0" />
                <span className="font-medium">
                  {city.category_count.toLocaleString()}
                </span>
                <span className="text-muted-foreground truncate">
                  {city.category_count === 1 ? 'category' : 'categories'}
                </span>
              </div>

              {/* Average Rating */}
              {city.avg_rating !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="size-4 text-yellow-400 fill-yellow-400 shrink-0" />
                  <Badge variant="secondary" className="text-xs">
                    {city.avg_rating.toFixed(1)} avg rating
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

/**
 * NearbyBusinesses component - displays businesses within a geographic radius.
 *
 * Shows a grid of business cards sorted by distance from a center point.
 * Each card displays business name, rating, category, and distance.
 *
 * @see /src/lib/data/directory.ts for getNearbyBusinesses() implementation
 */

import Link from 'next/link';
import { MapPin, Star, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DirectoryPlaceWithDistance } from '@/lib/data/directory';

interface NearbyBusinessesProps {
  /** Array of nearby businesses with distance calculated */
  businesses: DirectoryPlaceWithDistance[];
  /** Current city name for contextual heading */
  currentCity: string;
}

/**
 * Displays a grid of nearby businesses with distance indicators.
 *
 * Features:
 * - Distance badge on each card ("2.3 mi away")
 * - Star rating display
 * - Links to business detail pages
 * - Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
 * - Renders nothing if businesses array is empty
 *
 * @example
 * const nearby = await getNearbyBusinesses(lat, lng, currentSlug);
 * <NearbyBusinesses businesses={nearby} currentCity="Denver" />
 */
export function NearbyBusinesses({ businesses, currentCity }: NearbyBusinessesProps) {
  // Don't render if no nearby businesses
  if (!businesses || businesses.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Navigation className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Nearby Contractors</h2>
      </div>
      <p className="text-muted-foreground mb-6">
        More contractors near {currentCity}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {businesses.map((business) => (
          <NearbyBusinessCard key={business.id} business={business} />
        ))}
      </div>
    </section>
  );
}

/**
 * Individual business card for nearby businesses.
 * Displays business name, rating, category, and distance.
 */
function NearbyBusinessCard({ business }: { business: DirectoryPlaceWithDistance }) {
  const detailUrl = `/find/${business.state_slug}/${business.city_slug}/${business.category_slug}/${business.slug}`;

  // Format distance to 1 decimal place
  const formattedDistance = business.distance_miles.toFixed(1);

  return (
    <Link href={detailUrl}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardContent className="pt-6">
          {/* Header with Category Badge */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-semibold line-clamp-2 flex-1 text-base">
              {business.title}
            </h3>
            <Badge variant="outline" className="shrink-0 text-xs">
              {business.category}
            </Badge>
          </div>

          {/* Rating */}
          {business.rating && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-sm">{business.rating.toFixed(1)}</span>
              </div>
              {business.rating_count && (
                <span className="text-xs text-muted-foreground">
                  ({business.rating_count})
                </span>
              )}
            </div>
          )}

          {/* Distance Badge */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {formattedDistance} mi away
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * BusinessCard component for displaying individual business listings.
 *
 * Shows business details including name, rating, category, contact info,
 * and a link to the detail page.
 *
 * @see /src/types/directory.ts for DirectoryPlace type
 */

import Link from 'next/link';
import { MapPin, Phone, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from './StarRating';
import type { DirectoryPlace } from '@/types/directory';

interface BusinessCardProps {
  /** Business listing data */
  business: DirectoryPlace;
  /** State slug for routing (e.g., 'colorado', 'utah') */
  stateSlug: string;
}

/**
 * Displays a business listing in a card format.
 *
 * Includes business name, rating, category, address, phone, website,
 * and a link to the detail page at:
 * /directory/{stateSlug}/{citySlug}/{categorySlug}/{businessSlug}
 *
 * @example
 * <BusinessCard
 *   business={place}
 *   stateSlug="colorado"
 * />
 */
export function BusinessCard({ business, stateSlug }: BusinessCardProps) {
  // Truncate address if longer than 60 characters
  const displayAddress = business.address
    ? business.address.length > 60
      ? `${business.address.slice(0, 57)}...`
      : business.address
    : null;

  // Detail page URL
  const detailUrl = `/directory/${stateSlug}/${business.city_slug}/${business.category_slug}/${business.slug}`;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg line-clamp-2">
              <Link
                href={detailUrl}
                className="hover:text-primary transition-colors"
              >
                {business.title}
              </Link>
            </CardTitle>
            <div className="mt-2">
              <StarRating
                rating={business.rating}
                count={business.rating_count}
                size="sm"
              />
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0 w-fit">
            {business.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Address */}
        {displayAddress && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground line-clamp-2 break-words">
              {displayAddress}
            </span>
          </div>
        )}

        {/* Contact Info Row - stacks on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Phone */}
          {business.phone_number && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="size-4 text-muted-foreground shrink-0" />
              <a
                href={`tel:${business.phone_number}`}
                className="text-primary hover:underline min-h-[44px] sm:min-h-0 flex items-center"
              >
                {business.phone_number}
              </a>
            </div>
          )}

          {/* Website */}
          {business.website && (
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink className="size-4 text-muted-foreground shrink-0" />
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate min-h-[44px] sm:min-h-0 flex items-center"
              >
                Visit Website
              </a>
            </div>
          )}
        </div>

        {/* View Details Button - full width on mobile, auto on desktop */}
        <div className="pt-2">
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto min-h-[44px]"
            size="sm"
          >
            <Link href={detailUrl}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * StateGrid component for displaying state listings.
 *
 * Shows a responsive grid of state cards for the directory landing page.
 * Each state card displays name, business count, and city count.
 *
 * @see /src/types/directory.ts for StateStats type
 */

import Link from 'next/link';
import { MapPin, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StateStats } from '@/types/directory';

interface StateGridProps {
  /** Array of state statistics */
  states: StateStats[];
}

/**
 * Displays a grid of state cards for the directory landing page.
 *
 * States are sorted by business count (descending) and displayed in
 * a responsive 3-column grid.
 *
 * @example
 * <StateGrid states={stateStats} />
 */
export function StateGrid({ states }: StateGridProps) {
  // Sort states by business count (descending)
  const sortedStates = [...states].sort(
    (a, b) => b.business_count - a.business_count
  );

  if (states.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No states found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {sortedStates.map((state) => (
        <Link
          key={state.state_slug}
          href={`/directory/${state.state_slug}`}
          className="block group"
        >
          <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all min-h-[160px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors">
                {state.state_name}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Business Count */}
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="size-4 text-muted-foreground shrink-0" />
                <span className="font-medium">
                  {state.business_count.toLocaleString()}
                </span>
                <span className="text-muted-foreground truncate">
                  {state.business_count === 1 ? 'business' : 'businesses'}
                </span>
              </div>

              {/* City Count */}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-muted-foreground shrink-0" />
                <span className="font-medium">
                  {state.city_count.toLocaleString()}
                </span>
                <span className="text-muted-foreground truncate">
                  {state.city_count === 1 ? 'city' : 'cities'}
                </span>
              </div>

              {/* Average Rating */}
              {state.avg_rating !== null && (
                <div className="pt-2">
                  <Badge variant="secondary" className="text-xs">
                    {state.avg_rating.toFixed(1)} avg rating
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

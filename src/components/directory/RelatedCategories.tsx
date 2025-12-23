/**
 * RelatedCategories component for category listing pages.
 *
 * Shows a sidebar of related service categories in the same city,
 * including business count and links to each category page.
 *
 * Features:
 * - Fetches business count per category from directory_places
 * - Shows category icon and name
 * - Responsive card layout
 * - Only shows categories with businesses in the current city
 *
 * @see /src/lib/constants/directory-categories.ts for category metadata
 * @see /src/lib/data/directory.ts for data queries
 */

'use client';

import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCategoryMeta } from '@/lib/constants/directory-categories';
import { useEffect, useState } from 'react';

interface RelatedCategoriesProps {
  /** Current category slug (to exclude from related list) */
  currentCategory: string;
  /** State slug for routing */
  stateSlug: string;
  /** City slug for routing and queries */
  citySlug: string;
  /** City display name */
  cityName: string;
}

interface CategoryWithCount {
  slug: string;
  name: string;
  icon: string;
  count: number;
}

/**
 * Displays related service categories in a sidebar card.
 *
 * Fetches business counts for each related category and displays
 * them as clickable links with icons and counts.
 *
 * @example
 * <RelatedCategories
 *   currentCategory="masonry-contractor"
 *   stateSlug="colorado"
 *   citySlug="denver"
 *   cityName="Denver"
 * />
 */
export function RelatedCategories({
  currentCategory,
  stateSlug,
  citySlug,
  cityName,
}: RelatedCategoriesProps) {
  const [relatedCategories, setRelatedCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedCategories() {
      try {
        // Get current category metadata
        const categoryMeta = getCategoryMeta(currentCategory);
        if (!categoryMeta || !categoryMeta.relatedCategories.length) {
          setIsLoading(false);
          return;
        }

        // Fetch category stats for the city
        const response = await fetch(
          `/api/directory/categories?state=${stateSlug}&city=${citySlug}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch category stats');
        }

        const categoryStats = await response.json();

        // Map related categories with their counts
        const related: CategoryWithCount[] = categoryMeta.relatedCategories
          .map((relatedSlug) => {
            const meta = getCategoryMeta(relatedSlug);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const stats = categoryStats.find((s: any) => s.category_slug === relatedSlug);

            if (!meta || !stats || stats.business_count === 0) {
              return null;
            }

            return {
              slug: relatedSlug,
              name: meta.pluralName,
              icon: meta.icon,
              count: stats.business_count,
            };
          })
          .filter((item): item is CategoryWithCount => item !== null)
          .sort((a, b) => b.count - a.count); // Sort by count descending

        setRelatedCategories(related);
      } catch (error) {
        console.error('[RelatedCategories] Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRelatedCategories();
  }, [currentCategory, stateSlug, citySlug]);

  // Don't render if no related categories
  if (!isLoading && relatedCategories.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Related Services</CardTitle>
        <CardDescription>
          Find other contractors in {cityName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          relatedCategories.map((category) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Icon = (LucideIcons as any)[category.icon] || Building2;

            return (
              <Link
                key={category.slug}
                href={`/find/${stateSlug}/${citySlug}/${category.slug}`}
                className="block group"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-3 px-3 hover:bg-accent"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {category.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.count} {category.count === 1 ? 'business' : 'businesses'}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Button>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

/**
 * CategoryCard component for displaying category options.
 *
 * Shows category icon, name, business count, description, and
 * links to the category listing page.
 *
 * @see /src/lib/constants/directory-categories.ts for category metadata
 * @see /src/types/directory.ts for CategoryStats type
 */

import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CategoryStats } from '@/types/directory';
import type { DirectoryCategoryMeta } from '@/lib/constants/directory-categories';

interface CategoryCardProps {
  /** Category statistics (name, slug, count) */
  category: CategoryStats;
  /** Category metadata (icon, description, etc.) */
  meta: DirectoryCategoryMeta;
  /** State slug for routing */
  stateSlug: string;
  /** City slug for routing */
  citySlug: string;
}

/**
 * Displays a category option with icon, count, and description.
 *
 * Links to category listing page at:
 * /directory/{stateSlug}/{citySlug}/{categorySlug}
 *
 * @example
 * <CategoryCard
 *   category={{ category_slug: 'masonry-contractor', category_name: 'Masonry Contractor', business_count: 42, avg_rating: 4.5 }}
 *   meta={DIRECTORY_CATEGORIES['masonry-contractor']}
 *   stateSlug="colorado"
 *   citySlug="denver-co"
 * />
 */
export function CategoryCard({
  category,
  meta,
  stateSlug,
  citySlug,
}: CategoryCardProps) {
  // Get icon component from Lucide (fallback to Building2)
  const IconComponent = (
    LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
  )[meta.icon] || LucideIcons.Building2;

  // Category listing URL
  const categoryUrl = `/directory/${stateSlug}/${citySlug}/${category.category_slug}`;

  return (
    <Link href={categoryUrl} className="block group">
      <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <IconComponent className="size-6" />
            </div>
            <Badge variant="secondary" className="shrink-0">
              {category.business_count.toLocaleString()}
            </Badge>
          </div>

          <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
            {category.category_name}
          </CardTitle>

          <CardDescription className="line-clamp-2">
            {meta.shortDescription}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {category.avg_rating !== null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {category.avg_rating.toFixed(1)}
              </span>
              <span>avg rating</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Breadcrumbs - SEO-friendly breadcrumb navigation with Schema.org structured data.
 *
 * Features:
 * - Semantic navigation structure
 * - Automatic JSON-LD BreadcrumbList injection
 * - Mobile-responsive with truncation
 * - Accessible with proper ARIA labels
 *
 * @see https://schema.org/BreadcrumbList
 * @see /src/lib/seo/structured-data.ts for schema generator
 */

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { generateBreadcrumbSchema, schemaToString } from '@/lib/seo/structured-data';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  /** Display name for the breadcrumb */
  name: string;
  /** URL path (relative, starting with /) */
  url: string;
}

interface BreadcrumbsProps {
  /** Array of breadcrumb items (in order, home to current) */
  items: BreadcrumbItem[];
  /** Whether to show home icon instead of "Home" text */
  showHomeIcon?: boolean;
  /** Whether to inject JSON-LD structured data (default: true) */
  includeSchema?: boolean;
  /** Maximum items to show before truncating (default: 5) */
  maxItems?: number;
  /** Additional class name for the container */
  className?: string;
}

/**
 * Breadcrumbs component with SEO structured data.
 *
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { name: 'Home', url: '/' },
 *     { name: 'Denver, CO', url: '/denver-co' },
 *     { name: 'Masonry', url: '/denver-co/masonry' },
 *     { name: 'Chimney Repair', url: '/denver-co/masonry/chimney-repair' },
 *   ]}
 * />
 * ```
 */
export function Breadcrumbs({
  items,
  showHomeIcon = true,
  includeSchema = true,
  maxItems = 5,
  className,
}: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  // Truncate middle items if too many
  let displayItems = items;
  const shouldTruncate = items.length > maxItems;

  if (shouldTruncate) {
    // Show first item, "...", and last (maxItems - 2) items
    const keepEnd = maxItems - 2;
    displayItems = [
      items[0]!,
      { name: '...', url: '' }, // Truncation indicator
      ...items.slice(-keepEnd),
    ];
  }

  // Mobile: Show only first and last 2 items
  const mobileItems = items.length > 3
    ? [items[0]!, { name: '...', url: '' }, ...items.slice(-2)]
    : items;

  // Generate schema for all items (not truncated)
  const schema = generateBreadcrumbSchema(items);

  return (
    <>
      {/* JSON-LD Structured Data */}
      {includeSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaToString(schema) }}
        />
      )}

      {/* Desktop Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className={cn(
          'hidden sm:flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto',
          className
        )}
      >
        <ol className="flex items-center gap-1 flex-wrap">
          {displayItems.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === displayItems.length - 1;
            const isTruncation = item.url === '' && item.name === '...';

            return (
              <li key={item.url || `truncation-${index}`} className="flex items-center gap-1">
                {/* Separator (except for first item) */}
                {!isFirst && (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
                )}

                {/* Truncation indicator */}
                {isTruncation ? (
                  <span className="text-muted-foreground/70" aria-hidden="true">
                    ...
                  </span>
                ) : isLast ? (
                  /* Current page (not a link) */
                  <span
                    className="text-foreground font-medium truncate max-w-[200px]"
                    aria-current="page"
                  >
                    {item.name}
                  </span>
                ) : (
                  /* Link to parent page */
                  <Link
                    href={item.url}
                    className="hover:text-foreground transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    {isFirst && showHomeIcon ? (
                      <>
                        <Home className="h-4 w-4" />
                        <span className="sr-only">{item.name}</span>
                      </>
                    ) : (
                      <span className="truncate max-w-[150px]">{item.name}</span>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile Breadcrumbs - More compact */}
      <nav
        aria-label="Breadcrumb"
        className={cn(
          'flex sm:hidden items-center gap-1 text-xs text-muted-foreground overflow-x-auto scrollbar-hide',
          className
        )}
      >
        <ol className="flex items-center gap-1 flex-nowrap">
          {mobileItems.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === mobileItems.length - 1;
            const isTruncation = item.url === '' && item.name === '...';

            return (
              <li key={item.url || `mobile-truncation-${index}`} className="flex items-center gap-1 flex-shrink-0">
                {/* Separator (except for first item) */}
                {!isFirst && (
                  <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground/50" />
                )}

                {/* Truncation indicator */}
                {isTruncation ? (
                  <span className="text-muted-foreground/70" aria-hidden="true">
                    ...
                  </span>
                ) : isLast ? (
                  /* Current page (not a link) */
                  <span
                    className="text-foreground font-medium truncate max-w-[120px]"
                    aria-current="page"
                  >
                    {item.name}
                  </span>
                ) : (
                  /* Link to parent page */
                  <Link
                    href={item.url}
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {isFirst && showHomeIcon ? (
                      <>
                        <Home className="h-3 w-3" />
                        <span className="sr-only">{item.name}</span>
                      </>
                    ) : (
                      <span className="truncate max-w-[100px]">{item.name}</span>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

export default Breadcrumbs;

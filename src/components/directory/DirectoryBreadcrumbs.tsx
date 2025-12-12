/**
 * DirectoryBreadcrumbs component for navigation.
 *
 * Displays breadcrumb navigation for directory pages with JSON-LD
 * structured data for SEO.
 *
 * @see /src/lib/seo/structured-data.ts for schema generation
 */

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  /** Display name for the breadcrumb */
  name: string;
  /** URL path (relative or absolute) */
  href: string;
}

interface DirectoryBreadcrumbsProps {
  /** Array of breadcrumb items (in order) */
  items: BreadcrumbItem[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays breadcrumb navigation with structured data.
 *
 * Always includes a "Home" link at the start. Generates JSON-LD
 * BreadcrumbList schema for search engines.
 *
 * @example
 * <DirectoryBreadcrumbs
 *   items={[
 *     { name: 'Find Contractors', href: '/directory' },
 *     { name: 'Colorado', href: '/directory/colorado' },
 *     { name: 'Denver', href: '/directory/colorado/denver-co' },
 *     { name: 'Masonry Contractors', href: '/directory/colorado/denver-co/masonry-contractor' },
 *   ]}
 * />
 */
export function DirectoryBreadcrumbs({
  items,
  className,
}: DirectoryBreadcrumbsProps) {
  // Prepend Home to breadcrumb items
  const allItems: BreadcrumbItem[] = [
    { name: 'Home', href: '/' },
    ...items,
  ];

  // Generate JSON-LD schema for SEO
  const breadcrumbSchema = generateBreadcrumbSchema(
    allItems.map((item) => ({
      name: item.name,
      url: item.href,
    }))
  );

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      {/* Visible Breadcrumbs */}
      <nav
        aria-label="Breadcrumb navigation"
        className={cn('flex items-center gap-2 text-sm overflow-x-auto', className)}
      >
        <ol className="flex items-center gap-2 flex-wrap">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            const isFirst = index === 0;

            return (
              <li key={item.href} className="flex items-center gap-2">
                {/* Separator (skip for first item) */}
                {!isFirst && (
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                )}

                {/* Breadcrumb Link or Text */}
                {isLast ? (
                  <span className="text-foreground font-medium" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    {isFirst && <Home className="size-4" />}
                    <span>{item.name}</span>
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

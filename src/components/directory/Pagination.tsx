/**
 * Pagination Component (Server Component)
 *
 * Reusable pagination UI that generates proper SEO-friendly links.
 * Used for directory category pages and other paginated listings.
 *
 * Features:
 * - Smart ellipsis for large page counts
 * - Preserves existing query parameters
 * - Accessible with proper aria labels
 * - Server component (no client-side JS needed)
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={2}
 *   totalPages={10}
 *   baseUrl="/find/colorado/denver/masonry"
 *   searchParams={{ filter: 'commercial' }}
 * />
 * ```
 */

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;

  /** Total number of pages */
  totalPages: number;

  /** Base URL path without query string */
  baseUrl: string;

  /** Optional search parameters to preserve (e.g., filters) */
  searchParams?: Record<string, string>;
}

/**
 * Generates a URL with page number and preserved search params.
 */
function buildPageUrl(
  baseUrl: string,
  page: number,
  searchParams?: Record<string, string>
): string {
  const params = new URLSearchParams(searchParams);

  // Add page parameter (omit for page 1 to keep canonical URLs clean)
  if (page > 1) {
    params.set('page', page.toString());
  } else {
    params.delete('page');
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Generates page number buttons with smart ellipsis.
 *
 * Logic:
 * - Show max 5 page buttons at a time
 * - Always show first page if possible
 * - Center current page when in the middle
 * - Show last pages when near the end
 */
function getPageNumbers(currentPage: number, totalPages: number): number[] {
  const MAX_VISIBLE = 5;

  if (totalPages <= MAX_VISIBLE) {
    // Show all pages
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    // Near beginning: show 1, 2, 3, 4, 5
    return Array.from({ length: MAX_VISIBLE }, (_, i) => i + 1);
  }

  if (currentPage >= totalPages - 2) {
    // Near end: show last 5 pages
    return Array.from({ length: MAX_VISIBLE }, (_, i) => totalPages - MAX_VISIBLE + i + 1);
  }

  // In the middle: show current page centered
  return Array.from({ length: MAX_VISIBLE }, (_, i) => currentPage - 2 + i);
}

export function Pagination({ currentPage, totalPages, baseUrl, searchParams }: PaginationProps) {
  // Don't render if only 1 page
  if (totalPages <= 1) {
    return null;
  }

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className="flex items-center justify-center gap-2"
    >
      {/* Previous Button */}
      {hasPrevPage && (
        <Button asChild variant="outline" size="sm">
          <Link
            href={buildPageUrl(baseUrl, currentPage - 1, searchParams)}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Link>
        </Button>
      )}

      {/* Page Number Buttons */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((pageNum) => {
          const isCurrentPage = pageNum === currentPage;

          return (
            <Button
              key={pageNum}
              asChild={!isCurrentPage}
              variant={isCurrentPage ? 'default' : 'outline'}
              size="sm"
              disabled={isCurrentPage}
              className="min-w-[40px]"
              aria-label={`${isCurrentPage ? 'Current page, page' : 'Go to page'} ${pageNum}`}
              aria-current={isCurrentPage ? 'page' : undefined}
            >
              {isCurrentPage ? (
                <span>{pageNum}</span>
              ) : (
                <Link href={buildPageUrl(baseUrl, pageNum, searchParams)}>
                  {pageNum}
                </Link>
              )}
            </Button>
          );
        })}
      </div>

      {/* Next Button */}
      {hasNextPage && (
        <Button asChild variant="outline" size="sm">
          <Link
            href={buildPageUrl(baseUrl, currentPage + 1, searchParams)}
            aria-label="Go to next page"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      )}
    </nav>
  );
}

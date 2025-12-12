/**
 * Pagination Component (Client Component)
 *
 * Client-side version of pagination that uses Next.js router for instant transitions.
 * Useful when you want smoother page changes without full page reloads.
 *
 * Features:
 * - Uses useRouter for client-side navigation
 * - Smart ellipsis for large page counts
 * - Preserves existing query parameters
 * - Accessible with proper aria labels
 *
 * @example
 * ```tsx
 * 'use client'
 * import { PaginationClient } from '@/components/directory/PaginationClient'
 *
 * <PaginationClient
 *   currentPage={2}
 *   totalPages={10}
 *   baseUrl="/find/colorado/denver/masonry"
 *   searchParams={{ filter: 'commercial' }}
 * />
 * ```
 */

'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationClientProps {
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
 */
function getPageNumbers(currentPage: number, totalPages: number): number[] {
  const MAX_VISIBLE = 5;

  if (totalPages <= MAX_VISIBLE) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return Array.from({ length: MAX_VISIBLE }, (_, i) => i + 1);
  }

  if (currentPage >= totalPages - 2) {
    return Array.from({ length: MAX_VISIBLE }, (_, i) => totalPages - MAX_VISIBLE + i + 1);
  }

  return Array.from({ length: MAX_VISIBLE }, (_, i) => currentPage - 2 + i);
}

export function PaginationClient({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
}: PaginationClientProps) {
  const router = useRouter();

  // Don't render if only 1 page
  if (totalPages <= 1) {
    return null;
  }

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const navigateToPage = (page: number) => {
    const url = buildPageUrl(baseUrl, page, searchParams);
    router.push(url);
  };

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className="flex items-center justify-center gap-2"
    >
      {/* Previous Button */}
      {hasPrevPage && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(currentPage - 1)}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
      )}

      {/* Page Number Buttons */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((pageNum) => {
          const isCurrentPage = pageNum === currentPage;

          return (
            <Button
              key={pageNum}
              variant={isCurrentPage ? 'default' : 'outline'}
              size="sm"
              disabled={isCurrentPage}
              onClick={() => !isCurrentPage && navigateToPage(pageNum)}
              className="min-w-[40px]"
              aria-label={`${isCurrentPage ? 'Current page, page' : 'Go to page'} ${pageNum}`}
              aria-current={isCurrentPage ? 'page' : undefined}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      {/* Next Button */}
      {hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(currentPage + 1)}
          aria-label="Go to next page"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </nav>
  );
}

import Link from 'next/link';
import { ContractorRow, type ContractorData } from '@/components/dashboard/ContractorRow';
import {
  getContractors as getContractorsQuery,
  getCachedLocations,
  getCachedCategories,
  getCachedSearchTerms,
  type LocationOption,
} from '@/lib/supabase/queries';
import { Users, ChevronLeft, ChevronRight, Database, X } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { ContractorFilters } from './ContractorFilters';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Builds a URL with the current filters and a new page number
 *
 * @param currentParams - Current search params
 * @param overrides - Params to override
 * @returns URL search string
 */
function buildQueryString(
  currentParams: Record<string, string | undefined>,
  overrides: Record<string, string | undefined> = {}
): string {
  const merged = { ...currentParams, ...overrides };
  const params = new URLSearchParams();

  Object.entries(merged).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'false') {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetches contractors data from Supabase with optional filters.
 *
 * @param searchParams - URL search parameters for filtering
 */
async function getContractorsData(searchParams: {
  search?: string;
  location?: string;
  category?: string;
  searchTerm?: string;
  minRating?: string;
  maxRating?: string;
  hasReviews?: string;
  hasAnalysis?: string;
  hasArticle?: string;
  page?: string;
}): Promise<{
  contractors: ContractorData[];
  locations: Array<{ value: string; label: string }>;
  categories: string[];
  searchTerms: string[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}> {
  noStore();
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 10;

  // Build filters from search params
  const filters = {
    search: searchParams.search || undefined,
    location: searchParams.location || undefined,
    category: searchParams.category || undefined,
    searchTerm: searchParams.searchTerm || undefined,
    minRating: searchParams.minRating ? parseFloat(searchParams.minRating) : undefined,
    maxRating: searchParams.maxRating ? parseFloat(searchParams.maxRating) : undefined,
    hasReviews: searchParams.hasReviews === 'true' ? true : undefined,
    hasAnalysis: searchParams.hasAnalysis === 'true' ? true : undefined,
    hasArticle: searchParams.hasArticle === 'true' ? true : undefined,
  };

  // Fetch data in parallel - using cached versions for filter dropdowns
  // to avoid full table scans on every page load
  const [contractorsResult, locationsRaw, categories, searchTerms] = await Promise.all([
    getContractorsQuery(filters, page, limit),
    getCachedLocations(),   // Cached for 1 hour
    getCachedCategories(),  // Cached for 1 hour
    getCachedSearchTerms(), // Cached for 1 hour
  ]);

  const locations = (locationsRaw || [])
    .map((location: LocationOption) => ({
      value: `${location.city}||${location.state ?? ''}`,
      label: location.state ? `${location.city}, ${location.state}` : location.city,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Transform to ContractorData format expected by ContractorRow component
  const contractors: ContractorData[] = contractorsResult.data.map((c) => ({
    id: c.id,
    businessName: c.business_name,
    rating: c.rating ?? 0,
    reviewCount: c.reviewCount,
    city: c.city,
    state: c.state || '',
    pipelineStatus: {
      hasReviews: c.reviewCount > 0,
      hasAnalysis: c.hasAnalysis,
      hasArticle: c.hasArticle,
    },
    lastSyncedAt: c.last_synced_at,
  }));

  return {
    contractors,
    locations,
    categories,
    searchTerms,
    totalCount: contractorsResult.total,
    currentPage: page,
    totalPages: Math.ceil(contractorsResult.total / limit),
  };
}



/**
 * Generate page numbers to display in pagination
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = [];

  if (totalPages <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Show pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
  }

  return pages;
}

/**
 * Pagination component for navigating through contractor pages.
 * Mission Control style with monospace fonts and zinc colors.
 */
function Pagination({
  currentPage,
  totalPages,
  totalCount,
  currentParams,
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  currentParams: Record<string, string | undefined>;
}) {
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  // Build params without page for link building
  const baseParams = { ...currentParams };
  delete baseParams.page;

  return (
    <div className="flex items-center justify-between border-t border-zinc-800/50 px-4 py-3 bg-zinc-900/50">
      {/* Results count */}
      <p className="text-xs font-mono text-zinc-500">
        Page <span className="text-zinc-300">{currentPage}/{totalPages}</span> &middot; {totalCount.toLocaleString()} total
      </p>

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        {currentPage > 1 && (
          <Link
            href={`/contractors${buildQueryString(baseParams, { page: String(currentPage - 1) })}`}
            className="px-3 py-1.5 text-xs font-mono bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border border-zinc-700/50 rounded transition-colors"
          >
            &larr; Prev
          </Link>
        )}

        {/* Page numbers (desktop) */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-zinc-600 font-mono">
                  ...
                </span>
              );
            }

            const isCurrentPage = page === currentPage;

            return (
              <Link
                key={page}
                href={`/contractors${buildQueryString(baseParams, { page: String(page) })}`}
                className={`h-8 w-8 flex items-center justify-center text-xs font-mono rounded border transition-colors ${
                  isCurrentPage
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:bg-zinc-700/50 hover:text-zinc-200'
                }`}
              >
                {page}
              </Link>
            );
          })}
        </div>

        {currentPage < totalPages && (
          <Link
            href={`/contractors${buildQueryString(baseParams, { page: String(currentPage + 1) })}`}
            className="px-3 py-1.5 text-xs font-mono bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border border-zinc-700/50 rounded transition-colors"
          >
            Next &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Contractors list page (Server Component).
 * Displays a filterable, paginated list of contractors with their pipeline status.
 *
 * Features:
 * - Search by business name
 * - Filter by location, category, search term, rating range
 * - Filter by pipeline status (has reviews, analysis, article)
 * - Paginated results with URL-based navigation
 * - Click through to contractor detail page
 *
 * @see /Users/aaronbaker/knearme-workspace/review-agent-dashboard/src/components/dashboard/ContractorRow.tsx
 */
export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // Normalize params to string | undefined
  const normalizedParams: Record<string, string | undefined> = {
    search: typeof params.search === 'string' ? params.search : undefined,
    location: typeof params.location === 'string' ? params.location : undefined,
    category: typeof params.category === 'string' ? params.category : undefined,
    searchTerm: typeof params.searchTerm === 'string' ? params.searchTerm : undefined,
    minRating: typeof params.minRating === 'string' ? params.minRating : undefined,
    maxRating: typeof params.maxRating === 'string' ? params.maxRating : undefined,
    hasReviews: typeof params.hasReviews === 'string' ? params.hasReviews : undefined,
    hasAnalysis: typeof params.hasAnalysis === 'string' ? params.hasAnalysis : undefined,
    hasArticle: typeof params.hasArticle === 'string' ? params.hasArticle : undefined,
    page: typeof params.page === 'string' ? params.page : undefined,
  };

  const { contractors, locations, categories, searchTerms, totalCount, currentPage, totalPages } =
    await getContractorsData(normalizedParams);

  const locationLabelMap = new Map(locations.map((location) => [location.value, location.label]));
  const activeFilters: Array<{ key: string; label: string }> = [];

  if (normalizedParams.search) {
    activeFilters.push({ key: 'search', label: `Search: ${normalizedParams.search}` });
  }
  if (normalizedParams.location && normalizedParams.location !== 'all') {
    activeFilters.push({
      key: 'location',
      label: `Location: ${locationLabelMap.get(normalizedParams.location) || normalizedParams.location}`,
    });
  }
  if (normalizedParams.category && normalizedParams.category !== 'all') {
    activeFilters.push({ key: 'category', label: `Category: ${normalizedParams.category}` });
  }
  if (normalizedParams.searchTerm && normalizedParams.searchTerm !== 'all') {
    activeFilters.push({ key: 'searchTerm', label: `Search Term: ${normalizedParams.searchTerm}` });
  }
  if (normalizedParams.minRating) {
    activeFilters.push({ key: 'minRating', label: `Rating ≥ ${normalizedParams.minRating}` });
  }
  if (normalizedParams.maxRating) {
    activeFilters.push({ key: 'maxRating', label: `Rating ≤ ${normalizedParams.maxRating}` });
  }
  if (normalizedParams.hasReviews === 'true') {
    activeFilters.push({ key: 'hasReviews', label: 'Has Reviews' });
  }
  if (normalizedParams.hasAnalysis === 'true') {
    activeFilters.push({ key: 'hasAnalysis', label: 'Has Analysis' });
  }
  if (normalizedParams.hasArticle === 'true') {
    activeFilters.push({ key: 'hasArticle', label: 'Has Article' });
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Mission Control Style */}
      <PageHeader
        title="Contractors"
        subtitle="Browse and manage contractors in the review analysis pipeline"
        icon={Users}
        badge="Pipeline"
        badgeColor="cyan"
        recordCount={totalCount}
        tableName="review_contractors"
      />

      {/* Filters Section */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Filters
          </span>
        </div>
        <ContractorFilters locations={locations} categories={categories} searchTerms={searchTerms} />
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-xs font-mono text-zinc-400">
          {activeFilters.map((filter) => (
            <Link
              key={`${filter.key}-${filter.label}`}
              href={`/contractors${buildQueryString({ ...normalizedParams, page: undefined }, { [filter.key]: undefined })}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/60 px-3 py-1 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500/60 transition-colors"
            >
              <span className="truncate max-w-[180px]">{filter.label}</span>
              <X className="h-3 w-3 text-zinc-500" />
            </Link>
          ))}
          <Link
            href="/contractors"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/50 px-3 py-1 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500/60 transition-colors"
          >
            Clear all
          </Link>
        </div>
      )}

      {/* Contractors List */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Contractor Records
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-600">
            Showing {contractors.length} of {totalCount.toLocaleString()}
          </span>
        </div>

        <div className="divide-y divide-zinc-800/30">
          {contractors.length > 0 ? (
            contractors.map((contractor) => (
              <ContractorRow key={contractor.id} contractor={contractor} />
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
                <Users className="h-8 w-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-300 mb-1">
                No contractors found
              </h3>
              <p className="text-sm text-zinc-500 max-w-md mx-auto">
                No contractors match your current filters. Try adjusting your search criteria.
              </p>
              <p className="mt-4 text-xs font-mono text-zinc-600">
                Table: <code className="px-1.5 py-0.5 bg-zinc-800/50 rounded">review_contractors</code>
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            currentParams={normalizedParams}
          />
        )}
      </div>
    </div>
  );
}

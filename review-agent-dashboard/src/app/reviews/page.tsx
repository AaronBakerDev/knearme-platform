import Link from 'next/link';
import {
  getReviews,
  getCachedLocations,
  getCachedCategories,
  getCachedSearchTerms,
  getCachedDetectedServices,
  type ReviewFilters,
  type LocationOption,
} from '@/lib/supabase/queries';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatBlock, StatBlockGrid } from '@/components/dashboard/StatBlock';
import { ReviewsFilters } from './ReviewsFilters';
import {
  Star,
  MessageSquare,
  User,
  Building2,
  Calendar,
  TrendingUp,
  Percent,
  X,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertCircle,
  Wrench,
  Settings,
  DollarSign,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Reviews Browser Page
 *
 * Server Component that fetches real review data from Supabase.
 * Mission Control dark theme styling.
 */

interface PageProps {
  searchParams: Promise<{
    page?: string;
    rating?: string;
    search?: string;
    hasResponse?: string;
    location?: string;
    category?: string;
    searchTerm?: string;
    /** Detected service from AI analysis (for filtering) */
    service?: string;
  }>;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Rating badge with star display - Mission Control styling.
 */
function RatingBadge({ rating }: { rating: number }) {
  const getColor = (r: number) => {
    if (r >= 4) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (r >= 3) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${getColor(rating)}`}
    >
      <Star className="h-3 w-3 fill-current" />
      {rating}.0
    </span>
  );
}

function buildQueryString(
  params: Record<string, string | number | undefined>,
  overrides: Record<string, string | number | undefined> = {}
): string {
  const merged = { ...params, ...overrides };
  const searchParams = new URLSearchParams();
  Object.entries(merged).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString() ? `?${searchParams.toString()}` : '';
}

/**
 * Generate page numbers to display in pagination
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }
  }

  return pages;
}

/**
 * Pagination component with Mission Control styling.
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
      <p className="text-xs font-mono text-zinc-500">
        Page <span className="text-zinc-300">{currentPage}/{totalPages}</span> &middot; {totalCount.toLocaleString()} total
      </p>

      <div className="flex items-center gap-2">
        {currentPage > 1 && (
          <Link
            href={`/reviews${buildQueryString(baseParams, { page: currentPage - 1 })}`}
            className="px-3 py-1.5 text-xs font-mono bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border border-zinc-700/50 rounded transition-colors"
          >
            &larr; Prev
          </Link>
        )}

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
                href={`/reviews${buildQueryString(baseParams, { page })}`}
                className={`h-8 w-8 flex items-center justify-center text-xs font-mono rounded border transition-colors ${
                  isCurrentPage
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
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
            href={`/reviews${buildQueryString(baseParams, { page: currentPage + 1 })}`}
            className="px-3 py-1.5 text-xs font-mono bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border border-zinc-700/50 rounded transition-colors"
          >
            Next &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const limit = 20;

  // Build filters from URL params
  const filters: ReviewFilters = {};
  if (params.rating && params.rating !== 'all') {
    filters.rating = parseInt(params.rating, 10);
  }
  if (params.search) {
    filters.search = params.search;
  }
  if (params.hasResponse === 'true') {
    filters.hasOwnerResponse = true;
  } else if (params.hasResponse === 'false') {
    filters.hasOwnerResponse = false;
  }

  if (params.location && params.location !== 'all') {
    filters.location = params.location;
  }
  if (params.category && params.category !== 'all') {
    filters.category = params.category;
  }
  if (params.searchTerm && params.searchTerm !== 'all') {
    filters.searchTerm = params.searchTerm;
  }
  if (params.service && params.service !== 'all') {
    filters.services = [params.service];
  }

  const [
    reviewsResult,
    locationsRaw,
    categories,
    searchTerms,
    detectedServices,
  ] = await Promise.all([
    getReviews(filters, page, limit),
    getCachedLocations(),
    getCachedCategories(),
    getCachedSearchTerms(),
    getCachedDetectedServices(),
  ]);

  const locations = (locationsRaw || [])
    .map((location: LocationOption) => ({
      value: `${location.city}||${location.state ?? ''}`,
      label: location.state ? `${location.city}, ${location.state}` : location.city,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const { data: reviews, total, stats } = reviewsResult;

  const totalPages = Math.ceil(total / limit);
  const hasFilters =
    (params.rating && params.rating !== 'all') ||
    (params.search && params.search !== '') ||
    (params.hasResponse && params.hasResponse !== 'all') ||
    (params.location && params.location !== 'all') ||
    (params.category && params.category !== 'all') ||
    (params.searchTerm && params.searchTerm !== 'all') ||
    (params.service && params.service !== 'all');

  // Current params for pagination links
  const currentParams = {
    rating: params.rating,
    search: params.search,
    hasResponse: params.hasResponse,
    location: params.location,
    category: params.category,
    searchTerm: params.searchTerm,
    service: params.service,
  };

  const locationLabelMap = new Map(locations.map((location) => [location.value, location.label]));
  const activeFilters: Array<{ key: string; label: string }> = [];

  if (params.search) {
    activeFilters.push({ key: 'search', label: `Search: ${params.search}` });
  }
  if (params.location && params.location !== 'all') {
    activeFilters.push({
      key: 'location',
      label: `Location: ${locationLabelMap.get(params.location) || params.location}`,
    });
  }
  if (params.category && params.category !== 'all') {
    activeFilters.push({ key: 'category', label: `Category: ${params.category}` });
  }
  if (params.searchTerm && params.searchTerm !== 'all') {
    activeFilters.push({ key: 'searchTerm', label: `Search Term: ${params.searchTerm}` });
  }
  if (params.rating && params.rating !== 'all') {
    activeFilters.push({ key: 'rating', label: `Rating: ${params.rating}★` });
  }
  if (params.hasResponse === 'true') {
    activeFilters.push({ key: 'hasResponse', label: 'Has Response' });
  } else if (params.hasResponse === 'false') {
    activeFilters.push({ key: 'hasResponse', label: 'No Response' });
  }
  if (params.service && params.service !== 'all') {
    activeFilters.push({ key: 'service', label: `Service: ${params.service}` });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Reviews"
        subtitle="Browse all collected reviews across contractors"
        icon={MessageSquare}
        badge="Data"
        badgeColor="amber"
        recordCount={total}
        tableName="review_reviews"
      />

      {/* Stats Grid */}
      <StatBlockGrid columns={3}>
        <StatBlock
          label="Total Reviews"
          value={total}
          icon={MessageSquare}
          color="amber"
        />
        <StatBlock
          label="Avg Rating"
          value={stats.avgRating.toFixed(1)}
          icon={TrendingUp}
          color="emerald"
          subtitle="out of 5.0"
        />
        <StatBlock
          label="Response Rate"
          value={`${stats.responseRate.toFixed(0)}%`}
          icon={Percent}
          color="cyan"
        />
      </StatBlockGrid>

      {/* Filters Section */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Filters
          </span>
        </div>
        <ReviewsFilters
          locations={locations}
          categories={categories}
          searchTerms={searchTerms}
          services={detectedServices}
        />
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-xs font-mono text-zinc-400">
          {activeFilters.map((filter) => (
            <Link
              key={`${filter.key}-${filter.label}`}
              href={`/reviews${buildQueryString(currentParams, { [filter.key]: undefined })}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/60 px-3 py-1 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500/60 transition-colors"
            >
              <span className="truncate max-w-[180px]">{filter.label}</span>
              <X className="h-3 w-3 text-zinc-500" />
            </Link>
          ))}
          <Link
            href="/reviews"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/50 px-3 py-1 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500/60 transition-colors"
          >
            Clear all
          </Link>
        </div>
      )}

      {/* Reviews List */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Review Records
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-600">
            Showing {reviews.length} of {total.toLocaleString()}
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
              <MessageSquare className="h-8 w-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-1">
              No reviews found
            </h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              {hasFilters
                ? 'No reviews match your current filters. Try adjusting your search criteria.'
                : 'Reviews will appear here once collected by the agent.'}
            </p>
            <p className="mt-4 text-xs font-mono text-zinc-600">
              Table: <code className="px-1.5 py-0.5 bg-zinc-800/50 rounded">review_reviews</code>
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/30">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="px-4 py-4 hover:bg-zinc-800/30 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                      <User className="h-5 w-5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200">
                        {review.reviewer_name || 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono mt-0.5">
                        <Calendar className="h-3 w-3 text-zinc-600" />
                        {formatDate(review.review_date)}
                      </div>
                    </div>
                  </div>
                  <RatingBadge rating={review.rating} />
                </div>

                {/* Review text */}
                {review.review_text && (
                  <p className="text-sm text-zinc-400 leading-relaxed mb-3 line-clamp-3">
                    {review.review_text}
                  </p>
                )}

                {/* AI Analysis Section - shows when analysis_json exists */}
                {review.analysis_json && (
                  <div className="flex flex-wrap items-center gap-2 mb-3 pt-2 border-t border-zinc-800/30">
                    {/* Detected Services */}
                    {review.analysis_json.detected_services?.map((service) => (
                      <Badge
                        key={service}
                        variant="secondary"
                        className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] font-mono uppercase tracking-wide"
                      >
                        {service}
                      </Badge>
                    ))}

                    {/* Project Type */}
                    {review.analysis_json.project_type && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        {review.analysis_json.project_type === 'repair' && <Wrench className="w-3 h-3" />}
                        {review.analysis_json.project_type === 'maintenance' && <Settings className="w-3 h-3" />}
                        {review.analysis_json.project_type === 'new_construction' && <Building2 className="w-3 h-3" />}
                        {review.analysis_json.project_type}
                      </span>
                    )}

                    {/* Sentiment Indicator */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono border ${
                        review.analysis_json.sentiment === 'positive'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : review.analysis_json.sentiment === 'negative'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : review.analysis_json.sentiment === 'mixed'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}
                      title={`Sentiment: ${review.analysis_json.sentiment} (${review.analysis_json.sentiment_score?.toFixed(2)})`}
                    >
                      {review.analysis_json.sentiment === 'positive' && <ThumbsUp className="w-3 h-3" />}
                      {review.analysis_json.sentiment === 'negative' && <ThumbsDown className="w-3 h-3" />}
                      {review.analysis_json.sentiment === 'mixed' && <AlertCircle className="w-3 h-3" />}
                      {review.analysis_json.sentiment === 'neutral' && <Minus className="w-3 h-3" />}
                      {review.analysis_json.sentiment_score !== undefined && (
                        <span>{review.analysis_json.sentiment_score > 0 ? '+' : ''}{review.analysis_json.sentiment_score.toFixed(1)}</span>
                      )}
                    </span>

                    {/* Price/Timeline indicators */}
                    {review.analysis_json.mentions_price && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20" title="Mentions pricing">
                        <DollarSign className="w-3 h-3 text-green-400" />
                      </span>
                    )}
                    {review.analysis_json.mentions_timeline && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20" title="Mentions timeline">
                        <Clock className="w-3 h-3 text-blue-400" />
                      </span>
                    )}

                    {/* Themes */}
                    {review.analysis_json.themes?.slice(0, 3).map((theme) => (
                      <span
                        key={theme}
                        className="text-[10px] text-zinc-500 font-medium px-2 py-0.5 rounded bg-zinc-800/50 border border-zinc-700/30"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                )}

                {/* Contractor link */}
                {review.contractor && (
                  <Link
                    href={`/contractors/${review.contractor.id}`}
                    className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {review.contractor.business_name}
                    {review.contractor.city && (
                      <span className="text-zinc-600">
                        • {review.contractor.city}, {review.contractor.state}
                      </span>
                    )}
                  </Link>
                )}

                {/* Owner response */}
                {review.owner_response && (
                  <div className="mt-4 pl-4 border-l-2 border-violet-500/50 bg-violet-500/5 rounded-r-lg p-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-violet-400 mb-1">
                      Owner Response
                    </p>
                    <p className="text-sm text-zinc-400">
                      {review.owner_response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={total}
            currentParams={currentParams}
          />
        )}
      </div>
    </div>
  );
}

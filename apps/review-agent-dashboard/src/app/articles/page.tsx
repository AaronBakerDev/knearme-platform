import Link from 'next/link';
import { ArticleCard, type ArticleData } from '@/components/dashboard/ArticleCard';
import { getArticles as getArticlesQuery, getArticleStatusCounts } from '@/lib/supabase/queries';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatBlock, StatBlockGrid } from '@/components/dashboard/StatBlock';
import type { ArticleSortOption } from '@/lib/types';
import { updateArticleStatus } from './actions';
import { Search, FileText, CheckCircle2, Clock } from 'lucide-react';

/**
 * Builds a URL with the current filters and optional overrides
 */
function buildQueryString(
  currentParams: Record<string, string | undefined>,
  overrides: Record<string, string | undefined> = {}
): string {
  const merged = { ...currentParams, ...overrides };
  const params = new URLSearchParams();

  Object.entries(merged).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetches articles data from Supabase with optional filters.
 */
async function getArticlesData(searchParams: {
  status?: string;
  search?: string;
  sort?: string;
  page?: string;
}): Promise<{
  articles: ArticleData[];
  totalCount: number;
  statsTotal: number;
  publishedCount: number;
  draftCount: number;
  currentPage: number;
  totalPages: number;
}> {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 10;

  // Parse status filter
  const statusFilter = searchParams.status === 'draft' || searchParams.status === 'published'
    ? searchParams.status
    : undefined;

  // Parse sort option
  const sortOption = (searchParams.sort as ArticleSortOption) || 'generated_desc';

  // Fetch articles with filters
  const result = await getArticlesQuery(
    {
      status: statusFilter,
      search: searchParams.search || undefined,
      sort: sortOption,
    },
    page,
    limit
  );

  // Transform to ArticleData format expected by ArticleCard component
  const articles: ArticleData[] = result.data.map((article) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    status: article.status,
    generatedAt: article.generated_at,
    wordCount: article.content_markdown?.split(/\s+/).filter(Boolean).length || 0,
    contractor: {
      id: article.contractor?.id || '',
      businessName: article.contractor?.business_name || 'Unknown',
      city: article.contractor?.city || '',
      state: article.contractor?.state || '',
    },
  }));

  // Count published and draft articles matching the current search
  const { total, published, draft } = await getArticleStatusCounts(searchParams.search);

  return {
    articles,
    totalCount: result.total,
    statsTotal: total,
    publishedCount: published,
    draftCount: draft,
    currentPage: page,
    totalPages: Math.ceil(result.total / limit),
  };
}

/**
 * Filter section component with Mission Control styling.
 */
function FiltersSection({
  currentParams,
}: {
  currentParams: Record<string, string | undefined>;
}) {
  return (
    <form action="/articles" method="GET">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Status Filter */}
        <select
          name="status"
          defaultValue={currentParams.status || ''}
          className="h-9 w-[140px] px-3 rounded-lg border-zinc-700/50 bg-zinc-800/50 text-sm text-zinc-300 font-mono focus:border-emerald-500/50 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            name="search"
            defaultValue={currentParams.search || ''}
            placeholder="Search by title or contractor..."
            className="w-full h-9 pl-10 pr-4 rounded-lg border border-zinc-700/50 bg-zinc-800/50 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>

        {/* Sort Filter */}
        <select
          name="sort"
          defaultValue={currentParams.sort || 'generated_desc'}
          className="h-9 w-[160px] px-3 rounded-lg border-zinc-700/50 bg-zinc-800/50 text-sm text-zinc-300 font-mono focus:border-emerald-500/50 focus:outline-none"
        >
          <option value="generated_desc">Newest First</option>
          <option value="generated_asc">Oldest First</option>
          <option value="title_asc">Title A-Z</option>
          <option value="title_desc">Title Z-A</option>
        </select>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="h-9 px-4 text-xs font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors"
          >
            Apply
          </button>
          <Link
            href="/articles"
            className="h-9 px-4 text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-zinc-700/50 rounded-lg transition-colors flex items-center"
          >
            Clear
          </Link>
        </div>
      </div>
    </form>
  );
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
            href={`/articles${buildQueryString(baseParams, { page: String(currentPage - 1) })}`}
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
                href={`/articles${buildQueryString(baseParams, { page: String(page) })}`}
                className={`h-8 w-8 flex items-center justify-center text-xs font-mono rounded border transition-colors ${
                  isCurrentPage
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
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
            href={`/articles${buildQueryString(baseParams, { page: String(currentPage + 1) })}`}
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
 * Articles list page (Server Component).
 * Mission Control styling with dark theme.
 */
export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // Normalize params to string | undefined
  const normalizedParams: Record<string, string | undefined> = {
    status: typeof params.status === 'string' ? params.status : undefined,
    search: typeof params.search === 'string' ? params.search : undefined,
    sort: typeof params.sort === 'string' ? params.sort : undefined,
    page: typeof params.page === 'string' ? params.page : undefined,
  };

  const { articles, totalCount, statsTotal, publishedCount, draftCount, currentPage, totalPages } =
    await getArticlesData(normalizedParams);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Articles"
        subtitle="Manage AI-generated contractor review articles"
        icon={FileText}
        badge="Content"
        badgeColor="emerald"
        recordCount={totalCount}
        tableName="review_articles"
      />

      {/* Stats Grid */}
      <StatBlockGrid columns={3}>
        <StatBlock
          label="Total Articles"
          value={statsTotal}
          icon={FileText}
          color="emerald"
        />
        <StatBlock
          label="Published"
          value={publishedCount}
          icon={CheckCircle2}
          color="cyan"
        />
        <StatBlock
          label="Drafts"
          value={draftCount}
          icon={Clock}
          color="amber"
        />
      </StatBlockGrid>

      {/* Filters Section */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Filters
          </span>
        </div>
        <FiltersSection currentParams={normalizedParams} />
      </div>

      {/* Articles List */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Article Records
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-600">
            Showing {articles.length} of {totalCount.toLocaleString()}
          </span>
        </div>

        <div className="divide-y divide-zinc-800/30">
          {articles.length > 0 ? (
            articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onPublishToggle={updateArticleStatus}
              />
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
                <FileText className="h-8 w-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-300 mb-1">
                No articles found
              </h3>
              <p className="text-sm text-zinc-500 max-w-md mx-auto">
                {normalizedParams.search || normalizedParams.status
                  ? 'No articles match your current filters. Try adjusting your search criteria.'
                  : 'Articles will appear here once they are generated from contractor reviews.'}
              </p>
              <p className="mt-4 text-xs font-mono text-zinc-600">
                Table: <code className="px-1.5 py-0.5 bg-zinc-800/50 rounded">review_articles</code>
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

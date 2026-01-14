import Link from 'next/link'
import { Suspense } from 'react'
import {
  Search,
  MapPin,
  Users,
  Globe,
  Building2,
  AlertTriangle,
  Copy,
  Activity,
  Database,
} from 'lucide-react'
import {
  getSearchHistory,
  getSearchStatsOptimized,
  getGlobalFilterOptions,
  getDuplicateKeysOptimized,
  type SearchSortColumn,
} from '@/lib/supabase/queries'
import type { SearchHistoryFilters } from '@/lib/types'
import {
  SortableHeader,
  type SortOrder,
  parseSortParams,
  buildSortUrlHelper,
} from '@/components/dashboard/SortableHeader'
import { SearchFilters } from '@/components/dashboard/SearchFilters'

// =============================================================================
// Utility Functions
// =============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return formatDate(dateString)
}

// =============================================================================
// Stat Components (Mission Control Style)
// =============================================================================

function StatBlock({
  label,
  value,
  icon: Icon,
  color = 'emerald',
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color?: 'emerald' | 'amber' | 'cyan' | 'violet'
}) {
  const colorClasses = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
      <div
        className={`flex items-center justify-center h-10 w-10 rounded-lg border ${colorClasses[color]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          {label}
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// Result Badge
// =============================================================================

function ResultsBadge({ count }: { count: number }) {
  const colorClass =
    count === 0
      ? 'bg-red-500/15 text-red-400 border-red-500/30'
      : count < 10
        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono tabular-nums ${colorClass}`}
    >
      <Users className="h-3 w-3" />
      {count}
    </span>
  )
}

// =============================================================================
// Duplicate Badge
// =============================================================================

function DuplicateBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono uppercase tracking-wider"
      title="This city + search term combination has been searched multiple times"
    >
      <Copy className="h-2.5 w-2.5" />
      DUP
    </span>
  )
}

// =============================================================================
// Main Page Component
// =============================================================================

export default async function SearchesPage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string
    state?: string
    page?: string
    sort?: string
    order?: string
  }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)

  // Parse sort params
  const { sort, order } = parseSortParams(
    { sort: params.sort, order: params.order },
    'searched_at',
    'desc'
  )
  const sortColumn = sort as SearchSortColumn

  const filters: SearchHistoryFilters = {}
  if (params.city) filters.city = params.city
  if (params.state) filters.state = params.state

  // Fetch data with optimized queries (parallel)
  const [searchesResult, stats, filterOptions, duplicateKeys] =
    await Promise.all([
      getSearchHistory(filters, page, 50, sortColumn, order),
      getSearchStatsOptimized(filters),
      getGlobalFilterOptions(),
      getDuplicateKeysOptimized(),
    ])

  const { data: searches, total } = searchesResult
  const totalPages = Math.ceil(total / 50)

  // Convert duplicate keys array to Set for O(1) lookup
  const duplicatesSet = new Set(duplicateKeys)

  // Helper to check if a search is a duplicate
  const isDuplicate = (search: {
    city: string
    state: string | null
    search_term: string
  }) => {
    const key = `${search.city}|${search.state || ''}|${search.search_term}`
    return duplicatesSet.has(key)
  }

  // Build filter URLs
  const baseUrl = '/searches'
  const buildFilterUrl = (newParams: Record<string, string | undefined>) => {
    const merged = { ...params, ...newParams, page: '1' }
    const queryParts = Object.entries(merged)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
    return queryParts.length > 0 ? `${baseUrl}?${queryParts.join('&')}` : baseUrl
  }

  // Build sort URL helper
  const buildSortUrl = (column: string, sortOrder: SortOrder) =>
    buildSortUrlHelper(baseUrl, params, column, sortOrder)

  return (
    <div className="space-y-6">
      {/* Page Header - Mission Control Style */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
                Search History
              </h1>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">
              Live
            </span>
          </div>
          <p className="text-sm text-zinc-500 font-mono">
            Google Maps discovery operations &middot; {total.toLocaleString()}{' '}
            records
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
          <Database className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-mono text-zinc-500">
            searched_cities
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBlock
          label="Total Searches"
          value={stats.totalSearches}
          icon={Search}
          color="emerald"
        />
        <StatBlock
          label="Contractors Found"
          value={stats.totalContractorsFound}
          icon={Building2}
          color="cyan"
        />
        <StatBlock
          label="Cities Searched"
          value={stats.uniqueCities}
          icon={MapPin}
          color="violet"
        />
        <StatBlock
          label="States Covered"
          value={stats.uniqueStates}
          icon={Globe}
          color="amber"
        />
      </div>

      {/* Duplicate Warning */}
      {duplicateKeys.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-zinc-200">
              <span className="font-mono text-amber-400">
                {duplicateKeys.length}
              </span>{' '}
              duplicate search{duplicateKeys.length === 1 ? '' : 'es'} detected
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Same city + search term combination searched multiple times. This
              may result in duplicate contractor entries.
            </p>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Filters
          </span>
        </div>
        <Suspense
          fallback={
            <div className="h-10 bg-zinc-800/50 rounded animate-pulse" />
          }
        >
          <SearchFilters
            states={filterOptions.states}
            cities={filterOptions.cities}
            currentState={params.state}
            currentCity={params.city}
          />
        </Suspense>
      </div>

      {/* Data Table */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Search Records
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-600">
            Showing {searches.length} of {total.toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-950/50">
                <SortableHeader
                  column="city"
                  label="Location"
                  currentSort={sort}
                  currentOrder={order}
                  buildSortUrl={buildSortUrl}
                  className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500"
                />
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500">
                  Search Term
                </th>
                <SortableHeader
                  column="searched_at"
                  label="Timestamp"
                  currentSort={sort}
                  currentOrder={order}
                  buildSortUrl={buildSortUrl}
                  className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500"
                />
                <SortableHeader
                  column="contractors_found"
                  label="Results"
                  currentSort={sort}
                  currentOrder={order}
                  buildSortUrl={buildSortUrl}
                  align="right"
                  className="px-4 py-3 text-right font-mono text-xs uppercase tracking-wider text-zinc-500"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {searches.map((search) => (
                <tr
                  key={search.id}
                  className="hover:bg-zinc-800/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-zinc-600" />
                      <div>
                        <p className="text-zinc-200 font-medium">
                          {search.city}
                        </p>
                        <p className="text-xs font-mono text-zinc-600">
                          {search.state ? `${search.state}, ` : ''}
                          {search.country}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-300">
                        {search.search_term}
                      </span>
                      {isDuplicate(search) && <DuplicateBadge />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-mono text-zinc-300 tabular-nums">
                        {formatRelativeTime(search.searched_at)}
                      </p>
                      <p className="text-xs font-mono text-zinc-600">
                        {formatDate(search.searched_at)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ResultsBadge count={search.contractors_found} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {searches.length === 0 && (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
              <Search className="h-8 w-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-1">
              No searches found
            </h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              {params.city || params.state
                ? 'Try adjusting your filters to see more results.'
                : 'Search history will appear here once you run the discover script.'}
            </p>
            <p className="mt-4 text-xs font-mono text-zinc-600">
              Table:{' '}
              <code className="px-1.5 py-0.5 bg-zinc-800/50 rounded">
                searched_cities
              </code>
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-800/50 px-4 py-3 bg-zinc-900/50">
            <p className="text-xs font-mono text-zinc-500">
              Page{' '}
              <span className="text-zinc-300">
                {page}/{totalPages}
              </span>{' '}
              &middot; {total.toLocaleString()} total
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildFilterUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 text-xs font-mono bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border border-zinc-700/50 rounded transition-colors"
                >
                  &larr; Prev
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildFilterUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 text-xs font-mono bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border border-zinc-700/50 rounded transition-colors"
                >
                  Next &rarr;
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

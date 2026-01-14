import Link from 'next/link';
import {
  ScrollText,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  DollarSign,
  Building2,
  Filter,
  Calendar,
  Timer,
} from 'lucide-react';
import { getAIUsageLogs, getAIUsageStats, getDurationDistribution, type LogSortColumn, type DurationBucket } from '@/lib/supabase/queries';
import type { AIUsageFilters } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatBlock, StatBlockGrid } from '@/components/dashboard/StatBlock';
import {
  SortableHeader,
  type SortOrder,
  parseSortParams,
  buildSortUrlHelper,
} from '@/components/dashboard/SortableHeader';

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  if (amount < 0.01) return `$${amount.toFixed(6)}`;
  if (amount < 1) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
}

/**
 * Operation badge component with Mission Control styling
 */
function OperationBadge({ operation }: { operation: string }) {
  const colors: Record<string, string> = {
    analyze: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    generate: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    discover: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-widest border ${colors[operation] || 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50'}`}>
      {operation}
    </span>
  );
}

/**
 * Status indicator component
 */
function StatusIndicator({ success }: { success: boolean }) {
  return success ? (
    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-mono">
      <CheckCircle className="h-3.5 w-3.5" />
      Success
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-400 text-xs font-mono">
      <XCircle className="h-3.5 w-3.5" />
      Failed
    </span>
  );
}

/**
 * Filter button component with Mission Control styling
 */
function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
        active
          ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
          : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:bg-zinc-700/50 hover:text-zinc-200'
      }`}
    >
      {children}
    </Link>
  );
}

/**
 * Duration histogram component with Mission Control styling
 */
function DurationHistogram({ buckets }: { buckets: DurationBucket[] }) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const totalOps = buckets.reduce((sum, b) => sum + b.count, 0);

  if (totalOps === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-zinc-500 text-sm font-mono">
        No duration data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-24">
        {buckets.map((bucket) => {
          const height = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;

          return (
            <div key={bucket.label} className="flex-1 flex flex-col items-center group">
              {/* Bar */}
              <div className="w-full relative">
                <div
                  className="w-full bg-violet-500/80 rounded-t hover:bg-violet-500 transition-colors cursor-pointer"
                  style={{ height: `${Math.max(height, 2)}%`, minHeight: bucket.count > 0 ? '4px' : '0' }}
                  title={`${bucket.label}: ${bucket.count} ops`}
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* Labels */}
      <div className="flex gap-1">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="flex-1 text-center">
            <p className="text-[9px] text-zinc-600 font-mono truncate">{bucket.label}</p>
            <p className="text-xs font-medium text-zinc-400 font-mono">{bucket.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Date range preset for filtering logs
 */
type DatePreset = 'all' | 'today' | '7days' | '30days';

function getDateRange(preset: DatePreset): { since?: string; until?: string } {
  if (preset === 'all') return {};

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { since: today.toISOString() };
    case '7days': {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return { since: sevenDaysAgo.toISOString() };
    }
    case '30days': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return { since: thirtyDaysAgo.toISOString() };
    }
    default:
      return {};
  }
}

/**
 * Execution Logs page - View all AI operation logs
 * Mission Control dark theme styling.
 */
export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    operation?: string;
    success?: string;
    page?: string;
    sort?: string;
    order?: string;
    dateRange?: string;
  }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const operation = params.operation as AIUsageFilters['operation'] | undefined;
  const success = params.success === 'true' ? true : params.success === 'false' ? false : undefined;
  const dateRange = (params.dateRange || 'all') as DatePreset;

  // Parse sort params
  const { sort, order } = parseSortParams(
    { sort: params.sort, order: params.order },
    'created_at',
    'desc'
  );
  const sortColumn = sort as LogSortColumn;

  // Build filters including date range
  const filters: AIUsageFilters = {};
  if (operation) filters.operation = operation;
  if (success !== undefined) filters.success = success;
  const dateRangeFilter = getDateRange(dateRange);
  if (dateRangeFilter.since) filters.since = dateRangeFilter.since;
  if (dateRangeFilter.until) filters.until = dateRangeFilter.until;

  // Fetch logs, stats, and duration distribution
  const [logsResult, stats, durationBuckets] = await Promise.all([
    getAIUsageLogs(filters, page, 50, sortColumn, order),
    getAIUsageStats(filters),
    getDurationDistribution(filters),
  ]);

  const { data: logs, total } = logsResult;
  const totalPages = Math.ceil(total / 50);

  // Build filter URLs
  const baseUrl = '/logs';
  const buildFilterUrl = (newParams: Record<string, string | undefined>) => {
    const merged = { ...params, ...newParams, page: '1' };
    const queryParts = Object.entries(merged)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`);
    return queryParts.length > 0 ? `${baseUrl}?${queryParts.join('&')}` : baseUrl;
  };

  // Build sort URL helper
  const buildSortUrl = (column: string, sortOrder: SortOrder) =>
    buildSortUrlHelper(baseUrl, params, column, sortOrder);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Execution Logs"
        subtitle="View all AI operation logs with filtering and details"
        icon={ScrollText}
        badge="Debug"
        badgeColor="violet"
        recordCount={total}
        tableName="ai_usage_log"
      />

      {/* Stats Summary & Duration Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Summary - takes 2 columns */}
        <div className="lg:col-span-2">
          <StatBlockGrid columns={4}>
            <StatBlock
              label="Total Operations"
              value={stats.totalOperations.toLocaleString()}
              icon={ScrollText}
              color="violet"
            />
            <StatBlock
              label="Total Tokens"
              value={`${(stats.totalTokens / 1000).toFixed(1)}K`}
              icon={Zap}
              color="cyan"
            />
            <StatBlock
              label="Total Cost"
              value={formatCurrency(stats.totalCost)}
              icon={DollarSign}
              color="amber"
            />
            <StatBlock
              label="Success Rate"
              value={`${stats.successRate.toFixed(1)}%`}
              icon={CheckCircle}
              color="emerald"
            />
          </StatBlockGrid>
        </div>

        {/* Duration Histogram */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Response Time</span>
          </div>
          <DurationHistogram buckets={durationBuckets} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Filters</span>
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Operation Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">Operation</label>
            <div className="flex gap-2">
              <FilterLink href={buildFilterUrl({ operation: undefined })} active={!operation}>
                All
              </FilterLink>
              <FilterLink href={buildFilterUrl({ operation: 'analyze' })} active={operation === 'analyze'}>
                Analyze
              </FilterLink>
              <FilterLink href={buildFilterUrl({ operation: 'generate' })} active={operation === 'generate'}>
                Generate
              </FilterLink>
              <FilterLink href={buildFilterUrl({ operation: 'discover' })} active={operation === 'discover'}>
                Discover
              </FilterLink>
            </div>
          </div>

          {/* Success Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">Status</label>
            <div className="flex gap-2">
              <FilterLink href={buildFilterUrl({ success: undefined })} active={success === undefined}>
                All
              </FilterLink>
              <FilterLink href={buildFilterUrl({ success: 'true' })} active={success === true}>
                Success
              </FilterLink>
              <FilterLink href={buildFilterUrl({ success: 'false' })} active={success === false}>
                Failed
              </FilterLink>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Date Range
            </label>
            <div className="flex gap-2">
              <FilterLink href={buildFilterUrl({ dateRange: undefined })} active={dateRange === 'all'}>
                All Time
              </FilterLink>
              <FilterLink href={buildFilterUrl({ dateRange: 'today' })} active={dateRange === 'today'}>
                Today
              </FilterLink>
              <FilterLink href={buildFilterUrl({ dateRange: '7days' })} active={dateRange === '7days'}>
                7 Days
              </FilterLink>
              <FilterLink href={buildFilterUrl({ dateRange: '30days' })} active={dateRange === '30days'}>
                30 Days
              </FilterLink>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Log Records</span>
          </div>
          <span className="text-xs font-mono text-zinc-600">
            Showing {logs.length} of {total.toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                <SortableHeader
                  column="created_at"
                  label="Time"
                  currentSort={sort}
                  currentOrder={order}
                  buildSortUrl={buildSortUrl}
                />
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-zinc-500">Operation</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-zinc-500">Contractor</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-zinc-500">Status</th>
                <SortableHeader
                  column="total_tokens"
                  label="Tokens"
                  currentSort={sort}
                  currentOrder={order}
                  buildSortUrl={buildSortUrl}
                  align="right"
                />
                <SortableHeader
                  column="cost_estimate"
                  label="Cost"
                  currentSort={sort}
                  currentOrder={order}
                  buildSortUrl={buildSortUrl}
                  align="right"
                />
                <SortableHeader
                  column="duration_ms"
                  label="Duration"
                  currentSort={sort}
                  currentOrder={order}
                  buildSortUrl={buildSortUrl}
                  align="right"
                />
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-zinc-200 text-xs font-mono">{formatRelativeTime(log.created_at)}</p>
                      <p className="text-xs text-zinc-600 font-mono">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <OperationBadge operation={log.operation} />
                      <span className="text-[10px] text-zinc-600 font-mono">{log.model}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {log.contractor ? (
                      <Link
                        href={`/contractors/${log.contractor.id}`}
                        className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
                      >
                        <Building2 className="h-3.5 w-3.5 text-zinc-600" />
                        <span className="text-zinc-300 text-xs">{log.contractor.business_name}</span>
                      </Link>
                    ) : (
                      <span className="text-zinc-600 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusIndicator success={log.success} />
                    {log.error_message && (
                      <p className="mt-1 text-[10px] text-red-400 truncate max-w-[200px] font-mono" title={log.error_message}>
                        {log.error_message}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Zap className="h-3 w-3 text-zinc-600" />
                      <span className="text-zinc-300 font-mono text-xs">{log.total_tokens.toLocaleString()}</span>
                    </div>
                    {log.input_tokens !== null && log.output_tokens !== null && (
                      <p className="text-[10px] text-zinc-600 font-mono">
                        {log.input_tokens.toLocaleString()} in / {log.output_tokens.toLocaleString()} out
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="h-3 w-3 text-zinc-600" />
                      <span className="text-zinc-300 font-mono text-xs">{formatCurrency(log.cost_estimate)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3 text-zinc-600" />
                      <span className="text-zinc-300 font-mono text-xs">{formatDuration(log.duration_ms)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {logs.length === 0 && (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
              <ScrollText className="h-8 w-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-1">No logs found</h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              {operation || success !== undefined
                ? 'Try adjusting your filters or run some operations.'
                : 'Logs will appear here once you run the agent scripts.'}
            </p>
            <p className="mt-4 text-xs font-mono text-zinc-600">
              Table: <code className="px-1.5 py-0.5 bg-zinc-800/50 rounded">ai_usage_log</code>
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-800/50 px-4 py-3 bg-zinc-900/50">
            <p className="text-xs font-mono text-zinc-500">
              Page <span className="text-zinc-300">{page}/{totalPages}</span> &middot; {total.toLocaleString()} total
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
  );
}

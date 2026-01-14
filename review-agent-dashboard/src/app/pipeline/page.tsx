import Link from 'next/link';
import { PipelineDiagram, type PipelineStage } from '@/components/dashboard/PipelineDiagram';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  getPipelineStats,
  getContractors,
  getPipelineTimingStats,
  getSearchHistory,
} from '@/lib/supabase/queries';
import {
  Search,
  Star,
  Lightbulb,
  FileText,
  ExternalLink,
  GitBranch,
  AlertTriangle,
  Clock,
} from 'lucide-react';

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m`;
}

/**
 * Fetches pipeline status data from Supabase.
 */
async function getPipelineData() {
  const [
    stats,
    timingStats,
    searchHistoryResult,
    contractorsSnapshot,
  ] = await Promise.all([
    getPipelineStats(),
    getPipelineTimingStats(),
    getSearchHistory({}, 1, 5), // Get last 5 searches
    // Get a larger snapshot to find contractors needing attention
    getContractors(undefined, 1, 100),
  ]);

  // Build contractors needing attention list
  const contractorsNeedingAttention: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
    issue: string;
    lastUpdated: string;
  }> = [];

  const sortedContractors = contractorsSnapshot.data
    .slice()
    .sort(
      (a, b) =>
        new Date(a.last_synced_at).getTime() -
        new Date(b.last_synced_at).getTime()
    );

  const contractorsNoReviews = sortedContractors
    .filter((c) => c.reviewCount === 0)
    .slice(0, 3);

  const contractorsNoAnalysis = sortedContractors
    .filter((c) => c.reviewCount > 0 && !c.hasAnalysis)
    .slice(0, 3);

  const contractorsNoArticle = sortedContractors
    .filter((c) => c.hasAnalysis && !c.hasArticle)
    .slice(0, 3);

  contractorsNoReviews.forEach((c) => {
    contractorsNeedingAttention.push({
      id: c.id,
      name: c.business_name,
      city: c.city,
      state: c.state || '',
      issue: 'no_reviews',
      lastUpdated: c.last_synced_at,
    });
  });

  contractorsNoAnalysis.forEach((c) => {
    contractorsNeedingAttention.push({
      id: c.id,
      name: c.business_name,
      city: c.city,
      state: c.state || '',
      issue: 'no_analysis',
      lastUpdated: c.last_synced_at,
    });
  });

  contractorsNoArticle.forEach((c) => {
    contractorsNeedingAttention.push({
      id: c.id,
      name: c.business_name,
      city: c.city,
      state: c.state || '',
      issue: 'no_article',
      lastUpdated: c.last_synced_at,
    });
  });

  // Determine pipeline stage statuses
  const stages: PipelineStage[] = [
    {
      id: 'discover',
      name: 'Discover',
      description: 'Find contractors via search',
      count: stats.contractors,
      total: stats.contractors,
      status: stats.contractors > 0 ? 'complete' : 'pending',
      icon: <Search className="h-5 w-5" />,
    },
    {
      id: 'collect',
      name: 'Collect',
      description: 'Gather reviews from sources',
      count: stats.reviews,
      total: stats.reviews,
      status: stats.reviews > 0 ? 'complete' : 'pending',
      icon: <Star className="h-5 w-5" />,
    },
    {
      id: 'analyze',
      name: 'Analyze',
      description: 'Run sentiment analysis',
      count: stats.analyses,
      total: stats.contractors,
      status:
        stats.analyses >= stats.contractors
          ? 'complete'
          : stats.analyses > 0
            ? 'in-progress'
            : 'pending',
      icon: <Lightbulb className="h-5 w-5" />,
    },
    {
      id: 'generate',
      name: 'Generate',
      description: 'Create article content',
      count: stats.articles,
      total: stats.contractors,
      status:
        stats.articles >= stats.contractors
          ? 'complete'
          : stats.articles > 0
            ? 'in-progress'
            : 'pending',
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  // Stage details with REAL timing data from ai_usage_log
  const stageDetails = [
    {
      id: 'discover',
      name: 'Discover',
      total: stats.contractors,
      success: stats.contractors,
      failed: 0,
      avgTime: formatDuration(timingStats.discover.avgDuration),
      lastRun: timingStats.discover.lastRun || null,
      totalRuns: timingStats.discover.totalRuns,
    },
    {
      id: 'collect',
      name: 'Collect',
      total: stats.reviews,
      success: stats.reviews,
      failed: 0,
      avgTime: '-', // Collection doesn't have AI usage logs
      lastRun: null,
      totalRuns: 0,
    },
    {
      id: 'analyze',
      name: 'Analyze',
      total: stats.analyses,
      success: stats.analyses,
      failed: stats.contractors - stats.analyses,
      avgTime: formatDuration(timingStats.analyze.avgDuration),
      lastRun: timingStats.analyze.lastRun || null,
      totalRuns: timingStats.analyze.totalRuns,
    },
    {
      id: 'generate',
      name: 'Generate',
      total: stats.articles,
      success: stats.articles,
      failed: stats.contractors - stats.articles,
      avgTime: formatDuration(timingStats.generate.avgDuration),
      lastRun: timingStats.generate.lastRun || null,
      totalRuns: timingStats.generate.totalRuns,
    },
  ];

  // Transform search history from searched_cities table
  const searchHistory = searchHistoryResult.data.map((search) => ({
    id: search.id,
    city: search.city,
    state: search.state || '',
    searchTerm: search.search_term,
    contractorsFound: search.contractors_found || 0,
    timestamp: search.searched_at,
  }));

  return {
    stages,
    stageDetails,
    contractorsNeedingAttention,
    searchHistory,
    runHistory: [] as Array<{
      id: string;
      type: string;
      status: 'running' | 'completed' | 'failed';
      startedAt: string;
      duration: string | null;
      contractorsProcessed: number;
      errors: number;
    }>,
  };
}

/**
 * Helper to format relative time
 */
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Pipeline Status Page (Server Component)
 * Mission Control dark theme styling.
 */
export default async function PipelinePage() {
  const data = await getPipelineData();

  // Group contractors by issue type
  const groupedContractors = {
    no_reviews: data.contractorsNeedingAttention.filter(
      (c) => c.issue === 'no_reviews'
    ),
    no_analysis: data.contractorsNeedingAttention.filter(
      (c) => c.issue === 'no_analysis'
    ),
    no_article: data.contractorsNeedingAttention.filter(
      (c) => c.issue === 'no_article'
    ),
  };

  const issueLabels = {
    no_reviews: 'No Reviews Collected',
    no_analysis: 'No Analysis Generated',
    no_article: 'No Article Generated',
  };

  const issueColors = {
    no_reviews: 'text-red-400',
    no_analysis: 'text-amber-400',
    no_article: 'text-cyan-400',
  };

  const issueBgColors = {
    no_reviews: 'bg-red-500/10 border-red-500/20',
    no_analysis: 'bg-amber-500/10 border-amber-500/20',
    no_article: 'bg-cyan-500/10 border-cyan-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Pipeline Status"
        subtitle="Monitor the contractor review analysis pipeline in detail"
        icon={GitBranch}
        badge="Live"
        badgeColor="emerald"
      />

      {/* Pipeline Flow Diagram */}
      <PipelineDiagram stages={data.stages} />

      {/* Stage Details */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Stage Details
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.stageDetails.map((stage) => (
            <div
              key={stage.id}
              className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-4"
            >
              <h4 className="font-medium text-zinc-200 mb-3">{stage.name}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 font-mono text-xs">Total</span>
                  <span className="font-medium text-zinc-200 font-mono text-xs">
                    {stage.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 font-mono text-xs">Success</span>
                  <span className="font-medium text-emerald-400 font-mono text-xs">
                    {stage.success.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 font-mono text-xs">Failed</span>
                  <span
                    className={`font-medium font-mono text-xs ${stage.failed > 0 ? 'text-red-400' : 'text-zinc-600'}`}
                  >
                    {stage.failed}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 font-mono text-xs">Avg Time</span>
                  <span className="font-medium text-zinc-300 font-mono text-xs">
                    {stage.avgTime}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-700/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-600 font-mono">Last Run</span>
                    <span className="text-zinc-500 font-mono">
                      {stage.lastRun ? formatRelativeTime(stage.lastRun) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contractors Needing Attention */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Contractors Needing Attention
          </span>
          <span className="text-xs font-mono text-zinc-600">
            ({data.contractorsNeedingAttention.length} total)
          </span>
        </div>

        {data.contractorsNeedingAttention.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
              <Star className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-sm text-zinc-400">
              All contractors are up to date. No action needed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedContractors).map(
              ([issueKey, contractors]) => {
                if (contractors.length === 0) return null;
                const issue = issueKey as keyof typeof issueLabels;
                return (
                  <div key={issue}>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-widest border ${issueBgColors[issue]} ${issueColors[issue]}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {issueLabels[issue]}
                      </span>
                      <span className="text-xs text-zinc-600 font-mono">
                        {contractors.length} contractors
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-800/50">
                            <th className="text-left py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                              Contractor
                            </th>
                            <th className="text-left py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                              Location
                            </th>
                            <th className="text-left py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                              Last Updated
                            </th>
                            <th className="text-right py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {contractors.map((contractor) => (
                            <tr
                              key={contractor.id}
                              className="border-b border-zinc-800/30 last:border-b-0 hover:bg-zinc-800/30"
                            >
                              <td className="py-2.5 px-3 text-zinc-200 text-sm">
                                {contractor.name}
                              </td>
                              <td className="py-2.5 px-3 text-zinc-500 font-mono text-xs">
                                {contractor.city}, {contractor.state}
                              </td>
                              <td className="py-2.5 px-3 text-zinc-500 font-mono text-xs">
                                {formatRelativeTime(contractor.lastUpdated)}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <Link
                                  href={`/contractors/${contractor.id}`}
                                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-mono transition-colors"
                                >
                                  View
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Two column layout for Search History and Run History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search History */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Search History
            </span>
          </div>
          {data.searchHistory.length > 0 ? (
            <div className="space-y-3">
              {data.searchHistory.map((search) => (
                <div
                  key={search.id}
                  className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                      <Search className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {search.city}{search.state ? `, ${search.state}` : ''}
                      </p>
                      <p className="text-xs text-zinc-500 font-mono">
                        &quot;{search.searchTerm}&quot;
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-200 font-mono">
                      {search.contractorsFound} found
                    </p>
                    <p className="text-xs text-zinc-500 font-mono">
                      {formatRelativeTime(search.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <Link
                href="/searches"
                className="block text-center text-xs font-mono text-cyan-400 hover:text-cyan-300 pt-2 transition-colors"
              >
                View all searches →
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-3">
                <Search className="h-5 w-5 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">
                No search history available.
              </p>
              <p className="text-xs text-zinc-600 font-mono mt-1">
                Run the discover script to populate this data.
              </p>
            </div>
          )}
        </div>

        {/* Run History */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Run History
            </span>
          </div>
          {data.runHistory.length > 0 ? (
            <div className="space-y-3">
              {data.runHistory.map((run) => {
                const statusColors = {
                  running: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                  failed: 'text-red-400 bg-red-500/10 border-red-500/20',
                };
                const statusLabels = {
                  running: 'Running',
                  completed: 'Completed',
                  failed: 'Failed',
                };
                return (
                  <div
                    key={run.id}
                    className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono uppercase tracking-widest border ${statusColors[run.status]}`}
                        >
                          {run.status === 'running' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          )}
                          {statusLabels[run.status]}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono capitalize">
                          {run.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-zinc-200 font-mono">
                          {run.contractorsProcessed} processed
                        </p>
                        {run.errors > 0 && (
                          <p className="text-xs text-red-400 font-mono">
                            {run.errors} errors
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-3">
                <Clock className="h-5 w-5 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">
                Run history is tracked in the Logs page.
              </p>
              <Link
                href="/logs"
                className="inline-block mt-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View execution logs →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

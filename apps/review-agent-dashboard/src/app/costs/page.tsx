import {
  DollarSign,
  Zap,
  TrendingUp,
  Activity,
  Cpu,
  CheckCircle,
  XCircle,
  BarChart3,
  ArrowRightLeft,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { getAIUsageStats, getDailyCostTrend, getModelStats, getTopContractorsByCost } from '@/lib/supabase/queries';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatBlock, StatBlockGrid } from '@/components/dashboard/StatBlock';

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  if (amount < 0.01) {
    return `$${amount.toFixed(6)}`;
  }
  if (amount < 1) {
    return `$${amount.toFixed(4)}`;
  }
  return `$${amount.toFixed(2)}`;
}

/**
 * Format large numbers with K/M suffixes
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

/**
 * Operation breakdown card with Mission Control styling
 */
function OperationCard({
  operation,
  count,
  tokens,
  cost,
  color,
}: {
  operation: string;
  count: number;
  tokens: number;
  cost: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-4">
      <div className={`h-3 w-3 rounded-full ${color}`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-200 capitalize">{operation}</p>
        <p className="text-xs text-zinc-500 font-mono">{count.toLocaleString()} operations</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-zinc-100 font-mono">{formatCurrency(cost)}</p>
        <p className="text-xs text-zinc-500 font-mono">{formatNumber(tokens)} tokens</p>
      </div>
    </div>
  );
}

/**
 * Token Input/Output breakdown chart with Mission Control styling
 */
function TokenIOChart({
  totalInputTokens,
  totalOutputTokens,
  byOperation,
}: {
  totalInputTokens: number;
  totalOutputTokens: number;
  byOperation: {
    analyze: { inputTokens: number; outputTokens: number };
    generate: { inputTokens: number; outputTokens: number };
    discover: { inputTokens: number; outputTokens: number };
  };
}) {
  const total = totalInputTokens + totalOutputTokens;
  const inputPct = total > 0 ? (totalInputTokens / total) * 100 : 50;
  const outputPct = total > 0 ? (totalOutputTokens / total) * 100 : 50;

  // Per-operation bars
  const operations = [
    { name: 'Analyze', ...byOperation.analyze, color: 'bg-cyan-500' },
    { name: 'Generate', ...byOperation.generate, color: 'bg-violet-500' },
    { name: 'Discover', ...byOperation.discover, color: 'bg-emerald-500' },
  ];

  if (total === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-zinc-500 text-sm font-mono">
        No token data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Token Distribution */}
      <div>
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono mb-2">
          <span>Input Tokens</span>
          <span>Output Tokens</span>
        </div>
        <div className="h-8 rounded-lg overflow-hidden flex">
          <div
            className="bg-cyan-500 flex items-center justify-center transition-all"
            style={{ width: `${inputPct}%` }}
          >
            <span className="text-xs font-medium text-white px-2 truncate font-mono">
              {formatNumber(totalInputTokens)} ({inputPct.toFixed(1)}%)
            </span>
          </div>
          <div
            className="bg-violet-500 flex items-center justify-center transition-all"
            style={{ width: `${outputPct}%` }}
          >
            <span className="text-xs font-medium text-white px-2 truncate font-mono">
              {formatNumber(totalOutputTokens)} ({outputPct.toFixed(1)}%)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded bg-cyan-500" />
            <span className="text-xs text-zinc-500">Input (prompts)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded bg-violet-500" />
            <span className="text-xs text-zinc-500">Output (responses)</span>
          </div>
        </div>
      </div>

      {/* Per-Operation Breakdown */}
      <div className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">By Operation</p>
        {operations.map((op) => {
          const opTotal = op.inputTokens + op.outputTokens;
          const opInputPct = opTotal > 0 ? (op.inputTokens / opTotal) * 100 : 50;

          if (opTotal === 0) return null;

          return (
            <div key={op.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-200 font-medium">{op.name}</span>
                <span className="text-zinc-500 font-mono">{formatNumber(opTotal)} total</span>
              </div>
              <div className="h-4 rounded overflow-hidden flex bg-zinc-800">
                <div
                  className="bg-cyan-500/80"
                  style={{ width: `${opInputPct}%` }}
                  title={`Input: ${formatNumber(op.inputTokens)}`}
                />
                <div
                  className="bg-violet-500/80"
                  style={{ width: `${100 - opInputPct}%` }}
                  title={`Output: ${formatNumber(op.outputTokens)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Simple bar chart for daily trends with Mission Control styling
 */
function DailyTrendChart({
  data,
}: {
  data: Array<{ date: string; cost: number; tokens: number; operations: number }>;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-zinc-500 font-mono">
        No data available yet
      </div>
    );
  }

  const maxCost = Math.max(...data.map((d) => d.cost));

  return (
    <div className="flex h-48 items-end gap-1">
      {data.map((day) => {
        const height = maxCost > 0 ? (day.cost / maxCost) * 100 : 0;
        const dateLabel = new Date(day.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        return (
          <div
            key={day.date}
            className="group relative flex-1 flex flex-col items-center"
          >
            <div
              className="w-full rounded-t bg-amber-500/80 hover:bg-amber-500 transition-colors cursor-pointer"
              style={{ height: `${Math.max(height, 2)}%` }}
              title={`${dateLabel}: ${formatCurrency(day.cost)} (${day.operations} ops)`}
            />
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
              <div className="rounded-lg bg-zinc-800 border border-zinc-700/50 p-2 shadow-lg text-xs whitespace-nowrap">
                <p className="font-medium text-zinc-200">{dateLabel}</p>
                <p className="text-zinc-400 font-mono">{formatCurrency(day.cost)}</p>
                <p className="text-zinc-500 font-mono">{day.operations} ops</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Model performance table with Mission Control styling
 */
function ModelPerformanceTable({
  models,
}: {
  models: Array<{
    model: string;
    totalOperations: number;
    totalTokens: number;
    totalCost: number;
    avgDuration: number;
    successRate: number;
  }>;
}) {
  if (models.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-zinc-500 font-mono">
        No model data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800/50">
            <th className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-wider text-zinc-500">Model</th>
            <th className="px-3 py-2 text-right text-[10px] font-mono uppercase tracking-wider text-zinc-500">Ops</th>
            <th className="px-3 py-2 text-right text-[10px] font-mono uppercase tracking-wider text-zinc-500">Tokens</th>
            <th className="px-3 py-2 text-right text-[10px] font-mono uppercase tracking-wider text-zinc-500">Cost</th>
            <th className="px-3 py-2 text-right text-[10px] font-mono uppercase tracking-wider text-zinc-500">Avg</th>
            <th className="px-3 py-2 text-right text-[10px] font-mono uppercase tracking-wider text-zinc-500">Rate</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model.model} className="border-b border-zinc-800/30 hover:bg-zinc-800/30">
              <td className="px-3 py-2 font-mono text-xs text-zinc-300 truncate max-w-[150px]">{model.model}</td>
              <td className="px-3 py-2 text-right text-zinc-300 font-mono text-xs">{model.totalOperations.toLocaleString()}</td>
              <td className="px-3 py-2 text-right text-zinc-300 font-mono text-xs">{formatNumber(model.totalTokens)}</td>
              <td className="px-3 py-2 text-right text-zinc-300 font-mono text-xs">{formatCurrency(model.totalCost)}</td>
              <td className="px-3 py-2 text-right text-zinc-400 font-mono text-xs">
                {model.avgDuration > 0 ? `${(model.avgDuration / 1000).toFixed(1)}s` : '-'}
              </td>
              <td className="px-3 py-2 text-right">
                <span className={`inline-flex items-center gap-1 text-xs font-mono ${model.successRate >= 95 ? 'text-emerald-400' : model.successRate >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                  {model.successRate >= 95 ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {model.successRate.toFixed(0)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Top contractors by cost with Mission Control styling
 */
function TopContractorsTable({
  contractors,
}: {
  contractors: Array<{
    contractor_id: string;
    business_name: string;
    city: string | null;
    state: string | null;
    totalCost: number;
    totalTokens: number;
    totalOperations: number;
  }>;
}) {
  if (contractors.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-zinc-500 font-mono">
        No contractor cost data available
      </div>
    );
  }

  // Calculate max cost for bar visualization
  const maxCost = Math.max(...contractors.map((c) => c.totalCost));

  return (
    <div className="space-y-2">
      {contractors.map((contractor, idx) => {
        const pct = maxCost > 0 ? (contractor.totalCost / maxCost) * 100 : 0;

        return (
          <div key={contractor.contractor_id} className="relative">
            {/* Background bar */}
            <div
              className="absolute inset-y-0 left-0 bg-amber-500/10 rounded"
              style={{ width: `${pct}%` }}
            />

            {/* Content */}
            <div className="relative flex items-center gap-3 px-3 py-2">
              <span className="text-xs font-mono text-zinc-600 w-5">
                {idx + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/contractors/${contractor.contractor_id}`}
                  className="text-sm font-medium text-zinc-200 hover:text-cyan-400 transition-colors truncate block"
                >
                  {contractor.business_name}
                </Link>
                <p className="text-xs text-zinc-500 font-mono">
                  {contractor.city && contractor.state
                    ? `${contractor.city}, ${contractor.state}`
                    : contractor.city || contractor.state || 'Unknown'}
                  {' · '}
                  {contractor.totalOperations} ops
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-zinc-100 font-mono">{formatCurrency(contractor.totalCost)}</p>
                <p className="text-xs text-zinc-500 font-mono">{formatNumber(contractor.totalTokens)} tokens</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Cost projections card with Mission Control styling
 */
function CostProjections({ avgCostPerOp }: { avgCostPerOp: number }) {
  const projections = [
    { contractors: 100, ops: 200 },
    { contractors: 500, ops: 1000 },
    { contractors: 1000, ops: 2000 },
  ];

  return (
    <div className="space-y-3">
      {projections.map(({ contractors, ops }) => (
        <div key={contractors} className="flex items-center justify-between rounded-lg bg-zinc-800/50 border border-zinc-700/50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-zinc-200">{contractors.toLocaleString()} contractors</p>
            <p className="text-xs text-zinc-500 font-mono">{ops.toLocaleString()} operations</p>
          </div>
          <p className="text-lg font-bold text-amber-400 font-mono">{formatCurrency(avgCostPerOp * ops)}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Cost Dashboard page - Full observability for AI spending
 * Mission Control dark theme styling.
 */
export default async function CostsPage() {
  // Fetch all cost data in parallel
  const [stats, dailyTrend, modelStats, topContractors] = await Promise.all([
    getAIUsageStats(),
    getDailyCostTrend(30),
    getModelStats(),
    getTopContractorsByCost(10),
  ]);

  // Calculate 7-day stats for comparison
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7DaysTrend = dailyTrend.filter((d) => new Date(d.date) >= sevenDaysAgo);
  const last7DaysCost = last7DaysTrend.reduce((sum, d) => sum + d.cost, 0);
  const last7DaysTokens = last7DaysTrend.reduce((sum, d) => sum + d.tokens, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Cost Dashboard"
        subtitle="Monitor AI API spending and token usage across all operations"
        icon={DollarSign}
        badge="Billing"
        badgeColor="amber"
        tableName="ai_usage_log"
      />

      {/* Key Stats Grid */}
      <StatBlockGrid columns={4}>
        <StatBlock
          label="Total Spend"
          value={formatCurrency(stats.totalCost)}
          icon={DollarSign}
          color="amber"
          subtitle="All time"
        />
        <StatBlock
          label="Last 7 Days"
          value={formatCurrency(last7DaysCost)}
          icon={TrendingUp}
          color="cyan"
          subtitle={`${formatNumber(last7DaysTokens)} tokens`}
        />
        <StatBlock
          label="Total Tokens"
          value={formatNumber(stats.totalTokens)}
          icon={Zap}
          color="violet"
          subtitle={`${stats.totalOperations.toLocaleString()} operations`}
        />
        <StatBlock
          label="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={Activity}
          color="emerald"
          subtitle={`Avg ${formatCurrency(stats.avgCostPerOperation)}/op`}
        />
      </StatBlockGrid>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Operation Breakdown */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">By Operation</span>
          </div>
          <div className="space-y-3">
            <OperationCard
              operation="analyze"
              count={stats.byOperation.analyze.count}
              tokens={stats.byOperation.analyze.tokens}
              cost={stats.byOperation.analyze.cost}
              color="bg-cyan-500"
            />
            <OperationCard
              operation="generate"
              count={stats.byOperation.generate.count}
              tokens={stats.byOperation.generate.tokens}
              cost={stats.byOperation.generate.cost}
              color="bg-violet-500"
            />
            <OperationCard
              operation="discover"
              count={stats.byOperation.discover.count}
              tokens={stats.byOperation.discover.tokens}
              cost={stats.byOperation.discover.cost}
              color="bg-emerald-500"
            />
          </div>
        </div>

        {/* Daily Trend Chart */}
        <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Daily Spending (Last 30 Days)</span>
          </div>
          <DailyTrendChart data={dailyTrend} />
          {dailyTrend.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-600 font-mono">
              <span>{new Date(dailyTrend[0].date).toLocaleDateString()}</span>
              <span>{new Date(dailyTrend[dailyTrend.length - 1].date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Token I/O Breakdown */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <ArrowRightLeft className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Token Distribution (Input vs Output)</span>
        </div>
        <TokenIOChart
          totalInputTokens={stats.totalInputTokens}
          totalOutputTokens={stats.totalOutputTokens}
          byOperation={stats.byOperation}
        />
      </div>

      {/* Model Performance, Top Contractors & Projections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Model Performance Table */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Model Performance</span>
          </div>
          <ModelPerformanceTable models={modelStats} />
        </div>

        {/* Top Contractors by Cost */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Top 10 by Cost</span>
          </div>
          <TopContractorsTable contractors={topContractors} />
        </div>

        {/* Cost Projections */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Cost Projections</span>
          </div>
          <p className="mb-4 text-sm text-zinc-500">
            Estimated costs based on current average of {formatCurrency(stats.avgCostPerOperation)} per operation
          </p>
          <CostProjections avgCostPerOp={stats.avgCostPerOperation} />
        </div>
      </div>

      {/* Empty State */}
      {stats.totalOperations === 0 && (
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-12 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
            <DollarSign className="h-8 w-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-1">No cost data yet</h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Cost tracking will appear here once you run the agent&apos;s analyze or generate scripts.
          </p>
          <p className="mt-4 text-xs font-mono text-zinc-600">
            Table: <code className="px-1.5 py-0.5 bg-zinc-800/50 rounded">ai_usage_log</code>
          </p>
        </div>
      )}
    </div>
  );
}

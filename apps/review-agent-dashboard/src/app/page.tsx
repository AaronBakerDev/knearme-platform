import Link from 'next/link'
import { PipelineProgress } from '@/components/dashboard/PipelineProgress'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { StatBlock, StatBlockGrid } from '@/components/dashboard/StatBlock'
import { getPipelineStats, getRecentActivity } from '@/lib/supabase/queries'
import {
  Users,
  Star,
  Lightbulb,
  FileText,
  RefreshCw,
  Plus,
  Download,
  Settings,
  ChevronRight,
  Activity,
  Database,
} from 'lucide-react'

/**
 * Helper to format relative time from ISO date string
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

/**
 * Fetches and transforms data for the dashboard page
 */
async function getDashboardData() {
  const [stats, activity] = await Promise.all([
    getPipelineStats(),
    getRecentActivity(5),
  ])

  const recentActivityItems: Array<{
    id: string
    type: 'contractor' | 'review' | 'analysis' | 'article'
    action: string
    target: string
    timestamp: string
  }> = []

  activity.recentContractors.forEach((contractor) => {
    recentActivityItems.push({
      id: `contractor-${contractor.id}`,
      type: 'contractor',
      action: 'Business Found',
      target: `${contractor.business_name}`,
      timestamp: contractor.discovered_at,
    })
  })

  activity.recentAnalyses.forEach((analysis) => {
    recentActivityItems.push({
      id: `analysis-${analysis.id}`,
      type: 'analysis',
      action: 'Analysis Done',
      target: analysis.contractor?.business_name || 'Business Record',
      timestamp: analysis.analyzed_at,
    })
  })

  activity.recentArticles.forEach((article) => {
    recentActivityItems.push({
      id: `article-${article.id}`,
      type: 'article',
      action: 'Article Ready',
      target: article.contractor?.business_name || 'Business Record',
      timestamp: article.generated_at,
    })
  })

  const sortedActivity = recentActivityItems
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
    .map((activity) => ({
      ...activity,
      timestamp: formatRelativeTime(activity.timestamp),
    }))

  const pipelineStages = [
    {
      name: 'Discover',
      count: stats.contractors,
      total: stats.contractors,
      status: stats.contractors > 0 ? ('complete' as const) : ('pending' as const),
    },
    {
      name: 'Collect',
      count: stats.reviews,
      total: stats.reviews,
      status: stats.reviews > 0 ? ('complete' as const) : ('pending' as const),
    },
    {
      name: 'Analyze',
      count: stats.analyses,
      total: stats.contractors,
      status: stats.analyses >= stats.contractors ? ('complete' as const) : stats.analyses > 0 ? ('in-progress' as const) : ('pending' as const),
    },
    {
      name: 'Generate',
      count: stats.articles,
      total: stats.contractors,
      status: stats.articles >= stats.contractors ? ('complete' as const) : stats.articles > 0 ? ('in-progress' as const) : ('pending' as const),
    },
  ]

  return {
    contractors: { total: stats.contractors, trend: 'up' as const },
    reviews: { total: stats.reviews, trend: 'up' as const },
    analyses: {
      completed: stats.analyses,
      total: stats.contractors,
      percentage: Math.round(stats.analysisRate),
      trend: stats.analysisRate > 50 ? 'up' as const : 'neutral' as const,
    },
    articles: {
      generated: stats.articles,
      total: stats.contractors,
      percentage: Math.round(stats.articleRate),
      trend: stats.articleRate > 50 ? 'up' as const : 'neutral' as const,
    },
    pipeline: pipelineStages,
    recentActivity: sortedActivity,
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardData()

  // Calculate overall pipeline health
  const totalProcessed = stats.pipeline.reduce((sum, s) => sum + s.count, 0)
  const totalCapacity = stats.pipeline.reduce((sum, s) => sum + s.total, 0)
  const overallHealth = totalCapacity > 0 ? Math.round((totalProcessed / totalCapacity) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Page Header - Mission Control Style */}
      <PageHeader
        title="Pipeline Intelligence"
        subtitle="Real-time monitoring of AI review discovery, analysis, and content generation"
        icon={Activity}
        badge="Live"
        badgeColor="emerald"
        actions={
          <Link
            href="/exports"
            className="px-3 py-1.5 text-xs font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors uppercase tracking-wider"
          >
            Export JSON
          </Link>
        }
      />

      {/* Stats Grid */}
      <StatBlockGrid columns={4}>
        <StatBlock
          label="Businesses"
          value={stats.contractors.total}
          icon={Users}
          color="cyan"
          subtitle="Discovered contractors"
        />
        <StatBlock
          label="Reviews"
          value={stats.reviews.total}
          icon={Star}
          color="amber"
          subtitle="Collected records"
        />
        <StatBlock
          label="Analyses"
          value={`${stats.analyses.percentage}%`}
          icon={Lightbulb}
          color="violet"
          subtitle={`${stats.analyses.completed} processed`}
        />
        <StatBlock
          label="Articles"
          value={`${stats.articles.percentage}%`}
          icon={FileText}
          color="emerald"
          subtitle={`${stats.articles.generated} generated`}
        />
      </StatBlockGrid>

      {/* Pipeline Status */}
      <PipelineProgress stages={stats.pipeline} />

      {/* Activity and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RecentActivity activities={stats.recentActivity} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                Action Center
              </span>
            </div>
            <div className="space-y-3">
              <Link
                href="/pipeline"
                className="group flex items-center justify-between rounded-lg bg-zinc-800/30 px-4 py-3 border border-zinc-700/30 hover:border-emerald-500/30 hover:bg-zinc-800/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-700/50 text-zinc-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-all">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Synchronize Pipeline</p>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Triggers new AI crawling cycle</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-400 transition-all group-hover:translate-x-1" />
              </Link>

              <Link
                href="/contractors"
                className="group flex items-center justify-between rounded-lg bg-zinc-800/30 px-4 py-3 border border-zinc-700/30 hover:border-cyan-500/30 hover:bg-zinc-800/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-700/50 text-zinc-400 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-all">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Import Contractor</p>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Manual GMB/Yelp profile entry</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-cyan-400 transition-all group-hover:translate-x-1" />
              </Link>

              <div className="pt-3 mt-3 border-t border-zinc-800/50 grid grid-cols-2 gap-3">
                <Link
                  href="/exports"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800/30 text-xs font-mono text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-all border border-zinc-700/30"
                >
                  <Download className="h-3.5 w-3.5" />
                  Archive
                </Link>
                <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800/30 text-xs font-mono text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-all border border-zinc-700/30">
                  <Settings className="h-3.5 w-3.5" />
                  Configure
                </button>
              </div>
            </div>
          </div>

          {/* Health Summary */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Activity className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold font-mono text-zinc-100">{overallHealth}%</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">
                    Healthy
                  </span>
                </div>
                <p className="text-xs text-zinc-500">Pipeline Health</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                <Database className="h-3.5 w-3.5" />
                <span>All crawler nodes operating normally</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

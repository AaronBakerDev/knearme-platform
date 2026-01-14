import { User, Star, Lightbulb, FileText, ChevronRight, Activity } from 'lucide-react'
import Link from 'next/link'

interface ActivityItem {
  id: string
  type: 'contractor' | 'review' | 'analysis' | 'article'
  action: string
  target: string
  timestamp: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

/**
 * Activity type configuration with Mission Control colors.
 * Uses cyan, amber, violet, emerald to match the design system.
 */
const activityConfig = {
  contractor: {
    Icon: User,
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/20',
  },
  review: {
    Icon: Star,
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
  },
  analysis: {
    Icon: Lightbulb,
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/20',
  },
  article: {
    Icon: FileText,
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
  },
}

/**
 * Recent activity list component showing pipeline events.
 * Mission Control dark theme with timeline visualization.
 */
export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Recent Activity
          </span>
        </div>
        <Link
          href="/logs"
          className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
        >
          View All
        </Link>
      </div>

      <div className="p-4">
        <div className="space-y-3 relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-zinc-800/50 hidden sm:block" />

          {activities.map((activity) => {
            const config = activityConfig[activity.type]
            const Icon = config.Icon
            return (
              <div key={activity.id} className="group flex items-start gap-3 relative">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${config.borderColor} ${config.bgColor} ${config.textColor} z-10 transition-transform group-hover:scale-105`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30 group-hover:border-zinc-700/50 group-hover:bg-zinc-800/50 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-200 truncate">
                      {activity.action}
                    </p>
                    <span className="text-[10px] whitespace-nowrap text-zinc-500 font-mono bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-700/30 tabular-nums">
                      {activity.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1 truncate font-mono">
                    {activity.target}
                  </p>
                </div>
                <div className="self-center hidden sm:block">
                  <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-emerald-400 transition-all group-hover:translate-x-1" />
                </div>
              </div>
            )
          })}
        </div>

        {activities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-14 w-14 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-4">
              <Activity className="h-7 w-7 text-zinc-600" />
            </div>
            <h3 className="text-sm font-medium text-zinc-300 mb-1">
              No activity yet
            </h3>
            <p className="text-xs text-zinc-500 font-mono">
              Pipeline activity will appear here once you run the discover script.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

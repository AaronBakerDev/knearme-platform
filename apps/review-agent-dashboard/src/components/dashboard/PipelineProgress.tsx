import { GitBranch } from 'lucide-react'

interface PipelineStage {
  name: string
  count: number
  total: number
  status: 'complete' | 'in-progress' | 'pending'
}

interface PipelineProgressProps {
  stages: PipelineStage[]
}

/**
 * Visual pipeline progress component showing 4 stages:
 * Discover -> Collect -> Analyze -> Generate
 *
 * Mission Control color coding:
 * - Emerald for complete (100%)
 * - Amber for in-progress (partially complete)
 * - Zinc for pending (0%)
 */
export function PipelineProgress({ stages }: PipelineProgressProps) {
  const getStatusStyles = (status: PipelineStage['status']) => {
    switch (status) {
      case 'complete':
        return {
          border: 'border-emerald-500/50',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          bar: 'bg-emerald-500',
        }
      case 'in-progress':
        return {
          border: 'border-amber-500/50',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          bar: 'bg-amber-500',
        }
      case 'pending':
        return {
          border: 'border-zinc-700/50',
          bg: 'bg-zinc-800/50',
          text: 'text-zinc-500',
          bar: 'bg-zinc-700',
        }
    }
  }

  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
  }

  const overallProgress = getPercentage(
    stages.reduce((sum, s) => sum + s.count, 0),
    stages.reduce((sum, s) => sum + s.total, 0)
  )

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Pipeline Health
          </span>
        </div>
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-mono text-zinc-400">{overallProgress}% complete</span>
        </div>
      </div>

      <div className="p-6">
        {/* Stages */}
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const percentage = getPercentage(stage.count, stage.total)
            const styles = getStatusStyles(stage.status)

            return (
              <div key={stage.name} className="flex items-center flex-1">
                {/* Stage Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${styles.border} ${styles.bg}`}
                  >
                    <span className={`text-lg font-bold font-mono tabular-nums ${styles.text}`}>
                      {percentage}%
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-zinc-200">{stage.name}</p>
                  <p className="text-xs font-mono text-zinc-600 tabular-nums">
                    {stage.count.toLocaleString()} / {stage.total.toLocaleString()}
                  </p>
                </div>

                {/* Connector Line */}
                {index < stages.length - 1 && (
                  <div className="flex-1 px-4">
                    <div className="relative h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full ${styles.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-8 pt-6 border-t border-zinc-800/50">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Overall Progress
            </span>
            <span className="text-xs font-mono text-zinc-300 tabular-nums">
              {overallProgress}%
            </span>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

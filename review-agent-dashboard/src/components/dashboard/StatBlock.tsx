import type { LucideIcon } from 'lucide-react'

/**
 * StatBlock - Mission Control style stat display
 *
 * A colored icon box with bold value and label, used across dashboard pages
 * for displaying key metrics with visual hierarchy.
 *
 * @example
 * <StatBlock
 *   label="Total Searches"
 *   value={1234}
 *   icon={Search}
 *   color="emerald"
 * />
 */

export type StatBlockColor = 'emerald' | 'amber' | 'cyan' | 'violet' | 'red' | 'blue'

interface StatBlockProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: StatBlockColor
  /** Optional subtitle text below the value */
  subtitle?: string
}

const colorClasses: Record<StatBlockColor, string> = {
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  red: 'text-red-400 bg-red-500/10 border-red-500/20',
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
}

export function StatBlock({
  label,
  value,
  icon: Icon,
  color = 'emerald',
  subtitle,
}: StatBlockProps) {
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
        {subtitle && (
          <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

/**
 * StatBlockGrid - Wrapper for consistent grid layout of StatBlocks
 */
interface StatBlockGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
}

export function StatBlockGrid({ children, columns = 4 }: StatBlockGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }

  return <div className={`grid ${gridCols[columns]} gap-3`}>{children}</div>
}

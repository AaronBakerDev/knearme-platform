import type { LucideIcon } from 'lucide-react'
import { Database } from 'lucide-react'

/**
 * PageHeader - Mission Control style page header
 *
 * Consistent header pattern with icon, title, optional status badge,
 * subtitle, and database table reference.
 *
 * @example
 * <PageHeader
 *   title="Search History"
 *   subtitle="Google Maps discovery operations"
 *   icon={Activity}
 *   badge="Live"
 *   badgeColor="emerald"
 *   recordCount={1234}
 *   tableName="searched_cities"
 * />
 */

type BadgeColor = 'emerald' | 'amber' | 'cyan' | 'violet' | 'red' | 'blue'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  /** Optional status badge text (e.g., "Live", "Beta") */
  badge?: string
  badgeColor?: BadgeColor
  /** Total record count to display */
  recordCount?: number
  /** Database table name for reference badge */
  tableName?: string
  /** Right-side content slot */
  actions?: React.ReactNode
}

const badgeColors: Record<BadgeColor, string> = {
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  red: 'text-red-400 bg-red-500/10 border-red-500/20',
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'emerald',
  recordCount,
  tableName,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-emerald-400" />}
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
              {title}
            </h1>
          </div>
          {badge && (
            <span
              className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border rounded ${badgeColors[badgeColor]}`}
            >
              {badge}
            </span>
          )}
        </div>
        {(subtitle || recordCount !== undefined) && (
          <p className="text-sm text-zinc-500 font-mono">
            {subtitle}
            {subtitle && recordCount !== undefined && ' \u00B7 '}
            {recordCount !== undefined && `${recordCount.toLocaleString()} records`}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        {tableName && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
            <Database className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-mono text-zinc-500">{tableName}</span>
          </div>
        )}
      </div>
    </div>
  )
}

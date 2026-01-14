import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: ReactNode
  delayClass?: string
}

/**
 * Reusable stat card component for displaying metrics.
 * Supports optional trend indicators and icons.
 * Enhanced with premium styling and animations.
 */
export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  delayClass = 'stagger-1'
}: StatCardProps) {
  const trendConfig = {
    up: {
      color: 'text-[var(--success)]',
      Icon: TrendingUp,
      bg: 'bg-[var(--success)]/10',
    },
    down: {
      color: 'text-[var(--destructive)]',
      Icon: TrendingDown,
      bg: 'bg-[var(--destructive)]/10',
    },
    neutral: {
      color: 'text-muted-foreground',
      Icon: Minus,
      bg: 'bg-muted/10',
    },
  }

  const trendData = trend ? trendConfig[trend] : null
  const TrendIcon = trendData?.Icon

  return (
    <div className={`group rounded-xl bg-card border border-border p-6 card-interactive shadow-depth animate-fade-up ${delayClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground text-gradient leading-tight">{value}</p>
          {subtitle && (
            <div className="mt-2 flex items-center gap-1.5">
              {TrendIcon && trendData && (
                <span className={`inline-flex items-center justify-center p-1 rounded-full ${trendData.bg}`}>
                  <TrendIcon className={`h-3 w-3 ${trendData.color}`} />
                </span>
              )}
              <p className="text-sm text-muted-foreground">
                <span className={trendData?.color}>{subtitle.split(' ')[0]}</span>{' '}
                {subtitle.split(' ').slice(1).join(' ')}
              </p>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary shadow-inner text-[var(--primary)] glow-sm transition-transform group-hover:scale-110">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

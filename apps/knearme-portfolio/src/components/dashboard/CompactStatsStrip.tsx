import { CheckCircle2, Clock, FolderOpen, type LucideIcon } from 'lucide-react';

type StatColor = 'green' | 'orange' | 'blue';

interface Stat {
  label: string;
  value: number;
  color: StatColor;
  description?: string;
}

interface CompactStatsStripProps {
  stats: Stat[];
}

/**
 * Horizontal strip showing key portfolio metrics.
 * Replaces the 3 separate stat cards with a more compact layout.
 * Optimized for mobile to reduce vertical space.
 *
 * @see dashboard/page.tsx - Main dashboard that uses this component
 */
export function CompactStatsStrip({ stats }: CompactStatsStripProps) {
  const colorConfig: Record<StatColor, { bg: string; icon: LucideIcon; iconColor: string; border: string }> = {
    green: {
      bg: 'bg-emerald-500/10',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    orange: {
      bg: 'bg-amber-500/10',
      icon: Clock,
      iconColor: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
    },
    blue: {
      bg: 'bg-blue-500/10',
      icon: FolderOpen,
      iconColor: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
  };

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      {stats.map((stat) => {
        const config = colorConfig[stat.color];
        const Icon = config.icon;

        return (
          <div
            key={stat.label}
            className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-lg border ${config.border} ${config.bg} backdrop-blur-sm transition-all hover:scale-[1.02]`}
          >
            <div className={`p-1.5 rounded-full bg-white/50 dark:bg-black/20 ${config.iconColor} mb-1`}>
              <Icon className="w-4 h-4" />
            </div>

            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold tracking-tight leading-none">
                {stat.value}
              </p>
              <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

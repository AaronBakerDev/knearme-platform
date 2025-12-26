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
  const colorConfig: Record<StatColor, { dot: string; icon: LucideIcon; iconColor: string }> = {
    green: {
      dot: 'bg-green-500',
      icon: CheckCircle2,
      iconColor: 'text-green-500',
    },
    orange: {
      dot: 'bg-orange-500',
      icon: Clock,
      iconColor: 'text-orange-500',
    },
    blue: {
      dot: 'bg-blue-500',
      icon: FolderOpen,
      iconColor: 'text-blue-500',
    },
  };

  return (
    <div className="flex gap-3 md:gap-6 py-3 px-3 md:px-4 bg-muted/30 rounded-xl overflow-x-auto">
      {stats.map((stat, index) => {
        const config = colorConfig[stat.color];
        const Icon = config.icon;

        return (
          <div
            key={stat.label}
            className="flex items-center gap-2 md:gap-3 flex-1 min-w-0"
          >
            {/* Color indicator - dot on mobile, icon on desktop */}
            <span
              className={`w-2 h-2 md:w-8 md:h-8 rounded-full ${config.dot} md:bg-opacity-20 flex-shrink-0 flex items-center justify-center`}
            >
              <Icon className={`hidden md:block w-4 h-4 ${config.iconColor}`} />
            </span>

            {/* Stat content */}
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold tabular-nums">
                {stat.value}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                {stat.label}
              </p>
            </div>

            {/* Separator between stats (not after last) */}
            {index < stats.length - 1 && (
              <div className="w-px h-8 bg-border ml-auto hidden md:block" />
            )}
          </div>
        );
      })}
    </div>
  );
}

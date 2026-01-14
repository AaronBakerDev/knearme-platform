'use client';

/**
 * Voice Usage Display - Shows remaining voice quota in the UI.
 *
 * Displays:
 * - Current usage vs daily quota
 * - Progress bar with color-coded status
 * - Warning when running low on quota
 * - Upgrade prompt for free tier users
 *
 * @see /src/lib/voice/usage-limits.ts for quota logic
 * @see /src/lib/billing/plan-limits.ts for tier definitions
 */

import { Clock, AlertTriangle, Zap, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getQuotaStatus, formatQuotaDisplay } from '@/lib/voice/usage-limits';
import type { PlanTier } from '@/lib/billing/plan-limits';

interface VoiceUsageDisplayProps {
  /** Minutes remaining for today */
  remainingMinutes: number;
  /** Daily quota in minutes (null = unlimited) */
  dailyQuotaMinutes: number | null;
  /** Minutes used today */
  usedMinutes: number;
  /** User's current plan tier */
  planTier: PlanTier;
  /** Warning message from the server (e.g., "less than 5 minutes remaining") */
  lowQuotaWarning?: string;
  /** Compact display mode for inline use */
  compact?: boolean;
  /** Callback when user clicks upgrade */
  onUpgradeClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Voice usage display component.
 * Shows remaining quota with visual indicators and warnings.
 */
export function VoiceUsageDisplay({
  remainingMinutes,
  dailyQuotaMinutes,
  usedMinutes,
  planTier,
  lowQuotaWarning,
  compact = false,
  onUpgradeClick,
  className,
}: VoiceUsageDisplayProps) {
  const status = getQuotaStatus(remainingMinutes, dailyQuotaMinutes);
  const displayText = formatQuotaDisplay(remainingMinutes, dailyQuotaMinutes);

  // For unlimited plans, just show a simple indicator
  if (dailyQuotaMinutes === null || remainingMinutes === Infinity) {
    if (compact) {
      return (
        <div className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
          <Clock className="h-3 w-3" />
          <span>Unlimited voice</span>
        </div>
      );
    }
    return null; // Don't show anything for unlimited in non-compact mode
  }

  // Calculate progress percentage
  const progressPercent = Math.min(100, (usedMinutes / dailyQuotaMinutes) * 100);

  // Get status-specific styles
  const getStatusStyles = () => {
    switch (status) {
      case 'exceeded':
        return {
          progressBg: 'bg-destructive',
          textColor: 'text-destructive',
          icon: AlertTriangle,
          iconColor: 'text-destructive',
        };
      case 'critical':
        return {
          progressBg: 'bg-orange-500',
          textColor: 'text-orange-600 dark:text-orange-400',
          icon: AlertTriangle,
          iconColor: 'text-orange-500',
        };
      case 'warning':
        return {
          progressBg: 'bg-amber-500',
          textColor: 'text-amber-600 dark:text-amber-400',
          icon: Clock,
          iconColor: 'text-amber-500',
        };
      default:
        return {
          progressBg: 'bg-primary',
          textColor: 'text-muted-foreground',
          icon: Clock,
          iconColor: 'text-muted-foreground',
        };
    }
  };

  const styles = getStatusStyles();
  const Icon = styles.icon;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2',
          status !== 'ok' && 'animate-pulse',
          className
        )}
        title={lowQuotaWarning || `${Math.round(remainingMinutes)} minutes remaining today`}
      >
        <Icon className={cn('h-3.5 w-3.5', styles.iconColor)} />
        <span className={cn('text-xs font-medium', styles.textColor)}>
          {Math.round(remainingMinutes)}m left
        </span>
        {/* Mini progress bar */}
        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all', styles.progressBg)}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  }

  // Full display mode
  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        status === 'exceeded' && 'border-destructive/30 bg-destructive/5',
        status === 'critical' && 'border-orange-300/30 bg-orange-50/50 dark:bg-orange-950/20',
        status === 'warning' && 'border-amber-300/30 bg-amber-50/50 dark:bg-amber-950/20',
        status === 'ok' && 'border-border bg-muted/30',
        className
      )}
    >
      {/* Header with icon and remaining time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', styles.iconColor)} />
          <span className={cn('text-sm font-medium', styles.textColor)}>
            {status === 'exceeded' ? 'Quota Exceeded' : `${Math.round(remainingMinutes)}m remaining`}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{displayText}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', styles.progressBg)}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Warning message */}
      {lowQuotaWarning && status !== 'ok' && (
        <p className={cn('text-xs mt-2', styles.textColor)}>{lowQuotaWarning}</p>
      )}

      {/* Upgrade prompt for free tier */}
      {planTier === 'free' && (status === 'warning' || status === 'critical' || status === 'exceeded') && onUpgradeClick && (
        <button
          type="button"
          onClick={onUpgradeClick}
          className="flex items-center gap-1.5 mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Zap className="h-3 w-3" />
          Upgrade for 120 min/day
          <ArrowUpRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/**
 * Compact inline badge showing quota status.
 * Use this in tight spaces like the voice control bar.
 */
export function VoiceQuotaBadge({
  remainingMinutes,
  dailyQuotaMinutes,
  className,
}: Pick<VoiceUsageDisplayProps, 'remainingMinutes' | 'dailyQuotaMinutes' | 'className'>) {
  // Don't show for unlimited plans
  if (dailyQuotaMinutes === null || remainingMinutes === Infinity) {
    return null;
  }

  const status = getQuotaStatus(remainingMinutes, dailyQuotaMinutes);

  // Only show badge when quota is getting low - not when status is 'ok'
  if (status === 'ok') {
    return null;
  }

  const getBadgeStyles = (): string => {
    switch (status) {
      case 'exceeded':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'critical':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700';
      case 'warning':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border animate-pulse',
        getBadgeStyles(),
        className
      )}
      title={`${Math.round(remainingMinutes)} minutes remaining today`}
    >
      {status === 'exceeded' ? (
        <>
          <AlertTriangle className="h-3 w-3" />
          Quota exceeded
        </>
      ) : (
        <>
          <Clock className="h-3 w-3" />
          {Math.round(remainingMinutes)}m left
        </>
      )}
    </span>
  );
}

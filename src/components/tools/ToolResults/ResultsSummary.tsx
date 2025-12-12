import { cn } from '@/lib/utils'

export interface ResultsSummaryProps {
  /** Summary value (e.g., "$2,500 - $4,000", "35 sq ft") */
  value: React.ReactNode
  /** Optional label (e.g., "Estimated cost", "Total area") */
  label?: string
  /** Optional description or subtitle */
  description?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Optional className */
  className?: string
}

/**
 * ResultsSummary Component
 *
 * Simple wrapper for consistent summary formatting across tool results.
 * Used both in full results panels and in StickyResultsBar collapsed state.
 *
 * Features:
 * - Consistent typography and spacing
 * - Responsive sizing
 * - Optional label and description
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <ResultsSummary
 *   label="Estimated cost"
 *   value="$2,500 - $4,000"
 *   description="Based on national averages"
 *   size="lg"
 * />
 * ```
 *
 * @see {@link /Users/aaronbaker/knearme-workspace/knearme-portfolio/src/components/tools/ToolResults/StickyResultsBar.tsx} StickyResultsBar usage
 */
export function ResultsSummary({
  value,
  label,
  description,
  size = 'md',
  className,
}: ResultsSummaryProps) {
  const sizeClasses = {
    sm: {
      label: 'text-xs',
      value: 'text-lg',
      description: 'text-xs',
    },
    md: {
      label: 'text-sm',
      value: 'text-2xl',
      description: 'text-sm',
    },
    lg: {
      label: 'text-base',
      value: 'text-3xl md:text-4xl',
      description: 'text-base',
    },
  }

  const sizes = sizeClasses[size]

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <div
          className={cn(
            sizes.label,
            'text-gray-500 dark:text-gray-400 font-medium'
          )}
        >
          {label}
        </div>
      )}
      <div
        className={cn(
          sizes.value,
          'font-bold text-gray-900 dark:text-gray-100'
        )}
      >
        {value}
      </div>
      {description && (
        <div
          className={cn(
            sizes.description,
            'text-gray-600 dark:text-gray-300'
          )}
        >
          {description}
        </div>
      )}
    </div>
  )
}

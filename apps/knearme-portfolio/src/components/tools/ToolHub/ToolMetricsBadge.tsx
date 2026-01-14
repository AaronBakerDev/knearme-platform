/**
 * ToolMetricsBadge Component
 *
 * Displays tool complexity metrics (time estimate, input count, complexity level).
 * Used in tool cards to help users understand effort required.
 */

import { Badge } from '@/components/ui/badge'
import { Clock, ListCheck } from 'lucide-react'
import type { ToolComplexity } from '@/lib/tools/catalog'

interface ToolMetricsBadgeProps {
  inputCount: number
  estimatedTime: string
  complexity: ToolComplexity
}

const COMPLEXITY_LABELS: Record<ToolComplexity, string> = {
  simple: 'Simple',
  moderate: 'Moderate',
  detailed: 'Detailed',
}

const COMPLEXITY_VARIANTS = {
  simple: 'outline',
  moderate: 'outline',
  detailed: 'outline',
} as const

export function ToolMetricsBadge({
  inputCount,
  estimatedTime,
  complexity,
}: ToolMetricsBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {/* Time estimate */}
      <div className="flex items-center gap-1.5">
        <Clock className="size-3.5" />
        <span>{estimatedTime}</span>
      </div>

      {/* Separator */}
      <span className="text-muted-foreground/50">•</span>

      {/* Input count */}
      <div className="flex items-center gap-1.5">
        <ListCheck className="size-3.5" />
        <span>{inputCount} input{inputCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Complexity badge (optional, shown for moderate/detailed) */}
      {complexity !== 'simple' && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <Badge variant={COMPLEXITY_VARIANTS[complexity]} className="text-xs">
            {COMPLEXITY_LABELS[complexity]}
          </Badge>
        </>
      )}
    </div>
  )
}

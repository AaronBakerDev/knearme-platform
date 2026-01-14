/**
 * Collected Data Peek Bar - Mobile-only bar showing collected data.
 *
 * Sits above the input on mobile, shows chips for collected data,
 * and can be tapped to expand into the full preview overlay.
 *
 * @see chat-ux-patterns.md#collecteddatapeekbar
 */

'use client';

import { ChevronUp, Home, Clock, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectPreviewData } from './hooks/useProjectData';
import type { CompletenessState } from './hooks/useCompleteness';

interface CollectedDataPeekBarProps {
  /** Aggregated project data from useProjectData */
  data: ProjectPreviewData;
  /** Completeness state from useCompleteness */
  completeness: CompletenessState;
  /** Click handler to expand preview */
  onExpand: () => void;
  /** Optional additional className */
  className?: string;
}

/**
 * Small chip component for peek bar.
 */
function PeekChip({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground whitespace-nowrap">
      {icon}
      {children}
    </span>
  );
}

/**
 * Mobile-only peek bar showing collected data.
 */
export function CollectedDataPeekBar({
  data,
  completeness,
  onExpand,
  className,
}: CollectedDataPeekBarProps) {
  // Don't show if no content collected yet
  if (!data.hasContent && completeness.percentage === 0) {
    return null;
  }

  return (
    <button
      onClick={onExpand}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 w-full',
        'bg-muted/30 border-t border-border/50',
        'active:bg-muted/50 transition-colors',
        className
      )}
      aria-label="Expand portfolio preview"
    >
      {/* Data chips - horizontally scrollable */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {data.projectType && (
          <PeekChip icon={<Home className="h-3 w-3" />}>
            {data.projectType}
          </PeekChip>
        )}

        {data.materials.slice(0, 2).map((mat) => (
          <PeekChip key={mat} icon={<Package className="h-3 w-3" />}>
            {mat}
          </PeekChip>
        ))}

        {data.duration && (
          <PeekChip icon={<Clock className="h-3 w-3" />}>
            {data.duration}
          </PeekChip>
        )}

        {data.imageCount > 0 && (
          <PeekChip>
            {data.imageCount} photo{data.imageCount !== 1 ? 's' : ''}
          </PeekChip>
        )}
      </div>

      {/* Expand indicator with percentage */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-medium text-primary">
          {completeness.percentage}%
        </span>
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

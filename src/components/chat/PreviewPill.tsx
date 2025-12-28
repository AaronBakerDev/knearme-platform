/**
 * Preview Pill - Floating button to access preview on tablet/mobile.
 *
 * Shows on tablet (768-1023px) as a floating pill that opens
 * the full preview overlay when tapped.
 *
 * @see chat-ux-patterns.md#tablet-layout-768px---1023px
 */

'use client';

import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PreviewPillProps {
  /** Project title or placeholder */
  title: string | null;
  /** Completeness percentage (0-100) */
  percentage: number;
  /** Click handler to open preview */
  onClick: () => void;
  /** Optional additional className */
  className?: string;
}

/**
 * Floating preview pill for tablet layout.
 */
export function PreviewPill({
  title,
  percentage,
  onClick,
  className,
}: PreviewPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-24 right-4 z-30',
        'flex items-center gap-2 px-4 py-2.5',
        'rounded-full bg-primary text-primary-foreground',
        'shadow-lg hover:shadow-xl transition-shadow',
        'animate-fade-in',
        className
      )}
      aria-label="Open portfolio preview"
    >
      <Eye className="h-4 w-4" />
      <span className="font-medium text-sm truncate max-w-[150px]">
        {title || 'Portfolio'}
      </span>
      <Badge
        variant="secondary"
        className="bg-primary-foreground/20 text-primary-foreground text-xs"
      >
        {percentage}%
      </Badge>
    </button>
  );
}

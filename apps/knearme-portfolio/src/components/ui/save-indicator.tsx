/**
 * Save Status Indicator
 *
 * Shows auto-save status with subtle animation.
 */

'use client';

import { cn } from '@/lib/utils';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import type { SaveStatus } from '@/hooks/useAutoSave';

export interface SaveIndicatorProps {
  status: SaveStatus;
  className?: string;
}

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  if (status === 'idle') {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs transition-opacity',
        status === 'saving' && 'text-muted-foreground',
        status === 'saved' && 'text-green-600',
        status === 'error' && 'text-red-500',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3 w-3" aria-hidden="true" />
          <span>Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          <span>Save failed</span>
        </>
      )}
    </div>
  );
}

export default SaveIndicator;

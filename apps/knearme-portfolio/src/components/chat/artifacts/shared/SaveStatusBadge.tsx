'use client';

/**
 * Save Status Badge Component.
 *
 * Shows the save state of an artifact (saving, saved, error).
 * Uses subtle animations and colors to indicate status without being intrusive.
 *
 * States:
 * - 'idle': Hidden (no activity)
 * - 'saving': Pulsing dot with "Saving..." text
 * - 'saved': Check mark with "Saved" text (auto-hides after 2s)
 * - 'error': Red dot with "Failed to save" text
 *
 * @see /todo/ai-sdk-phase-7-persistence-memory.md
 */

import { useState, useEffect } from 'react';
import { Check, Loader2, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusBadgeProps {
  /** Current save status */
  status: SaveStatus;
  /** Optional error message for error state */
  errorMessage?: string;
  /** Whether to auto-hide after saved (default: true) */
  autoHide?: boolean;
  /** How long to show "Saved" before hiding (ms) */
  hideDelay?: number;
  /** Optional className */
  className?: string;
}

export function SaveStatusBadge({
  status,
  errorMessage,
  autoHide = true,
  hideDelay = 2000,
  className,
}: SaveStatusBadgeProps) {
  // Track the displayed status to handle auto-hide
  const [displayStatus, setDisplayStatus] = useState<SaveStatus>(status);

  // Sync displayStatus with prop, but with auto-hide delay for 'saved'
  useEffect(() => {
    // Use queueMicrotask to avoid synchronous setState warning
    queueMicrotask(() => {
      if (status === 'saved' && autoHide) {
        setDisplayStatus('saved');
      } else {
        setDisplayStatus(status);
      }
    });

    // Set up auto-hide timer for 'saved' status
    if (status === 'saved' && autoHide) {
      const timer = setTimeout(() => setDisplayStatus('idle'), hideDelay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status, autoHide, hideDelay]);

  // Don't render if idle (unless there was an error)
  if (displayStatus === 'idle') {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200',
        status === 'saving' && 'bg-muted text-muted-foreground',
        status === 'saved' && 'bg-emerald-500/10 text-emerald-600',
        status === 'error' && 'bg-destructive/10 text-destructive',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3 w-3" />
          <span>Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>{errorMessage || 'Failed to save'}</span>
        </>
      )}
    </div>
  );
}

/**
 * Compact save indicator (just the icon, no text).
 * Useful for tight spaces like artifact headers.
 */
export function SaveIndicator({
  status,
  className,
}: {
  status: SaveStatus;
  className?: string;
}) {
  if (status === 'idle') return null;

  return (
    <div
      className={cn(
        'flex items-center justify-center w-5 h-5 rounded-full transition-all duration-200',
        status === 'saving' && 'text-muted-foreground',
        status === 'saved' && 'text-emerald-500',
        status === 'error' && 'text-destructive',
        className
      )}
      role="status"
      aria-label={
        status === 'saving'
          ? 'Saving...'
          : status === 'saved'
            ? 'Saved'
            : 'Save failed'
      }
    >
      {status === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {status === 'saved' && <Cloud className="h-3.5 w-3.5" />}
      {status === 'error' && <CloudOff className="h-3.5 w-3.5" />}
    </div>
  );
}

/**
 * Hook to manage save status with auto-reset.
 * Simplifies status management in artifact components.
 */
export function useSaveStatus(resetDelay = 2000) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const setSaving = () => {
    setStatus('saving');
    setErrorMessage(undefined);
  };

  const setSaved = () => {
    setStatus('saved');
    setErrorMessage(undefined);
    // Auto-reset to idle after delay
    setTimeout(() => setStatus('idle'), resetDelay);
  };

  const setError = (message?: string) => {
    setStatus('error');
    setErrorMessage(message);
  };

  const reset = () => {
    setStatus('idle');
    setErrorMessage(undefined);
  };

  return {
    status,
    errorMessage,
    setSaving,
    setSaved,
    setError,
    reset,
  };
}

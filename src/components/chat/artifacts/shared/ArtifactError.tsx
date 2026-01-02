'use client';

/**
 * Error display for failed artifacts.
 *
 * Displays when a tool execution fails (state: output-error, output-denied).
 * Provides contextual error message and optional retry action.
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ArtifactType } from '@/types/artifacts';

interface ArtifactErrorProps {
  /** Type of artifact that failed */
  type: ArtifactType;
  /** Error message (if available) */
  errorText?: string;
  /** Whether the error was due to user denial */
  isDenied?: boolean;
  /** Callback to retry the operation */
  onRetry?: () => void;
  /** Optional additional className */
  className?: string;
}

/**
 * Default error messages by artifact type.
 */
const DEFAULT_ERRORS: Record<ArtifactType, string> = {
  extractProjectData: 'Could not extract project details.',
  showProgress: 'Could not calculate progress.',
  showProgressTracker: 'Could not show progress tracker.',
  promptForImages: 'Could not prepare image upload.',
  showPortfolioPreview: 'Could not build preview.',
  showContentEditor: 'Could not load editor.',
  requestClarification: 'Could not analyze input.',
  updateField: 'Could not update field.',
  updateDescriptionBlocks: 'Could not update description.',
  suggestQuickActions: 'Could not update suggestions.',
  regenerateSection: 'Could not regenerate content.',
  reorderImages: 'Could not reorder images.',
  validateForPublish: 'Could not validate publish readiness.',
  generatePortfolioContent: 'Could not generate portfolio content.',
  showBusinessSearchResults: 'Could not search for business.',
  composePortfolioLayout: 'Could not compose portfolio layout.',
  checkPublishReady: 'Could not check publish readiness.',
};

/**
 * Error component for failed artifacts.
 */
export function ArtifactError({
  type,
  errorText,
  isDenied = false,
  onRetry,
  className,
}: ArtifactErrorProps) {
  const defaultMessage = DEFAULT_ERRORS[type] || 'Something went wrong.';
  const message = isDenied
    ? 'This action was cancelled.'
    : errorText || defaultMessage;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg',
        'bg-destructive/10 text-destructive text-sm',
        'border border-destructive/20',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && !isDenied && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-7 px-2 text-destructive hover:text-destructive"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

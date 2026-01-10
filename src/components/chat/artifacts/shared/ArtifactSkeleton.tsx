'use client';

/**
 * Loading skeleton for artifacts.
 *
 * Displays while a tool is executing (states: input-streaming, input-available).
 * Shows a context-aware placeholder based on the artifact type.
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ArtifactType, ToolPartState } from '@/types/artifacts';

interface ArtifactSkeletonProps {
  /** Type of artifact being loaded */
  type: ArtifactType;
  /** Optional tool part state for more specific messaging */
  state?: ToolPartState;
  /** Optional additional className */
  className?: string;
}

/**
 * Loading messages by artifact type.
 */
const LOADING_MESSAGES: Record<ArtifactType, string> = {
  extractProjectData: 'Extracting project details...',
  showProgress: 'Calculating progress...',
  showProgressTracker: 'Calculating progress...',
  promptForImages: 'Preparing image upload...',
  showPortfolioPreview: 'Building preview...',
  showContentEditor: 'Loading editor...',
  requestClarification: 'Analyzing...',
  updateField: 'Updating field...',
  updateDescriptionBlocks: 'Updating description...',
  suggestQuickActions: 'Updating suggestions...',
  regenerateSection: 'Regenerating content...',
  reorderImages: 'Reordering images...',
  validateForPublish: 'Validating publish readiness...',
  generatePortfolioContent: 'Generating portfolio content...',
  showBusinessSearchResults: 'Searching for business...',
  showProfileReveal: 'Loading profile reveal...',
  composePortfolioLayout: 'Composing portfolio layout...',
  checkPublishReady: 'Checking publish readiness...',
};

/**
 * Skeleton component for loading artifacts.
 */
export function ArtifactSkeleton({ type, state, className }: ArtifactSkeletonProps) {
  const approvalMessage =
    state === 'approval-requested'
      ? 'Awaiting approval...'
      : state === 'approval-responded'
        ? 'Approval received...'
        : undefined;

  const message = approvalMessage || LOADING_MESSAGES[type] || 'Loading...';

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-muted/50 text-muted-foreground text-sm',
        'animate-pulse',
        className
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
}

'use client';

/**
 * ArtifactRenderer - Central dispatcher for rendering tool parts as artifacts.
 *
 * Takes a tool part from UIMessage.parts[] and renders the appropriate artifact
 * component based on the tool type and execution state.
 *
 * States handled:
 * - input-streaming: Show loading skeleton
 * - input-available: Show loading skeleton (execution pending)
 * - output-available: Render full artifact component
 * - output-error: Show error with retry option
 * - output-denied: Show denied message
 *
 * @see /docs/ai-sdk/chat-artifacts-spec.md for specification
 * @see https://ai-sdk.dev/docs/ai-sdk-core/generating-text#tool-parts
 */

import { useEffect, useRef } from 'react';
import { ProjectDataCard } from './ProjectDataCard';
import { ImageGalleryArtifact } from './ImageGalleryArtifact';
import { ProgressTracker } from './ProgressTracker';
import { ClarificationCard } from './ClarificationCard';
import { PublishReadinessCard } from './PublishReadinessCard';
import { GeneratedContentCard } from './GeneratedContentCard';
import { ArtifactSkeleton } from './shared/ArtifactSkeleton';
import { ArtifactError } from './shared/ArtifactError';
import { extractToolName, type ArtifactType } from '@/types/artifacts';

/**
 * Image item for artifacts that display images.
 */
interface ArtifactImage {
  id: string;
  url: string;
  image_type?: 'before' | 'after' | 'progress' | 'detail';
}

/**
 * Props for ArtifactRenderer.
 */
interface ArtifactRendererProps {
  /** Tool part from UIMessage.parts[] */
  part: {
    type: string;
    state: string;
    toolCallId: string;
    output?: unknown;
    input?: unknown;
    errorText?: string;
  };
  /** Callback when artifact emits an action */
  onAction?: (action: { type: string; payload?: unknown }) => void;
  /** Images to pass to image-related artifacts (e.g., promptForImages) */
  images?: ArtifactImage[];
  /** Optional additional className */
  className?: string;
  /**
   * Whether a save operation is in progress.
   * Passed to ContentEditor to disable buttons during save.
   * Prevents duplicate submissions when user clicks publish rapidly.
   */
  isSaving?: boolean;
  /**
   * Set of tool call IDs that have already been processed.
   * Used to skip firing side-effects for restored session messages.
   * Without this, showPortfolioPreview would auto-open the preview
   * overlay when session is restored with existing tool results.
   */
  processedToolCallIds?: Set<string>;
}

/**
 * Type for artifact component props.
 * Components receive data and optional onAction callback.
 * Image artifacts also receive an images array.
 * ContentEditor receives isSaving for button disabling.
 */
type ArtifactComponentType = React.ComponentType<{
  data: unknown;
  onAction?: (action: { type: string; payload?: unknown }) => void;
  images?: ArtifactImage[];
  className?: string;
  isSaving?: boolean;
}>;

/**
 * Map of artifact types to their components.
 * Components must accept { data: T, onAction?: fn } props where T is the tool output type.
 */
const ARTIFACT_COMPONENTS: Partial<Record<ArtifactType, ArtifactComponentType>> = {
  extractProjectData: ProjectDataCard as ArtifactComponentType,
  promptForImages: ImageGalleryArtifact as ArtifactComponentType,
  showProgressTracker: ProgressTracker as ArtifactComponentType,
  requestClarification: ClarificationCard as ArtifactComponentType,
  checkPublishReady: PublishReadinessCard as ArtifactComponentType,
  generatePortfolioContent: GeneratedContentCard as ArtifactComponentType,
};

/**
 * Side-effect tools that trigger actions but don't render artifacts.
 * These call onAction when their output is available, then render nothing.
 */
const SIDE_EFFECT_TOOLS: Set<ArtifactType> = new Set([
  'showContentEditor',
  'showPortfolioPreview',
  'updateField',
  'updateDescriptionBlocks',
  'suggestQuickActions',
  'composePortfolioLayout',
  'reorderImages',
  'regenerateSection',
  'validateForPublish',
]);

/**
 * Check if a tool part is in a loading state.
 */
function isLoadingState(state: string): boolean {
  return (
    state === 'input-streaming' ||
    state === 'input-available' ||
    state === 'approval-requested' ||
    state === 'approval-responded'
  );
}

/**
 * Check if a tool part is in an error state.
 */
function isErrorState(state: string): boolean {
  return state === 'output-error' || state === 'output-denied';
}

/**
 * Renders a tool part as an artifact based on its type and state.
 */
export function ArtifactRenderer({
  part,
  onAction,
  images,
  className,
  isSaving,
  processedToolCallIds,
}: ArtifactRendererProps) {
  const toolName = extractToolName(part.type) as ArtifactType;
  const Component = ARTIFACT_COMPONENTS[toolName];
  const isSideEffect = SIDE_EFFECT_TOOLS.has(toolName);
  const contentEditorKey = part.toolCallId;

  // Track if we've already fired the side-effect for this tool call
  const sideEffectFiredRef = useRef<string | null>(null);

  // Handle side-effect tools: fire action when output available, render nothing
  // Skip if toolCallId is in processedToolCallIds (restored from session history)
  useEffect(() => {
    if (
      isSideEffect &&
      part.state === 'output-available' &&
      part.output !== undefined &&
      onAction &&
      sideEffectFiredRef.current !== part.toolCallId &&
      !processedToolCallIds?.has(part.toolCallId)
    ) {
      sideEffectFiredRef.current = part.toolCallId;
      if (toolName === 'showPortfolioPreview') {
        onAction({ type: 'showPreview', payload: part.output });
      } else if (toolName === 'updateField') {
        onAction({ type: 'updateField', payload: part.output });
      } else if (toolName === 'updateDescriptionBlocks') {
        onAction({ type: 'updateDescriptionBlocks', payload: part.output });
      } else if (toolName === 'suggestQuickActions') {
        onAction({ type: 'suggestQuickActions', payload: part.output });
      } else if (toolName === 'composePortfolioLayout') {
        onAction({ type: 'composePortfolioLayout', payload: part.output });
      } else if (toolName === 'reorderImages') {
        onAction({ type: 'reorderImages', payload: part.output });
      } else if (toolName === 'regenerateSection') {
        onAction({ type: 'regenerate', payload: part.output });
      } else if (toolName === 'validateForPublish') {
        onAction({ type: 'validateForPublish', payload: part.output });
      }
    }
  }, [isSideEffect, part.state, part.output, part.toolCallId, onAction, toolName, processedToolCallIds]);

  // Side-effect tools don't render anything
  if (isSideEffect) {
    return null;
  }

  // Unknown artifact type (not a component or side-effect) - skip rendering
  if (!Component) {
    return null;
  }

  // Loading state (input-streaming or input-available)
  if (isLoadingState(part.state)) {
    return (
      <ArtifactSkeleton
        type={toolName}
        state={part.state as import('@/types/artifacts').ToolPartState}
        className={className}
      />
    );
  }

  // Error state (output-error or output-denied)
  if (isErrorState(part.state)) {
    return (
      <ArtifactError
        type={toolName}
        errorText={part.errorText}
        isDenied={part.state === 'output-denied'}
        onRetry={onAction ? () => onAction({ type: 'retry' }) : undefined}
        className={className}
      />
    );
  }

  // Output available - render the artifact
  if (part.state === 'output-available' && part.output !== undefined) {
    return (
      <Component
        key={contentEditorKey}
        data={part.output}
        onAction={onAction}
        images={images}
        className={className}
        isSaving={isSaving}
      />
    );
  }

  // Fallback - shouldn't happen in normal flow
  return null;
}

/**
 * Check if a message part should be rendered as an artifact.
 * Includes both visual artifacts and side-effect tools.
 */
export function isArtifactPart(part: { type: string }): boolean {
  if (!part.type.startsWith('tool-')) return false;
  const toolName = extractToolName(part.type) as ArtifactType;
  return toolName in ARTIFACT_COMPONENTS || SIDE_EFFECT_TOOLS.has(toolName);
}

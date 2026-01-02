/**
 * Type definitions for the artifact system.
 *
 * Artifacts are rich, interactive UI components rendered inline within chat messages.
 * They are triggered by AI tool calls and display structured data.
 *
 * @see /docs/ai-sdk/chat-artifacts-spec.md for full specification
 * @see https://ai-sdk.dev/docs/ai-sdk-core/generating-text#tool-parts
 */

import type { ExtractedProjectData } from '@/lib/chat/chat-types';
import type { DescriptionBlock } from '@/lib/content/description-blocks';
import type { DiscoveredBusiness } from '@/lib/tools/business-discovery';

/**
 * Tool part states from AI SDK 6.
 *
 * @see https://ai-sdk.dev/docs/ai-sdk-core/generating-text#tool-parts
 */
export type ToolPartState =
  | 'input-streaming'    // Tool input is being streamed from LLM
  | 'input-available'    // Tool input is ready, execution pending
  | 'approval-requested' // Waiting for user approval (if enabled)
  | 'approval-responded' // User responded to approval request
  | 'output-available'   // Tool executed successfully, result ready
  | 'output-error'       // Tool execution failed
  | 'output-denied';     // Tool execution denied by user

/**
 * Artifact type identifiers (match tool names in /api/chat/route.ts).
 */
export type ArtifactType =
  | 'extractProjectData'
  | 'showProgress'
  | 'showProgressTracker'
  | 'promptForImages'
  | 'showPortfolioPreview'
  | 'showContentEditor'
  | 'requestClarification'
  | 'updateField'
  | 'updateDescriptionBlocks'
  | 'suggestQuickActions'
  | 'generatePortfolioContent'
  | 'showBusinessSearchResults'
  | 'composePortfolioLayout'
  | 'checkPublishReady'
  | 'reorderImages'
  | 'regenerateSection'
  | 'validateForPublish';

/**
 * Base interface for tool parts from UIMessage.parts[].
 */
export interface BaseToolPart {
  type: `tool-${string}`;
  state: ToolPartState;
  toolCallId: string;
}

/**
 * Tool part with typed input/output based on state.
 */
export interface ToolPart<TInput = unknown, TOutput = unknown> extends BaseToolPart {
  input?: TInput;
  output?: TOutput;
  errorText?: string;
}

// =============================================================================
// Artifact-Specific Types
// =============================================================================

/**
 * Progress tracker data.
 */
export interface ProgressData {
  collected: {
    hasImages: boolean;
    hasProjectType: boolean;
    hasMaterials: boolean;
    hasProblem: boolean;
    hasSolution: boolean;
    hasDuration: boolean;
  };
  completeness: number;
  nextSuggestion?: string;
}

/**
 * Image prompt data.
 */
export interface ImagePromptData {
  existingCount: number;
  suggestedCategories?: ('before' | 'after' | 'progress' | 'detail')[];
  message?: string;
}

/**
 * Portfolio preview data.
 *
 * This is a side-effect tool that triggers the preview overlay on mobile
 * or highlights the preview pane on desktop. It doesn't render an artifact.
 *
 * @see ArtifactRenderer.tsx - SIDE_EFFECT_TOOLS handles this tool type
 */
export interface PortfolioPreviewData {
  /** Suggested portfolio title (optional hint) */
  title?: string;
  /** Message about the preview update (e.g., "Check out your updated preview!") */
  message?: string;
  /** Fields to highlight as recently updated (e.g., ["materials", "photos"]) */
  highlightFields?: string[];
}

/**
 * Content editor data.
 */
export interface ContentEditorData {
  title: string;
  description: string;
  seo_title?: string;
  seo_description?: string;
  tags?: string[];
  materials?: string[];
  techniques?: string[];
  editable: boolean;
}

/**
 * Clarification request data.
 */
export interface ClarificationData {
  field: string;
  currentValue?: string;
  alternatives?: string[];
  question: string;
  confidence: number;
  context?: string;
}

/**
 * Update field tool data (edit mode).
 */
export interface UpdateFieldData {
  field: string;
  value: string | string[];
  reason?: string;
  success?: boolean;
}

/**
 * Update description blocks tool data (edit mode).
 */
export interface UpdateDescriptionBlocksData {
  blocks: DescriptionBlock[];
  reason?: string;
}

/**
 * Progress tracker data (matches CompletenessState from useCompleteness).
 * Used for the in-chat progress visualization artifact.
 *
 * @see /src/components/chat/hooks/useCompleteness.ts
 */
export interface ProgressTrackerData {
  /** Percentage complete (0-100) */
  percentage: number;
  /** Fields that are complete */
  completedFields: string[];
  /** Fields that are still missing */
  missingFields: string[];
  /** Whether we have minimum requirements to generate */
  canGenerate: boolean;
  /** Human-readable status message */
  statusMessage: string;
  /** Current visual state */
  visualState: 'empty' | 'starting' | 'partial' | 'almost' | 'ready';
}

/**
 * Publish readiness check data from QualityChecker agent.
 *
 * @see /src/lib/agents/quality-checker.ts
 * @see /src/lib/chat/tool-schemas.ts CheckPublishReadyOutput
 */
export interface PublishReadinessData {
  /** Whether project is ready to publish */
  ready: boolean;
  /** Required fields that are missing (blocking) */
  missing: string[];
  /** Recommendations (non-blocking) */
  warnings: string[];
  /** Actionable suggestions for each issue */
  suggestions: string[];
  /** Most important issue to address first */
  topPriority: string | null;
  /** Human-readable summary message */
  summary: string;
}

/**
 * Generated portfolio content data from ContentGenerator agent.
 *
 * @see /src/lib/agents/content-generator.ts
 * @see /src/lib/chat/tool-schemas.ts GeneratePortfolioContentOutput
 */
export interface GeneratedContentData {
  /** Whether generation succeeded */
  success: boolean;
  /** Generated project title */
  title: string;
  /** Generated description (300-500 words) */
  description: string;
  /** SEO-optimized title */
  seoTitle: string;
  /** SEO meta description */
  seoDescription: string;
  /** Categorization tags */
  tags: string[];
  /** Error message if generation failed */
  error?: string;
}

/**
 * Business search results data from Discovery Agent.
 */
export interface BusinessSearchResultsData {
  results: DiscoveredBusiness[];
  prompt?: string;
}

/**
 * Layout composition data from Layout Composer agent.
 */
export interface ComposePortfolioLayoutData {
  blocks: DescriptionBlock[];
  imageOrder?: string[];
  rationale?: string;
  missingContext?: string[];
  confidence?: number;
}

// =============================================================================
// Typed Artifact Parts
// =============================================================================

/**
 * Union of all artifact parts with typed input/output.
 */
export type ArtifactPart =
  | ToolPart<ExtractedProjectData, ExtractedProjectData> & { type: 'tool-extractProjectData' }
  | ToolPart<ProgressData, ProgressData> & { type: 'tool-showProgress' }
  | ToolPart<ProgressTrackerData, ProgressTrackerData> & { type: 'tool-showProgressTracker' }
  | ToolPart<ImagePromptData, ImagePromptData> & { type: 'tool-promptForImages' }
  | ToolPart<PortfolioPreviewData, PortfolioPreviewData> & { type: 'tool-showPortfolioPreview' }
  | ToolPart<ContentEditorData, ContentEditorData> & { type: 'tool-showContentEditor' }
  | ToolPart<ClarificationData, ClarificationData> & { type: 'tool-requestClarification' }
  | ToolPart<UpdateFieldData, UpdateFieldData> & { type: 'tool-updateField' }
  | ToolPart<UpdateDescriptionBlocksData, UpdateDescriptionBlocksData> & { type: 'tool-updateDescriptionBlocks' }
  | ToolPart<BusinessSearchResultsData, BusinessSearchResultsData> & { type: 'tool-showBusinessSearchResults' }
  | ToolPart<GeneratedContentData, GeneratedContentData> & { type: 'tool-generatePortfolioContent' }
  | ToolPart<ComposePortfolioLayoutData, ComposePortfolioLayoutData> & { type: 'tool-composePortfolioLayout' }
  | ToolPart<PublishReadinessData, PublishReadinessData> & { type: 'tool-checkPublishReady' };

// =============================================================================
// Artifact Actions
// =============================================================================

/**
 * Action types that can be emitted from artifacts.
 */
export interface ArtifactAction {
  type: 'edit' | 'regenerate' | 'accept' | 'reject' | 'upload' | 'categorize' | 'dismiss';
  artifactType: ArtifactType;
  payload?: unknown;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a part is a tool part (vs. text, image, etc.).
 */
export function isToolPart(part: { type: string }): part is BaseToolPart {
  return part.type.startsWith('tool-');
}

/**
 * Check if a tool part has output available.
 */
export function hasOutput<T>(part: ToolPart<unknown, T>): part is ToolPart<unknown, T> & { output: T } {
  return part.state === 'output-available' && 'output' in part && part.output !== undefined;
}

/**
 * Check if a tool part is still loading.
 */
export function isLoading(part: BaseToolPart): boolean {
  return (
    part.state === 'input-streaming' ||
    part.state === 'input-available' ||
    part.state === 'approval-requested' ||
    part.state === 'approval-responded'
  );
}

/**
 * Check if a tool part has an error.
 */
export function hasError(part: BaseToolPart): boolean {
  return part.state === 'output-error' || part.state === 'output-denied';
}

/**
 * Extract tool name from part type.
 *
 * @example extractToolName('tool-extractProjectData') // 'extractProjectData'
 */
export function extractToolName(partType: string): string {
  return partType.replace('tool-', '');
}

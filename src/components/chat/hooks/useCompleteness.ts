/**
 * Hook for calculating and tracking portfolio completeness.
 *
 * PHILOSOPHY: This hook is for UI DISPLAY ONLY, not gating.
 * The model decides when content is ready, not arbitrary thresholds.
 *
 * What this hook does:
 * - Shows progress percentage for visual feedback
 * - Lists completed/missing fields for transparency
 * - Provides visual states for the canvas animation
 *
 * What this hook does NOT do:
 * - Block generation (model decides)
 * - Enforce minimum word counts (model decides quality)
 * - Gate publishing (warnings only, user decides)
 *
 * @see /docs/philosophy/agent-philosophy.md
 * @see chat-ux-patterns.md#progress-visualization
 */

import { useMemo } from 'react';
import type { ExtractedProjectData, UploadedImage } from '@/lib/chat/chat-types';

/**
 * PHILOSOPHY: No fixed field list.
 *
 * The AI agent decides what's relevant for THIS business:
 * - A mason might need materials and techniques
 * - A photographer might need lighting and equipment
 * - A caterer might need cuisine type and serving size
 *
 * We track presence of ANY meaningful content, not specific fields.
 * The visual feedback shows "something" vs "nothing", not a checklist.
 *
 * Core fields that apply to ANY portfolio (minimal guardrails):
 */
const CORE_FIELDS = ['photos', 'project_type', 'location'] as const;

/**
 * Completeness state with percentage and field tracking.
 */
export interface CompletenessState {
  /** Percentage complete (0-100) - for UI display only */
  percentage: number;
  /** Fields that are complete */
  completedFields: string[];
  /** Fields that are still missing */
  missingFields: string[];
  /** Whether we have ANY content (not a gate, just info) */
  canGenerate: boolean;
  /** Whether we have recommended fields for publish (not a gate, just info) */
  canPublish: boolean;
  /** Human-readable status message */
  statusMessage: string;
  /** Current visual state for the canvas */
  visualState: 'empty' | 'starting' | 'partial' | 'almost' | 'ready';
  /** Quality suggestions (informational, not blocking) */
  qualityIssues: string[];
}

/**
 * Calculate completeness from extracted data and image count.
 *
 * PHILOSOPHY: Track content presence, not specific field checklists.
 * The AI decides what's important for this business - we just show
 * whether there's "something" to work with.
 *
 * Core fields (guardrails): photos, project_type, location
 * Additional content: Anything else the AI extracted
 */
export function calculateCompleteness(
  data: ExtractedProjectData,
  imageCount: number
): CompletenessState {
  const completedFields: string[] = [];
  const missingFields: string[] = [];

  // === CORE FIELDS (universal guardrails) ===
  // These apply to ANY portfolio regardless of business type

  if (imageCount > 0) {
    completedFields.push('photos');
  } else {
    missingFields.push('photos');
  }

  if (data.project_type) {
    completedFields.push('project_type');
  } else {
    missingFields.push('project_type');
  }

  const hasLocation = data.city || data.state || data.location;
  if (hasLocation) {
    completedFields.push('location');
  } else {
    missingFields.push('location');
  }

  // === ADDITIONAL CONTENT (agent-decided) ===
  // Count how much additional context the AI has extracted
  // Don't prescribe WHAT should be here - just track presence

  const additionalContent: string[] = [];

  if (data.customer_problem) additionalContent.push('problem');
  if (data.solution_approach) additionalContent.push('solution');
  if (data.materials_mentioned?.length) additionalContent.push('materials');
  if (data.techniques_mentioned?.length) additionalContent.push('techniques');
  if (data.duration) additionalContent.push('duration');
  if (data.proud_of) additionalContent.push('highlight');

  // Add any additional content to completed fields
  completedFields.push(...additionalContent);

  // Percentage based on core fields + richness of additional content
  // Core fields worth 60%, additional content worth 40%
  const coreComplete = completedFields.filter((f) =>
    CORE_FIELDS.includes(f as (typeof CORE_FIELDS)[number])
  ).length;
  const corePercentage = (coreComplete / CORE_FIELDS.length) * 60;

  // Additional content: diminishing returns (first few matter most)
  // 0 = 0%, 1 = 15%, 2 = 25%, 3 = 32%, 4+ = 40%
  const additionalPercentage = Math.min(40, additionalContent.length * 12);

  const percentage = Math.round(corePercentage + additionalPercentage);

  // Determine visual state based on percentage ranges (for animation only)
  let visualState: CompletenessState['visualState'];
  if (percentage === 0) {
    visualState = 'empty';
  } else if (percentage <= 25) {
    visualState = 'starting';
  } else if (percentage <= 60) {
    visualState = 'partial';
  } else if (percentage < 100) {
    visualState = 'almost';
  } else {
    visualState = 'ready';
  }

  // canGenerate: true if we have ANY content at all
  // This is NOT a gate - just an indicator
  const hasAnyContent =
    imageCount > 0 ||
    !!data.project_type ||
    !!data.customer_problem ||
    !!data.solution_approach ||
    (data.materials_mentioned?.length ?? 0) > 0;

  // canPublish: true if we have core fields
  // This is NOT a gate - just a recommendation indicator
  const hasRecommendedFields =
    imageCount > 0 &&
    !!data.project_type &&
    !!data.city &&
    !!data.state;

  // Status message (helpful, not blocking)
  let statusMessage: string;
  if (visualState === 'empty') {
    statusMessage = 'Tell me about your project to get started';
  } else if (visualState === 'starting') {
    statusMessage = 'Looking good! Keep going...';
  } else if (visualState === 'partial') {
    statusMessage = 'Making progress!';
  } else if (visualState === 'almost') {
    statusMessage = 'Almost complete!';
  } else {
    statusMessage = 'Ready to generate!';
  }

  // Quality suggestions (informational only, never blocking)
  // Focus on core fields only - agent decides what else matters
  const qualityIssues: string[] = [];
  if (missingFields.includes('photos')) {
    qualityIssues.push('Photos help showcase your work');
  }
  if (missingFields.includes('location')) {
    qualityIssues.push('Location helps customers find you');
  }
  // No suggestions for additional content - agent knows what's relevant

  return {
    percentage,
    completedFields,
    missingFields,
    canGenerate: hasAnyContent, // Always enabled if any content
    canPublish: hasRecommendedFields, // Recommendation only
    statusMessage,
    visualState,
    qualityIssues,
  };
}

/**
 * Hook for tracking portfolio completeness.
 *
 * IMPORTANT: This hook provides UI feedback only.
 * It does NOT gate any actions - the model decides when ready.
 *
 * @example
 * ```tsx
 * const { percentage, statusMessage, visualState } = useCompleteness(
 *   extractedData,
 *   uploadedImages
 * );
 * // Use for display, never for gating
 * ```
 */
export function useCompleteness(
  data: ExtractedProjectData,
  images: UploadedImage[]
): CompletenessState {
  return useMemo(
    () => calculateCompleteness(data, images.length),
    [data, images.length]
  );
}


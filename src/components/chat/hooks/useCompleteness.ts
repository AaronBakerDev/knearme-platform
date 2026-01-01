/**
 * Hook for calculating and tracking portfolio completeness.
 *
 * Determines what percentage of required data has been collected
 * for generating a portfolio page. Used by LivePortfolioCanvas
 * to show progress and by ChatWizard to determine when to enable
 * the generate button.
 *
 * Weight distribution (totals 100):
 * - Images: 20 (at least 1 photo required)
 * - Project type: 15 (core categorization)
 * - City: 10 (SEO URL)
 * - State: 5 (SEO URL)
 * - Materials: 12 (visual/SEO content)
 * - Customer problem: 12 (story context)
 * - Solution approach: 12 (story resolution)
 * - Duration: 8 (project scope)
 * - Proud of: 6 (bonus highlight)
 *
 * @see chat-ux-patterns.md#progress-visualization
 */

import { useMemo } from 'react';
import type { ExtractedProjectData, UploadedImage } from '@/lib/chat/chat-types';

/**
 * Completeness weights for each field.
 * Total weight = 100
 *
 * NOTE: canPublish aligns with server-side publish requirements.
 * Server requires: title, project_type, city, state, images, hero_image_id
 * @see /src/app/api/projects/[id]/publish/route.ts
 */
const WEIGHTS = {
  images: 20,         // Required by server
  project_type: 15,   // Required by server
  city: 10,           // Required by server (SEO URL)
  state: 5,           // Required by server (SEO URL)
  materials: 12,      // Quality content
  customer_problem: 12, // Story context
  solution_approach: 12, // Story resolution
  duration: 8,        // Project scope
  proud_of: 6,        // Bonus highlight
} as const;

/**
 * Minimum threshold for generation.
 *
 * 45% generally means photos plus at least two core story signals.
 * This acts as a soft gate alongside quality checks.
 *
 * @see Plan file for rationale on threshold value
 */
const GENERATION_THRESHOLD = 45;

/**
 * Quality thresholds for content validation.
 *
 * These ensure enough context for AI to generate a quality 400-600 word description.
 * Character counts are intentionally low to accommodate voice transcriptions
 * and non-English speakers.
 */
const QUALITY_THRESHOLDS = {
  /** Minimum chars for customer problem (~4-5 words) */
  customer_problem_min: 20,
  /** Minimum chars for solution approach (~4-5 words) */
  solution_approach_min: 20,
  /** Combined minimum for problem + solution (ensures enough story) */
  combined_context_min: 50,
} as const;

/**
 * Result of content quality validation.
 */
export interface ContentQualityResult {
  /** Whether all quality thresholds are met */
  meetsQuality: boolean;
  /** List of issues preventing quality generation */
  issues: string[];
}

/**
 * Check if extracted data meets minimum quality requirements.
 *
 * This is a quality gate that ensures enough context exists for the AI
 * to generate a compelling portfolio description (400-600 words).
 *
 * @param data - Extracted project data from conversation
 * @returns Quality check result with issues list
 *
 * @example
 * ```ts
 * const quality = checkContentQuality(data);
 * if (!quality.meetsQuality) {
 *   console.log('Issues:', quality.issues);
 * }
 * ```
 */
export function checkContentQuality(data: ExtractedProjectData): ContentQualityResult {
  const issues: string[] = [];

  const problemLength = (data.customer_problem || '').length;
  const solutionLength = (data.solution_approach || '').length;
  const combinedLength = problemLength + solutionLength;
  // Check individual field lengths (only if field exists but is too short)
  if (data.customer_problem && problemLength < QUALITY_THRESHOLDS.customer_problem_min) {
    issues.push('customer_problem needs more detail');
  }

  if (data.solution_approach && solutionLength < QUALITY_THRESHOLDS.solution_approach_min) {
    issues.push('solution_approach needs more detail');
  }

  // Check combined context (the story needs enough substance)
  if (combinedLength < QUALITY_THRESHOLDS.combined_context_min) {
    issues.push('overall context too brief for quality content');
  }

  return {
    meetsQuality: issues.length === 0,
    issues,
  };
}

/**
 * Completeness state with percentage and missing fields.
 */
export interface CompletenessState {
  /** Percentage complete (0-100) */
  percentage: number;
  /** Fields that are complete */
  completedFields: string[];
  /** Fields that are still missing */
  missingFields: string[];
  /** Whether we have minimum requirements to generate */
  canGenerate: boolean;
  /** Whether we meet minimum requirements to publish */
  canPublish: boolean;
  /** Human-readable status message */
  statusMessage: string;
  /** Current visual state for the canvas */
  visualState: 'empty' | 'starting' | 'partial' | 'almost' | 'ready';
  /** Quality issues preventing generation (empty if none) */
  qualityIssues: string[];
}

/**
 * Calculate completeness from extracted data and image count.
 */
export function calculateCompleteness(
  data: ExtractedProjectData,
  imageCount: number
): CompletenessState {
  const completedFields: string[] = [];
  const missingFields: string[] = [];
  let score = 0;

  // Check each weighted field
  // Server-required fields (these block publishing)
  if (imageCount > 0) {
    score += WEIGHTS.images;
    completedFields.push('photos');
  } else {
    missingFields.push('photos');
  }

  if (data.project_type) {
    score += WEIGHTS.project_type;
    completedFields.push('project_type');
  } else {
    missingFields.push('project_type');
  }

  // City is required for SEO URL generation
  if (data.city) {
    score += WEIGHTS.city;
    completedFields.push('city');
  } else {
    missingFields.push('city');
  }

  // State is required for SEO URL generation
  if (data.state) {
    score += WEIGHTS.state;
    completedFields.push('state');
  } else {
    missingFields.push('state');
  }

  // Quality content fields
  if (data.materials_mentioned?.length) {
    score += WEIGHTS.materials;
    completedFields.push('materials');
  } else {
    missingFields.push('materials');
  }

  if (data.customer_problem) {
    score += WEIGHTS.customer_problem;
    completedFields.push('customer_problem');
  } else {
    missingFields.push('customer_problem');
  }

  if (data.solution_approach) {
    score += WEIGHTS.solution_approach;
    completedFields.push('solution_approach');
  } else {
    missingFields.push('solution_approach');
  }

  if (data.duration) {
    score += WEIGHTS.duration;
    completedFields.push('duration');
  } else {
    missingFields.push('duration');
  }

  if (data.proud_of) {
    score += WEIGHTS.proud_of;
    completedFields.push('proud_of');
  } else {
    missingFields.push('proud_of');
  }

  // Clamp to 100
  const percentage = Math.min(100, score);

  // Determine visual state based on percentage ranges
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

  // Check content quality for generation gate
  const qualityCheck = checkContentQuality(data);

  // Server-required fields for publishing
  // @see /src/app/api/projects/[id]/publish/route.ts
  const hasGenerationInputs =
    imageCount > 0 &&
    (!!data.project_type ||
      !!data.customer_problem ||
      !!data.solution_approach ||
      (data.materials_mentioned?.length ?? 0) > 0);

  const hasPublishRequirements =
    imageCount > 0 &&
    !!data.project_type &&
    !!data.city &&
    !!data.state;

  // Can generate/publish when:
  // 1. All server-required fields are present (images, project_type, city, state)
  // 2. Meets percentage threshold (55%) for content quality
  // 3. Passes quality gate (enough context for good description)
  const canGenerate =
    hasGenerationInputs && percentage >= GENERATION_THRESHOLD && qualityCheck.meetsQuality;

  const canPublish = hasPublishRequirements;

  // Generate status message based on state
  let statusMessage: string;
  if (canGenerate) {
    statusMessage = 'Ready to generate your portfolio!';
  } else if (imageCount === 0) {
    statusMessage = 'Add some photos to continue';
  } else if (!qualityCheck.meetsQuality) {
    statusMessage = 'Add a bit more detail to enable generation';
  } else if (visualState === 'empty') {
    statusMessage = 'Tell me about your project to get started';
  } else if (visualState === 'starting') {
    statusMessage = 'Looking good! Keep telling me more...';
  } else if (visualState === 'partial') {
    statusMessage = "We're making progress!";
  } else {
    statusMessage = 'Almost there!';
  }

  return {
    percentage,
    completedFields,
    missingFields,
    canGenerate,
    canPublish,
    statusMessage,
    visualState,
    qualityIssues: qualityCheck.issues,
  };
}

/**
 * Hook for tracking portfolio completeness.
 *
 * Memoizes calculation to avoid unnecessary re-renders.
 *
 * @example
 * ```tsx
 * const { percentage, canGenerate, statusMessage } = useCompleteness(
 *   extractedData,
 *   uploadedImages
 * );
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

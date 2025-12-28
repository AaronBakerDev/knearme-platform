/**
 * Agent Orchestrator - Account Manager Persona
 *
 * The orchestrator is the "Account Manager" that contractors talk to.
 * It delegates to specialized agents behind the scenes:
 * - Story Extractor: Extracts structured data from conversation
 * - Content Generator: Creates polished content
 * - Quality Checker: Validates publish readiness
 *
 * The contractor only ever sees the Account Manager persona.
 *
 * @see /docs/09-agent/multi-agent-architecture.md
 */

import type { SharedProjectState } from './types';

// Agent imports
import { extractStory } from './story-extractor';
import { generateContent } from './content-generator';
import { checkQuality } from './quality-checker';

/**
 * Actions the orchestrator can take.
 */
export type OrchestratorAction =
  | { type: 'extract_story'; message: string }
  | { type: 'generate_content' }
  | { type: 'check_quality' }
  | { type: 'request_clarification'; fields: string[] }
  | { type: 'prompt_images' }
  | { type: 'ready_to_publish' };

/**
 * Result from orchestrator processing.
 */
export interface OrchestratorResult {
  /** Updated project state */
  state: SharedProjectState;

  /** Actions to take (may be multiple) */
  actions: OrchestratorAction[];

  /** Response message for the contractor */
  message?: string;

  /** Optional error details (for non-AI callers) */
  error?: { message: string; retryable: boolean };
}

/**
 * Orchestrator context for processing messages.
 */
export interface OrchestratorContext {
  /** Current project state */
  state: SharedProjectState;

  /** Contractor message to process */
  message: string;

  /** Current phase of the conversation */
  phase: 'gathering' | 'images' | 'generating' | 'review' | 'ready';
}

/**
 * Determine the current phase based on state.
 */
export function determinePhase(state: SharedProjectState): OrchestratorContext['phase'] {
  if (state.readyToPublish) return 'ready';
  if (state.title && state.description) return 'review';
  if (state.readyForContent) return 'generating';
  if (state.readyForImages) return 'images';
  return 'gathering';
}

/**
 * Process a contractor message through the agent system.
 *
 * This is the main entry point for the orchestrator. It:
 * 1. Determines the current phase
 * 2. Delegates to appropriate agents
 * 3. Returns updated state and next actions
 *
 * @param context - Current context with state and message
 * @returns Orchestrator result with updated state and actions
 */
export async function orchestrate(
  context: OrchestratorContext
): Promise<OrchestratorResult> {
  const { state, message, phase } = context;

  // Handle based on current phase
  switch (phase) {
    case 'gathering':
      return handleGatheringPhase(state, message);

    case 'images':
      return handleImagesPhase(state, message);

    case 'generating':
      return handleGeneratingPhase(state);

    case 'review':
      return handleReviewPhase(state, message);

    case 'ready':
      return handleReadyPhase(state, message);

    default:
      return { state, actions: [] };
  }
}

/**
 * Handle the gathering phase - extract story from conversation.
 */
async function handleGatheringPhase(
  state: SharedProjectState,
  message: string
): Promise<OrchestratorResult> {
  // Use StoryExtractor to extract structured data from conversation
  const result = await extractStory(message, state);

  const newState: SharedProjectState = {
    ...state,
    ...(result.state as Partial<SharedProjectState>),
    needsClarification: result.needsClarification,
    readyForImages: result.readyForImages,
  };

  const actions: OrchestratorAction[] = [];

  // If we need clarification, request it
  if (result.needsClarification.length > 0) {
    actions.push({
      type: 'request_clarification',
      fields: result.needsClarification,
    });
  }

  // If ready for images, prompt for them
  if (result.readyForImages) {
    actions.push({ type: 'prompt_images' });
  }

  return { state: newState, actions };
}

/**
 * Handle the images phase - waiting for image uploads.
 */
async function handleImagesPhase(
  state: SharedProjectState,
  _message: string
): Promise<OrchestratorResult> {
  // In this phase, we're waiting for images
  // The message might contain additional context or be a signal to proceed

  // Check if we have images and can generate content
  if (state.images.length > 0 && state.heroImageId) {
    return {
      state: { ...state, readyForContent: true },
      actions: [{ type: 'generate_content' }],
    };
  }

  return { state, actions: [] };
}

/**
 * Handle the generating phase - create content.
 */
async function handleGeneratingPhase(
  state: SharedProjectState
): Promise<OrchestratorResult> {
  // Use ContentGenerator to create polished content
  const result = await generateContent(state);

  // Handle generation errors
  if ('error' in result) {
    return {
      state,
      actions: [],
      message: result.retryable
        ? `Content generation failed: ${result.error}. Please try again.`
        : `Content generation failed: ${result.error}`,
      error: { message: result.error, retryable: result.retryable },
    };
  }

  const newState: SharedProjectState = {
    ...state,
    suggestedTitle: result.title,
    title: result.title,
    description: result.description,
    seoTitle: result.seoTitle,
    seoDescription: result.seoDescription,
    tags: result.tags,
  };

  return { state: newState, actions: [] };
}

/**
 * Handle the review phase - user is reviewing content.
 */
async function handleReviewPhase(
  state: SharedProjectState,
  _message: string
): Promise<OrchestratorResult> {
  const result = checkQuality(state);

  if (result.ready) {
    return {
      state: { ...state, readyToPublish: true },
      actions: [{ type: 'ready_to_publish' }],
    };
  }

  return {
    state,
    actions: [
      {
        type: 'request_clarification',
        fields: result.missing,
      },
    ],
  };
}

/**
 * Handle the ready phase - project is ready to publish.
 */
async function handleReadyPhase(
  state: SharedProjectState,
  _message: string
): Promise<OrchestratorResult> {
  // Use QualityChecker to validate publish readiness
  const result = checkQuality(state);

  if (result.ready) {
    return {
      state: { ...state, readyToPublish: true },
      actions: [{ type: 'ready_to_publish' }],
    };
  }

  // Build a helpful message with what's missing
  const issues: string[] = [];
  if (result.missing.length > 0) {
    issues.push(`Missing: ${result.missing.join(', ')}`);
  }
  if (result.warnings.length > 0) {
    issues.push(`Recommended: ${result.warnings.join('; ')}`);
  }

  return {
    state,
    actions: [],
    message: `Before publishing, please address:\n${issues.join('\n')}`,
  };
}

/**
 * Merge extracted data into existing state.
 * Later values override earlier ones for the same field.
 */
export function mergeProjectState(
  existing: SharedProjectState,
  updates: Partial<SharedProjectState>
): SharedProjectState {
  return {
    ...existing,
    ...updates,
    // Merge arrays intelligently (dedupe)
    materials: [...new Set([...existing.materials, ...(updates.materials || [])])],
    techniques: [...new Set([...existing.techniques, ...(updates.techniques || [])])],
    tags: [...new Set([...existing.tags, ...(updates.tags || [])])],
    images: updates.images || existing.images,
    // Merge clarification tracking
    needsClarification: updates.needsClarification || existing.needsClarification,
    clarifiedFields: [
      ...new Set([
        ...existing.clarifiedFields,
        ...(updates.clarifiedFields || []),
      ]),
    ],
  };
}

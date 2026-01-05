/**
 * Agent Orchestrator - Account Manager Persona
 *
 * ARCHITECTURE: Orchestrator + Subagents Pattern
 *
 * The Account Manager is the user-facing persona that coordinates specialist
 * subagents. It has lightweight tools (read, delegateTask) and delegates
 * complex work to:
 *
 * - Story Agent: Conversation, images, narrative extraction
 * - Design Agent: Layout, tokens, preview generation
 * - Quality Agent: Assessment, advisory suggestions (NOT blocking)
 *
 * KEY PRINCIPLE: Don't overload the orchestrator with all the tools.
 * Each subagent has focused expertise and tools.
 *
 * The user only ever sees the Account Manager persona.
 *
 * PHILOSOPHY: The orchestrator no longer forces phase progression.
 * It coordinates via checkpoints, not gates. Subagents signal when ready.
 *
 * @see /.claude/skills/agent-atlas/references/AGENT-PERSONAS.md
 * @see /todo/ai-sdk-phase-10-persona-agents.md
 * @see /docs/philosophy/agent-philosophy.md
 */

import type { SharedProjectState } from './types';
import { extractStory } from './story-extractor';
import { generateContent } from './content-generator';
import { checkQuality } from './quality-checker';
import { determinePhase } from './orchestrator/state';
import type {
  OrchestratorAction,
  OrchestratorContext,
  OrchestratorResult,
} from './orchestrator/types';

/**
 * Process a user message through the agent system.
 *
 * PHILOSOPHY: This function no longer forces linear phase progression.
 * It handles the requested operation and returns results. The model
 * decides what operation to request based on conversation context.
 *
 * If no phase hint is provided, the orchestrator will determine
 * the best action based on current state.
 *
 * @param context - Current context with state and message
 * @returns Orchestrator result with updated state and actions
 */
export async function orchestrate(
  context: OrchestratorContext
): Promise<OrchestratorResult> {
  const { state, message } = context;

  // Derive phase from hint or state (backwards compatible)
  const phase = context.phase ?? determinePhase(state);

  // Handle based on derived operation (not forced progression)
  // The phase tells us what operation makes sense given current context
  switch (phase) {
    case 'gathering':
      return handleGatheringPhase(state, message);

    case 'images':
      // No longer gates on images - just return current state
      return { state, actions: [] };

    case 'generating':
      return handleGeneratingPhase(state);

    case 'review':
      return handleReviewPhase(state, message);

    case 'ready':
      return handleReadyPhase(state, message);

    default:
      // Default to gathering if no phase matches
      return handleGatheringPhase(state, message);
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
 * Handle the images phase - no longer gates on image presence.
 *
 * @deprecated This phase handler is a no-op. The model decides
 * when to generate content, not the orchestrator.
 */
async function _handleImagesPhase(
  state: SharedProjectState,
  _message: string
): Promise<OrchestratorResult> {
  // PHILOSOPHY: No longer gates on images.
  // The model decides when to generate content based on context.
  // Users can generate content with or without images.
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

export {
  delegateParallel,
  delegateToDesignAgent,
  delegateToQualityAgent,
  delegateToStoryAgent,
  synthesizeResults,
} from './orchestrator/delegates';
export { determinePhase, mergeProjectState } from './orchestrator/state';
export type {
  DelegationContext,
  OrchestratorAction,
  OrchestratorContext,
  OrchestratorResult,
  PhaseHint,
} from './orchestrator/types';

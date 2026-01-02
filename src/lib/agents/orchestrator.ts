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

// Legacy agent imports (for backwards compatibility during migration)
import { extractStory } from './story-extractor';
import { generateContent } from './content-generator';
import { checkQuality } from './quality-checker';

// New subagent infrastructure (Phase 10)
import {
  spawnSubagent,
  spawnParallel,
  mergeSubagentResults,
  isSuccessfulResult,
  type SubagentContext,
  type SubagentType,
  type DelegationResult,
  type StoryAgentResult,
  type DesignAgentResult,
  type QualityAgentResult,
} from './subagents';

/**
 * Actions the orchestrator can take.
 */
export type OrchestratorAction =
  | { type: 'extract_story'; message: string }
  | { type: 'generate_content' }
  | { type: 'check_quality' }
  | { type: 'request_clarification'; fields: string[] }
  | { type: 'prompt_images' }
  | { type: 'ready_to_publish' }
  // New delegation-based actions (Phase 10)
  | { type: 'delegate'; subagent: SubagentType; result: DelegationResult }
  | { type: 'parallel_delegation'; results: DelegationResult[] }
  // Signal to invoke Design Agent for layout composition
  | { type: 'compose_layout' };

/**
 * Result from orchestrator processing.
 */
export interface OrchestratorResult {
  /** Updated project state */
  state: SharedProjectState;

  /** Actions to take (may be multiple) */
  actions: OrchestratorAction[];

  /** Response message for the user */
  message?: string;

  /** Optional error details (for non-AI callers) */
  error?: { message: string; retryable: boolean };
}

/**
 * Phase hint type (informational only).
 */
export type PhaseHint = 'gathering' | 'images' | 'generating' | 'review' | 'ready';

/**
 * Orchestrator context for processing messages.
 */
export interface OrchestratorContext {
  /** Current project state */
  state: SharedProjectState;

  /** Contractor message to process */
  message: string;

  /**
   * OPTIONAL hint about what operation to perform.
   * This is advisory only - the orchestrator can determine the best
   * action based on state if not provided.
   *
   * PHILOSOPHY: Agents decide what to do based on context.
   * Phase hints are for backwards compatibility only.
   *
   * @deprecated Will be removed in future version.
   * @see /docs/philosophy/agent-philosophy.md
   */
  phase?: PhaseHint;
}

/**
 * Determine the current phase based on state.
 *
 * @deprecated This function is informational only, not for gating.
 * The model decides what to do based on context, not forced phases.
 * Kept for backwards compatibility and analytics.
 *
 * @see /docs/philosophy/agent-philosophy.md
 */
export function determinePhase(state: SharedProjectState): OrchestratorContext['phase'] {
  // Simple heuristics for informational purposes only
  if (state.readyToPublish) return 'ready';
  if (state.title && state.description) return 'review';
  if (state.images.length > 0) return 'generating';
  return 'gathering';
}

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

// ============================================================================
// NEW: Delegation-Based Orchestration (Phase 10)
// ============================================================================

/**
 * Extended orchestrator context with business info for subagents.
 */
export interface DelegationContext extends OrchestratorContext {
  /** Business context for contextual assessment */
  businessContext?: {
    name?: string;
    type?: string;
    voice?: 'formal' | 'casual' | 'technical';
  };

  /** Images for Story Agent analysis */
  images?: SharedProjectState['images'];
}

/**
 * Delegate to the Story Agent for narrative extraction.
 *
 * Use this when:
 * - User uploads images
 * - User describes their project
 * - Content needs to be extracted from conversation
 *
 * @param context - Delegation context with project state and message
 * @returns OrchestratorResult with Story Agent output
 *
 * @example
 * ```typescript
 * const result = await delegateToStoryAgent({
 *   state: projectState,
 *   message: "I just finished a kitchen remodel",
 *   images: uploadedImages,
 * });
 * ```
 */
export async function delegateToStoryAgent(
  context: DelegationContext
): Promise<OrchestratorResult> {
  const startTime = Date.now();

  // Build subagent context
  const subagentContext: SubagentContext = {
    projectState: context.state,
    userMessage: context.message,
    images: context.images,
    businessContext: context.businessContext,
  };

  // Spawn Story Agent
  const result = await spawnSubagent('story', subagentContext);

  const delegationResult: DelegationResult = {
    subagent: 'story',
    result,
    durationMs: Date.now() - startTime,
    wasParallel: false,
  };

  // Handle errors
  if (!isSuccessfulResult(result)) {
    return {
      state: context.state,
      actions: [{ type: 'delegate', subagent: 'story', result: delegationResult }],
      message: result.error || 'Story extraction failed',
      error: { message: result.error || 'Unknown error', retryable: result.retryable ?? true },
    };
  }

  // Cast to StoryAgentResult for type safety
  const storyResult = result as StoryAgentResult;

  // Merge state updates
  const newState = mergeProjectState(context.state, storyResult.stateUpdates);

  // Apply narrative if present
  if (storyResult.narrative) {
    if (storyResult.narrative.title) newState.title = storyResult.narrative.title;
    if (storyResult.narrative.description) newState.description = storyResult.narrative.description;
  }

  // Build actions
  const actions: OrchestratorAction[] = [
    { type: 'delegate', subagent: 'story', result: delegationResult },
  ];

  // Add follow-up action based on checkpoint signaling
  // @see /todo/ai-sdk-phase-10-persona-agents.md#checkpoint-signals
  switch (storyResult.checkpoint) {
    case 'images_uploaded':
      // Images are ready for analysis - Story Agent will continue conversation
      // No additional action needed, the follow-up question handles this
      break;

    case 'basic_info':
      // Core story extracted, but may need more details
      // Prompt for images if none exist in context OR in project state
      const hasContextImages = context.images && context.images.length > 0;
      const hasStateImages = context.state.images.length > 0;
      if (!hasContextImages && !hasStateImages) {
        actions.push({ type: 'prompt_images' });
      }
      break;

    case 'story_complete':
      // Story is complete - signal caller to invoke Design Agent for layout
      actions.push({ type: 'compose_layout' });
      break;
  }

  return {
    state: newState,
    actions,
    message: storyResult.followUpQuestion,
  };
}

/**
 * Delegate to the Design Agent for layout composition.
 *
 * Use this when:
 * - Content is ready for visual presentation
 * - User requests design changes
 * - Iterating on layout based on feedback
 *
 * @param context - Delegation context with project state
 * @param feedback - Optional feedback for iteration
 * @returns OrchestratorResult with Design Agent output
 */
export async function delegateToDesignAgent(
  context: DelegationContext,
  feedback?: string
): Promise<OrchestratorResult> {
  const startTime = Date.now();

  // Build subagent context
  const subagentContext: SubagentContext = {
    projectState: context.state,
    feedback,
    businessContext: context.businessContext,
  };

  // Spawn Design Agent
  const result = await spawnSubagent('design', subagentContext);

  const delegationResult: DelegationResult = {
    subagent: 'design',
    result,
    durationMs: Date.now() - startTime,
    wasParallel: false,
  };

  // Handle errors
  if (!isSuccessfulResult(result)) {
    return {
      state: context.state,
      actions: [{ type: 'delegate', subagent: 'design', result: delegationResult }],
      message: result.error || 'Design composition failed',
      error: { message: result.error || 'Unknown error', retryable: result.retryable ?? true },
    };
  }

  // Cast to DesignAgentResult
  const designResult = result as DesignAgentResult;

  // Update hero image if selected
  const newState = { ...context.state };
  if (designResult.heroImageId) {
    newState.heroImageId = designResult.heroImageId;
  }

  return {
    state: newState,
    actions: [{ type: 'delegate', subagent: 'design', result: delegationResult }],
  };
}

/**
 * Delegate to the Quality Agent for publish readiness assessment.
 *
 * Use this when:
 * - User wants to publish
 * - Checking if portfolio is ready
 * - Need advisory suggestions
 *
 * IMPORTANT: Quality Agent is ADVISORY ONLY. It never blocks publishing.
 *
 * @param context - Delegation context with project state
 * @returns OrchestratorResult with Quality Agent assessment
 */
export async function delegateToQualityAgent(
  context: DelegationContext
): Promise<OrchestratorResult> {
  const startTime = Date.now();

  // Build subagent context
  const subagentContext: SubagentContext = {
    projectState: context.state,
    businessContext: context.businessContext,
  };

  // Spawn Quality Agent
  const result = await spawnSubagent('quality', subagentContext);

  const delegationResult: DelegationResult = {
    subagent: 'quality',
    result,
    durationMs: Date.now() - startTime,
    wasParallel: false,
  };

  // Handle errors - Quality Agent is ADVISORY ONLY
  // IMPORTANT: On error, preserve original state (don't auto-flip readyToPublish).
  // Network failures shouldn't change state. The user can still choose to publish
  // via the UI - we just won't auto-approve on our end.
  // See: /todo/ai-sdk-phase-10-persona-agents.md "Quality Agent" guidelines
  if (!isSuccessfulResult(result)) {
    return {
      state: context.state, // Preserve original state, don't auto-approve
      actions: [
        { type: 'delegate', subagent: 'quality', result: delegationResult },
      ],
      message: 'Quality check unavailable. You can still publish if you\'re ready.',
      error: { message: result.error || 'Quality check failed', retryable: result.retryable ?? true },
    };
  }

  // Cast to QualityAgentResult
  const qualityResult = result as QualityAgentResult;

  // Update state (always allow publishing - advisory only)
  const newState = {
    ...context.state,
    readyToPublish: true, // Always true - quality is advisory
  };

  const actions: OrchestratorAction[] = [
    { type: 'delegate', subagent: 'quality', result: delegationResult },
    { type: 'ready_to_publish' },
  ];

  return {
    state: newState,
    actions,
    message: qualityResult.summaryMessage,
  };
}

/**
 * Run Story and Design agents in parallel.
 *
 * Use this when:
 * - Initial layout generation after images uploaded
 * - Both agents can work independently
 *
 * Story Agent extracts content while Design Agent creates initial layout.
 *
 * @param context - Delegation context
 * @returns OrchestratorResult with merged results
 */
export async function delegateParallel(
  context: DelegationContext
): Promise<OrchestratorResult> {
  const startTime = Date.now();

  // Build contexts for both agents
  const storyContext: SubagentContext = {
    projectState: context.state,
    userMessage: context.message,
    images: context.images,
    businessContext: context.businessContext,
  };

  const designContext: SubagentContext = {
    projectState: context.state,
    businessContext: context.businessContext,
  };

  // Spawn both in parallel
  const results = await spawnParallel([
    { subagent: 'story', context: storyContext },
    { subagent: 'design', context: designContext },
  ]);

  console.log(
    `[Orchestrator] Parallel delegation completed in ${Date.now() - startTime}ms`
  );

  // Merge results into state
  const mergedState = mergeSubagentResults(context.state, results);

  // Extract messages from subagent results
  // Story Agent may have followUpQuestion, Quality Agent may have summaryMessage
  const messages: string[] = [];
  for (const delegation of results) {
    if (!delegation.result.success) continue;

    const result = delegation.result;
    if ('followUpQuestion' in result && result.followUpQuestion) {
      messages.push(result.followUpQuestion);
    }
    if ('summaryMessage' in result && result.summaryMessage) {
      messages.push(result.summaryMessage);
    }
  }

  return {
    state: mergedState,
    actions: [{ type: 'parallel_delegation', results }],
    message: messages.length > 0 ? messages.join('\n\n') : undefined,
  };
}

/**
 * Synthesize results from multiple subagent delegations.
 *
 * Combines outputs into a coherent response for the user.
 *
 * @param results - Array of delegation results
 * @param baseState - Starting project state
 * @returns Synthesized project state and response
 */
export function synthesizeResults(
  results: DelegationResult[],
  baseState: SharedProjectState
): { state: SharedProjectState; message: string } {
  let state = { ...baseState };
  const messages: string[] = [];

  for (const delegation of results) {
    if (!isSuccessfulResult(delegation.result)) {
      messages.push(`${delegation.subagent}: ${delegation.result.error}`);
      continue;
    }

    const result = delegation.result;

    // Merge Story Agent results
    if ('stateUpdates' in result) {
      state = mergeProjectState(state, result.stateUpdates);
      if ('narrative' in result && result.narrative?.title) {
        state.title = result.narrative.title;
      }
      if ('narrative' in result && result.narrative?.description) {
        state.description = result.narrative.description;
      }
    }

    // Merge Design Agent results
    if ('heroImageId' in result && result.heroImageId) {
      state.heroImageId = result.heroImageId;
    }

    // Collect Quality Agent message
    if ('summaryMessage' in result) {
      messages.push(result.summaryMessage);
    }
  }

  return {
    state,
    message: messages.join('\n\n'),
  };
}

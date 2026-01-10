import type { SharedProjectState } from '../types';
import {
  spawnSubagent,
  spawnParallel,
  mergeSubagentResults,
  isSuccessfulResult,
  type SubagentContext,
  type DelegationResult,
  type StoryAgentResult,
  type DesignAgentResult,
  type QualityAgentResult,
} from '../subagents';
import type { DelegationContext, OrchestratorAction, OrchestratorResult } from './types';
import { mergeProjectState } from './state';
import { logger } from '@/lib/logging';

export async function delegateToStoryAgent(
  context: DelegationContext
): Promise<OrchestratorResult> {
  const startTime = Date.now();

  const subagentContext: SubagentContext = {
    projectState: context.state,
    userMessage: context.message,
    images: context.images,
    businessContext: context.businessContext,
  };

  const result = await spawnSubagent('story', subagentContext);

  const delegationResult: DelegationResult = {
    subagent: 'story',
    result,
    durationMs: Date.now() - startTime,
    wasParallel: false,
  };

  if (!isSuccessfulResult(result)) {
    return {
      state: context.state,
      actions: [{ type: 'delegate', subagent: 'story', result: delegationResult }],
      message: result.error || 'Story extraction failed',
      error: { message: result.error || 'Unknown error', retryable: result.retryable ?? true },
    };
  }

  const storyResult = result as StoryAgentResult;
  // Use nullish coalescing to handle undefined stateUpdates safely
  // Prevents crashes when AI response is malformed or missing stateUpdates
  const newState = mergeProjectState(context.state, storyResult.stateUpdates ?? {});

  if (storyResult.narrative) {
    if (storyResult.narrative.title) newState.title = storyResult.narrative.title;
    if (storyResult.narrative.description) newState.description = storyResult.narrative.description;
  }

  const actions: OrchestratorAction[] = [
    { type: 'delegate', subagent: 'story', result: delegationResult },
  ];

  switch (storyResult.checkpoint) {
    case 'images_uploaded':
      break;
    case 'basic_info': {
      const hasContextImages = context.images && context.images.length > 0;
      const hasStateImages = context.state.images.length > 0;
      if (!hasContextImages && !hasStateImages) {
        actions.push({ type: 'prompt_images' });
      }
      break;
    }
    case 'story_complete':
      actions.push({ type: 'compose_layout' });
      break;
  }

  return {
    state: newState,
    actions,
    message: storyResult.followUpQuestion,
  };
}

export async function delegateToDesignAgent(
  context: DelegationContext,
  feedback?: string
): Promise<OrchestratorResult> {
  const startTime = Date.now();

  const subagentContext: SubagentContext = {
    projectState: context.state,
    feedback,
    businessContext: context.businessContext,
  };

  const result = await spawnSubagent('design', subagentContext);

  const delegationResult: DelegationResult = {
    subagent: 'design',
    result,
    durationMs: Date.now() - startTime,
    wasParallel: false,
  };

  if (!isSuccessfulResult(result)) {
    return {
      state: context.state,
      actions: [{ type: 'delegate', subagent: 'design', result: delegationResult }],
      message: result.error || 'Design composition failed',
      error: { message: result.error || 'Unknown error', retryable: result.retryable ?? true },
    };
  }

  const designResult = result as DesignAgentResult;

  const newState = { ...context.state };
  if (designResult.heroImageId) {
    newState.heroImageId = designResult.heroImageId;
  }

  return {
    state: newState,
    actions: [{ type: 'delegate', subagent: 'design', result: delegationResult }],
  };
}

export async function delegateToQualityAgent(
  context: DelegationContext
): Promise<OrchestratorResult> {
  const startTime = Date.now();

  const subagentContext: SubagentContext = {
    projectState: context.state,
    businessContext: context.businessContext,
  };

  const result = await spawnSubagent('quality', subagentContext);

  const delegationResult: DelegationResult = {
    subagent: 'quality',
    result,
    durationMs: Date.now() - startTime,
    wasParallel: false,
  };

  if (!isSuccessfulResult(result)) {
    return {
      state: context.state,
      actions: [
        { type: 'delegate', subagent: 'quality', result: delegationResult },
      ],
      message: 'Quality check unavailable. You can still publish if you\'re ready.',
      error: { message: result.error || 'Quality check failed', retryable: result.retryable ?? true },
    };
  }

  const qualityResult = result as QualityAgentResult;

  const newState = {
    ...context.state,
    readyToPublish: true,
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

export async function delegateParallel(
  context: DelegationContext
): Promise<OrchestratorResult> {
  const startTime = Date.now();

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

  const results = await spawnParallel([
    { subagent: 'story', context: storyContext },
    { subagent: 'design', context: designContext },
  ]);

  logger.info(
    `[Orchestrator] Parallel delegation completed in ${Date.now() - startTime}ms`
  );

  const mergedState = mergeSubagentResults(context.state, results);

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

    if ('stateUpdates' in result && result.stateUpdates) {
      state = mergeProjectState(state, result.stateUpdates ?? {});
      if ('narrative' in result && result.narrative?.title) {
        state.title = result.narrative.title;
      }
      if ('narrative' in result && result.narrative?.description) {
        state.description = result.narrative.description;
      }
    }

    if ('heroImageId' in result && result.heroImageId) {
      state.heroImageId = result.heroImageId;
    }

    if ('summaryMessage' in result) {
      messages.push(result.summaryMessage);
    }
  }

  return {
    state,
    message: messages.join('\n\n'),
  };
}

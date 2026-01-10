/**
 * Shared tool configuration for chat + live voice sessions.
 */

export const FAST_TURN_TOOLS = [
  'extractProjectData',
  'requestClarification',
  'promptForImages',
  'showPortfolioPreview',
  'suggestQuickActions',
  'updateField',
  'regenerateSection',
  'reorderImages',
  'validateForPublish',
  'checkPublishReady', // Moved from DEEP - cheap validation check
  'updateContractorProfile', // Update business info
] as const;

export const DEEP_CONTEXT_TOOLS = [
  'generatePortfolioContent',
  'composePortfolioLayout',
  'composeUILayout',
  'processParallel', // Phase 10: Parallel Story + Design execution
] as const;

export type AllowedToolName =
  | (typeof FAST_TURN_TOOLS)[number]
  | (typeof DEEP_CONTEXT_TOOLS)[number];

export { createChatToolExecutors } from '@/lib/chat/tool-executors';
export type { ToolExecutors } from '@/lib/chat/tool-executors';

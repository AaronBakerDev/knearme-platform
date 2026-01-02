/**
 * Multi-Agent System Exports
 *
 * ARCHITECTURE: Orchestrator + Subagents Pattern
 *
 * Account Manager (orchestrator) coordinates specialist subagents:
 * - Story Agent: Conversation, images, narrative (story-extractor.ts)
 * - Design Agent: Layout, tokens, preview (ui-composer.ts)
 * - Quality Agent: Assessment, advisory (quality-checker.ts)
 *
 * @see /.claude/skills/agent-atlas/references/AGENT-PERSONAS.md
 * @see /todo/ai-sdk-phase-10-persona-agents.md
 */

// Types
export type {
  SharedProjectState,
  ProjectImageState,
  StoryExtractionResult,
  ContentGenerationResult,
  QualityCheckResult,
} from './types';

export {
  createEmptyProjectState,
  PUBLISH_REQUIREMENTS,
  PUBLISH_RECOMMENDATIONS,
} from './types';

// Agents
export { generateContent, type ContentGenerationError } from './content-generator';
export { composePortfolioLayout } from './layout-composer';
export {
  composeUI,
  type UIComposerOptions,
  type UIComposerResult,
} from './ui-composer';

export {
  extractStory,
  checkReadyForImages,
  countWords,
  normalizeProjectType,
  getMissingFields,
  getExtractionProgress,
  type ProjectType,
} from './story-extractor';

// Note: VALID_PROJECT_TYPES removed - now derived dynamically from TradeConfig
// Use getTradeConfig().terminology.projectTypes for valid project types

export {
  checkQuality,
  formatQualityCheckSummary,
  getTopPriority,
} from './quality-checker';

// Orchestrator (wire into chat route)
export {
  orchestrate,
  determinePhase,
  mergeProjectState,
  // New delegation-based functions (Phase 10)
  delegateToStoryAgent,
  delegateToDesignAgent,
  delegateToQualityAgent,
  delegateParallel,
  synthesizeResults,
  type OrchestratorAction,
  type OrchestratorResult,
  type OrchestratorContext,
  type DelegationContext,
  type PhaseHint,
} from './orchestrator';

// Subagent infrastructure (Phase 10)
export * from './subagents';

// Discovery Agent (onboarding)
export {
  runDiscoveryAgent,
  createEmptyDiscoveryState,
  isDiscoveryComplete,
  getMissingDiscoveryFields,
  getDiscoveryGreeting,
  type DiscoveryState,
  type DiscoveryResult,
  type DiscoveryContext,
} from './discovery';

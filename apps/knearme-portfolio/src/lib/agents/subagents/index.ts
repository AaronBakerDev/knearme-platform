/**
 * Subagent System Exports
 *
 * The subagent system implements the Orchestrator + Subagents pattern
 * from the Claude Agent SDK architecture guide.
 *
 * Architecture:
 * - Account Manager (orchestrator) coordinates specialists
 * - Story Agent: Conversation, image analysis, narrative
 * - Design Agent: Layout, tokens, visual composition
 * - Quality Agent: Assessment, advisory suggestions
 *
 * @see /todo/ai-sdk-phase-10-persona-agents.md
 * @see /.claude/skills/agent-builder/references/architectures.md
 */

// Types
export type {
  SubagentType,
  SubagentContext,
  SubagentResult,
  SubagentResultBase,
  StoryAgentResult,
  DesignAgentResult,
  QualityAgentResult,
  DelegationRequest,
  DelegationResult,
  SpawnOptions,
  OrchestrationResult,
  SubagentDefinition,
} from './types';

// Spawn infrastructure
export {
  spawnSubagent,
  spawnParallel,
  spawnSequential,
  isSuccessfulResult,
  getErrorMessage,
  mergeSubagentResults,
} from './spawn';

// Story Agent
export {
  STORY_AGENT_PROMPT,
  STORY_AGENT_SCHEMA,
  buildStoryAgentContext,
  isStoryAgentResult,
} from './story-agent';

// Design Agent
export {
  DESIGN_AGENT_PROMPT,
  DESIGN_AGENT_SCHEMA,
  buildDesignAgentContext,
  isDesignAgentResult,
} from './design-agent';

// Quality Agent
export {
  QUALITY_AGENT_PROMPT,
  QUALITY_AGENT_SCHEMA,
  buildQualityAgentContext,
  isQualityAgentResult,
} from './quality-agent';

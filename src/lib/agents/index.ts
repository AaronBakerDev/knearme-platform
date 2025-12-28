/**
 * Multi-Agent System Exports
 *
 * @see /docs/09-agent/multi-agent-architecture.md
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

export {
  extractStory,
  checkReadyForImages,
  countWords,
  normalizeProjectType,
  getMissingFields,
  getExtractionProgress,
  VALID_PROJECT_TYPES,
  type ProjectType,
} from './story-extractor';

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
  type OrchestratorAction,
  type OrchestratorResult,
  type OrchestratorContext,
} from './orchestrator';

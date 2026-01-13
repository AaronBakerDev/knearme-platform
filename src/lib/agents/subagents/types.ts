/**
 * Subagent System Types
 *
 * Defines the types for the orchestrator + subagents architecture.
 * The Account Manager (orchestrator) delegates complex work to specialized
 * subagents, each with focused expertise and tools.
 *
 * Architecture:
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    ACCOUNT MANAGER                          │
 * │              User-facing • Coordinates specialists          │
 * └───────────────────────────┬─────────────────────────────────┘
 *                             │
 *         ┌───────────────────┼───────────────────┐
 *         ▼                   ▼                   ▼
 *   ┌───────────┐      ┌───────────┐      ┌───────────┐
 *   │   STORY   │      │  DESIGN   │      │  QUALITY  │
 *   │   AGENT   │      │   AGENT   │      │   AGENT   │
 *   └───────────┘      └───────────┘      └───────────┘
 * ```
 *
 * @see /todo/ai-sdk-phase-10-persona-agents.md
 * @see /.claude/skills/agent-builder/references/architectures.md
 */

import type { SharedProjectState, ProjectImageState } from '../types';

// ============================================================================
// Subagent Identifiers
// ============================================================================

/**
 * Available subagent types.
 *
 * Each subagent has a focused area of expertise:
 * - story: Conversation, image analysis, narrative extraction
 * - design: Layout tokens, composition, preview generation
 * - quality: Contextual assessment, advisory suggestions
 */
export type SubagentType = 'story' | 'design' | 'quality';

// ============================================================================
// Subagent Context
// ============================================================================

/**
 * Context passed to a subagent when spawned.
 * Contains everything the subagent needs to do its work.
 */
export interface SubagentContext {
  /** Current project state (read from, write to) */
  projectState: SharedProjectState;

  /** The user's latest message (if relevant) */
  userMessage?: string;

  /** Images to analyze (for Story Agent) */
  images?: ProjectImageState[];

  /** Feedback for iteration (for Design Agent) */
  feedback?: string;

  /** Areas to focus on (for Design Agent) */
  focusAreas?: string[];

  /** Elements to preserve during iteration (for Design Agent) */
  preserveElements?: string[];

  /** Business context for appropriate standards (for Quality Agent) */
  businessContext?: {
    name?: string;
    type?: string;
    voice?: 'formal' | 'casual' | 'technical';
  };
}

// ============================================================================
// Subagent Results
// ============================================================================

/**
 * Base result structure for all subagents.
 */
export interface SubagentResultBase {
  /** Whether the subagent completed successfully */
  success: boolean;

  /** Error message if failed */
  error?: string;

  /** Whether the error is retryable */
  retryable?: boolean;

  /** Confidence score (0-1) for the result */
  confidence: number;
}

/**
 * Result from the Story Agent.
 *
 * Handles conversation, image analysis, and narrative extraction.
 */
export interface StoryAgentResult extends SubagentResultBase {
  /** Updated project state fields */
  stateUpdates: Partial<SharedProjectState>;

  /** Extracted narrative content */
  narrative?: {
    title?: string;
    description?: string;
    story?: string;
  };

  /** Image analysis results */
  imageAnalysis?: {
    /** What the images show */
    observations: string[];
    /** Suggested image organization */
    suggestedOrder?: string[];
    /** Detected before/after pairs */
    beforeAfterPairs?: Array<{ before: string; after: string }>;
    /** Recommended hero image */
    heroImageId?: string;
  };

  /** Checkpoint signal for orchestrator */
  checkpoint?: 'images_uploaded' | 'basic_info' | 'story_complete';

  /** Follow-up question to ask (if needed) */
  followUpQuestion?: string;
}

/**
 * Result from the Design Agent.
 *
 * Handles layout composition, design tokens, and preview generation.
 */
export interface DesignAgentResult extends SubagentResultBase {
  /** Design tokens for the portfolio */
  designTokens?: {
    layout: 'hero-gallery' | 'split-image' | 'masonry-grid' | 'full-bleed' | 'cards';
    spacing: 'compact' | 'comfortable' | 'spacious';
    typography: {
      headingStyle: 'bold' | 'elegant' | 'industrial' | 'warm';
      bodySize: 'sm' | 'base' | 'lg';
    };
    colors: {
      accent: 'primary' | 'earth' | 'slate' | 'copper' | 'forest';
      background: 'light' | 'warm' | 'dark';
    };
    imageDisplay: 'rounded' | 'sharp' | 'shadowed' | 'framed';
    heroStyle: 'large-single' | 'grid-3' | 'side-by-side' | 'carousel';
  };

  /** Semantic blocks for content layout */
  blocks?: Array<{
    type: string;
    [key: string]: unknown;
  }>;

  /** Rationale for design choices */
  rationale?: string;

  /** Selected hero image ID */
  heroImageId?: string;
}

/**
 * Result from the Quality Agent.
 *
 * Handles contextual assessment and advisory suggestions.
 * IMPORTANT: Advisory only - never blocking.
 */
export interface QualityAgentResult extends SubagentResultBase {
  /** Overall assessment */
  assessment: {
    /** Whether the portfolio is ready to publish */
    ready: boolean;
    /** Confidence in readiness assessment */
    confidence: 'high' | 'medium' | 'low';
    /** Contextual checks performed */
    checksPerformed: string[];
  };

  /** Advisory suggestions (never blocking) */
  suggestions: Array<{
    /** What to improve */
    area: string;
    /** Specific suggestion */
    suggestion: string;
    /** Priority level */
    priority: 'high' | 'medium' | 'low';
    /** Business context for why this matters */
    reason?: string;
  }>;

  /** Summary message for the user */
  summaryMessage: string;

  /** Whether user chose to "publish anyway" despite suggestions */
  publishAnyway?: boolean;
}

/**
 * Union type for all subagent results.
 */
export type SubagentResult = StoryAgentResult | DesignAgentResult | QualityAgentResult;

// ============================================================================
// Delegation Types
// ============================================================================

/**
 * Request to delegate work to a subagent.
 */
export interface DelegationRequest {
  /** Which subagent to invoke */
  subagent: SubagentType;

  /** Context for the subagent */
  context: SubagentContext;

  /** Priority hint (for parallel execution ordering) */
  priority?: 'high' | 'normal' | 'low';

  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Result of a delegation request.
 */
export interface DelegationResult {
  /** Which subagent was invoked */
  subagent: SubagentType;

  /** The subagent's result */
  result: SubagentResult;

  /** Time taken in milliseconds */
  durationMs: number;

  /** Whether the subagent was invoked in parallel with others */
  wasParallel: boolean;
}

/**
 * Options for spawning a subagent.
 */
export interface SpawnOptions {
  /** Override the default model (Gemini 2.0 Flash) */
  model?: string;

  /** Temperature override (default varies by agent type) */
  temperature?: number;

  /** Max output tokens (default: 2048) */
  maxOutputTokens?: number;

  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;

  /**
   * Correlation context for observability.
   * Links subagent traces to parent conversation trace.
   * @see /docs/philosophy/operational-excellence.md - Observability Strategy
   */
  correlationContext?: {
    conversationId: string;
    requestTraceId: string;
    agentSpanId?: string;
    projectId?: string;
    contractorId: string;
  };
}

// ============================================================================
// Orchestration Types
// ============================================================================

/**
 * Synthesized result from the orchestrator after subagent delegation.
 */
export interface OrchestrationResult {
  /** Updated project state (merged from all subagent results) */
  updatedState: SharedProjectState;

  /** Results from each invoked subagent */
  subagentResults: DelegationResult[];

  /** Synthesized response message for the user */
  responseMessage: string;

  /** Suggested next actions */
  suggestedActions?: string[];

  /** Current checkpoint in the workflow */
  checkpoint?: string;

  /** Whether ready to publish */
  readyToPublish: boolean;
}

/**
 * Subagent definition for registration.
 */
export interface SubagentDefinition {
  /** Unique identifier */
  type: SubagentType;

  /** Human-readable name */
  name: string;

  /** Description of expertise */
  description: string;

  /** System prompt for the subagent */
  systemPrompt: string;

  /** Default temperature */
  temperature: number;

  /** When to delegate to this subagent */
  delegationCriteria: string[];
}

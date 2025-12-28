/**
 * Multi-Agent System Types
 *
 * Defines the shared state and interfaces for the agent-based
 * portfolio creation system.
 *
 * Architecture:
 * - Account Manager persona (chat prompt)
 * - Story Extractor: Extracts structured data during tool execution
 * - Orchestrator: Coordinates phases and readiness
 * - Content Generator: Creates title, description, SEO
 * - Quality Checker: Validates publish requirements
 *
 * @see /docs/09-agent/multi-agent-architecture.md
 */

// ============================================================================
// Shared Project State
// ============================================================================

/**
 * Shared state that all agents read from and write to.
 * This is the single source of truth for the project being created.
 */
export interface SharedProjectState {
  // --------------------------------------------------------------------------
  // Extracted Data (from contractor conversation)
  // --------------------------------------------------------------------------

  /** Project type (e.g., "chimney-rebuild", "tuckpointing") */
  projectType?: string;

  /** Project type slug stored in the database */
  projectTypeSlug?: string;

  /** Customer's problem/need that led to the project */
  customerProblem?: string;

  /** How the contractor solved the problem */
  solutionApproach?: string;

  /** Materials used in the project */
  materials: string[];

  /** Techniques applied */
  techniques: string[];

  /** Project city */
  city?: string;

  /** Project state/province */
  state?: string;

  /** Project location (city, neighborhood) */
  location?: string;

  /** Project duration */
  duration?: string;

  /** What the contractor is most proud of */
  proudOf?: string;

  // --------------------------------------------------------------------------
  // Generated Content (by AI)
  // --------------------------------------------------------------------------

  /** Project title (60 chars max) */
  title?: string;

  /** Suggested title before user confirmation */
  suggestedTitle?: string;

  /** Project description (structured blocks or plain text) */
  description?: string;

  /** SEO-optimized page title */
  seoTitle?: string;

  /** SEO meta description (160 chars max) */
  seoDescription?: string;

  /** Tags for categorization */
  tags: string[];

  // --------------------------------------------------------------------------
  // Images
  // --------------------------------------------------------------------------

  /** Uploaded project images */
  images: ProjectImageState[];

  /** ID of the hero image */
  heroImageId?: string;

  // --------------------------------------------------------------------------
  // State Flags
  // --------------------------------------------------------------------------

  /** True when we have enough story data to ask for images */
  readyForImages: boolean;

  /** True when we have enough data to generate content */
  readyForContent: boolean;

  /** True when all publish requirements are met */
  readyToPublish: boolean;

  // --------------------------------------------------------------------------
  // Clarification Tracking
  // --------------------------------------------------------------------------

  /** Fields that need user clarification */
  needsClarification: string[];

  /** Fields that have been clarified */
  clarifiedFields: string[];
}

/**
 * Image state within the shared project state.
 */
export interface ProjectImageState {
  id: string;
  url: string;
  filename?: string;
  imageType?: 'before' | 'after' | 'progress' | 'detail';
  altText?: string;
  displayOrder: number;
}

/**
 * Create an empty shared project state.
 */
export function createEmptyProjectState(): SharedProjectState {
 return {
    materials: [],
    techniques: [],
    tags: [],
    images: [],
    readyForImages: false,
    readyForContent: false,
    readyToPublish: false,
    needsClarification: [],
    clarifiedFields: [],
  };
}

// ============================================================================
// Agent Interfaces
// ============================================================================

/**
 * Result from the Story Extractor agent.
 */
export interface StoryExtractionResult {
  /** Updated project state with extracted data */
  state: Partial<SharedProjectState>;

  /** Fields that need clarification */
  needsClarification: string[];

  /** Confidence scores for extracted fields (0-1) */
  confidence: Record<string, number>;

  /** Whether we have enough data to proceed to images */
  readyForImages: boolean;
}

/**
 * Result from the Content Generator agent.
 */
export interface ContentGenerationResult {
  /** Generated title */
  title: string;

  /** Generated description (plain text or structured) */
  description: string;

  /** Generated SEO title */
  seoTitle: string;

  /** Generated SEO description */
  seoDescription: string;

  /** Generated tags */
  tags: string[];
}

/**
 * Result from the Quality Checker agent.
 */
export interface QualityCheckResult {
  /** Whether the project is ready to publish */
  ready: boolean;

  /** Fields that are missing or incomplete */
  missing: string[];

  /** Fields that could be improved (warnings) */
  warnings: string[];

  /** Suggestions for improvement */
  suggestions: string[];
}

// ============================================================================
// Publish Requirements
// ============================================================================

/**
 * Hard requirements that must be met before publishing.
 * Based on analysis of /src/app/api/projects/[id]/publish/route.ts
 */
export const PUBLISH_REQUIREMENTS = {
  /** Required fields that must have values */
  required: [
    'title',
    'project_type',
    'project_type_slug',
    'city',
    'state',
  ] as const,

  /** Minimum number of images */
  minImages: 1,

  /** Must have a hero image selected */
  requireHeroImage: true,
} as const;

/**
 * Recommended but not required for publishing.
 */
export const PUBLISH_RECOMMENDATIONS = {
  /** Recommended minimum description length */
  minDescriptionWords: 200,

  /** Recommended number of materials */
  minMaterials: 2,

  /** Recommended to have tags */
  hasTags: true,

  /** Recommended to have SEO metadata */
  hasSeoMetadata: true,
} as const;

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
  // Extracted Data (from user conversation)
  // --------------------------------------------------------------------------

  /** Project type (e.g., "chimney-rebuild", "tuckpointing") */
  projectType?: string;

  /** Project type slug stored in the database */
  projectTypeSlug?: string;

  /** Customer's problem/need that led to the project */
  customerProblem?: string;

  /** How the business owner solved the problem */
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

  /** What the business owner is most proud of */
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
  storagePath?: string;
  bucket?: 'project-images' | 'project-images-draft';
  filename?: string;
  imageType?: 'before' | 'after' | 'progress' | 'detail';
  altText?: string;
  displayOrder: number;
}

/**
 * Group images by their type (before, after, progress, detail, other).
 * Returns both counts and IDs for flexibility.
 */
export function groupImagesByType(images: ProjectImageState[]): {
  byType: Record<string, { count: number; ids: string[] }>;
  total: number;
} {
  const byType: Record<string, { count: number; ids: string[] }> = {};

  for (const img of images) {
    const type = img.imageType || 'other';
    if (!byType[type]) {
      byType[type] = { count: 0, ids: [] };
    }
    byType[type].count++;
    byType[type].ids.push(img.id);
  }

  return { byType, total: images.length };
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
// Publish Recommendations (Warnings Only)
// ============================================================================
//
// PHILOSOPHY: The user decides when to publish, not arbitrary rules.
// These are RECOMMENDATIONS that show warnings, not gates that block.
// The API will warn but not reject. User can always override.
//
// @see /docs/philosophy/agent-philosophy.md
// ============================================================================

/**
 * @deprecated Use PUBLISH_RECOMMENDATIONS instead.
 * Kept for backwards compatibility during migration.
 * All "requirements" are now just recommendations that show warnings.
 */
export const PUBLISH_REQUIREMENTS = {
  /** Fields that SHOULD have values (warning if missing, not blocking) */
  required: [] as const, // EMPTIED - nothing is truly required anymore

  /** Recommended number of images (warning if missing) */
  minImages: 0, // CHANGED from 1 - user decides

  /** Hero image recommended but not required */
  requireHeroImage: false, // CHANGED from true - user decides
} as const;

/**
 * Recommendations that show helpful warnings but never block.
 * The model explains these in conversation. User always has final say.
 */
export const PUBLISH_RECOMMENDATIONS = {
  /** Fields that improve discoverability if present */
  suggestedFields: [
    'title',
    'project_type',
    'city',
    'state',
  ] as const,

  /** Recommended minimum description length */
  minDescriptionWords: 200,

  /** Recommended number of images for best results */
  suggestedImages: 1,

  /** Recommended number of materials */
  minMaterials: 2,

  /** Recommended to have tags */
  hasTags: true,

  /** Recommended to have SEO metadata */
  hasSeoMetadata: true,

  /** Hero image improves visual appeal */
  suggestHeroImage: true,
} as const;

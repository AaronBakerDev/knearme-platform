/**
 * Typed tool schemas for chat-based AI interactions.
 *
 * This module centralizes all tool input/output schemas with proper TypeScript
 * type inference. Tools use these schemas for:
 * 1. Input validation (Zod runtime checks)
 * 2. Type inference (TypeScript compile-time checks)
 * 3. Documentation (schema descriptions)
 *
 * ## Usage Pattern
 *
 * ```typescript
 * import { extractProjectDataSchema, type ExtractProjectDataInput } from '@/lib/chat/tool-schemas';
 *
 * const myTool = tool({
 *   description: '...',
 *   inputSchema: extractProjectDataSchema,
 *   execute: async (args: ExtractProjectDataInput): Promise<ExtractProjectDataOutput> => {
 *     return args;
 *   },
 * });
 * ```
 *
 * @see /src/app/api/chat/route.ts - Unified chat route tools
 * @see /src/app/api/chat/edit/route.ts - Legacy edit route (forwards to unified chat)
 * @see /src/lib/chat/chat-types.ts - Related type definitions
 */

import { z } from 'zod';
import { descriptionBlocksSchema } from '@/lib/content/description-blocks';
import { DesignTokenSchema } from '@/lib/design/tokens';
import { SemanticBlocksSchema } from '@/lib/design/semantic-blocks';

// ============================================================================
// Create Mode Tools (Main Chat Route)
// ============================================================================

/**
 * Schema for extracting project data from conversation.
 * Called by the model when it detects relevant information.
 *
 * IMPORTANT: city and state are recommended for publishing.
 * Extract location as separate city and state fields when available.
 * @see /src/app/api/projects/[id]/publish/route.ts
 */
export const extractProjectDataSchema = z.object({
  project_type: z
    .string()
    .optional()
    .describe('Type of project based on the work described'),
  customer_problem: z
    .string()
    .optional()
    .describe('What issue or need the customer had'),
  solution_approach: z
    .string()
    .optional()
    .describe('How the contractor solved the problem'),
  materials_mentioned: z
    .array(z.string())
    .optional()
    .describe('Materials mentioned (if any)'),
  techniques_mentioned: z
    .array(z.string())
    .optional()
    .describe('Techniques or methods used'),
  duration: z
    .string()
    .optional()
    .describe('How long the project took'),
  city: z
    .string()
    .optional()
    .describe('Recommended: City where project was done. Extract from any location mention.'),
  state: z
    .string()
    .optional()
    .describe('Recommended: State or province abbreviation (e.g., "CO", "ON", "CA"). Extract from any location mention.'),
  location: z
    .string()
    .optional()
    .describe('DEPRECATED - Use city and state fields instead. Only use if city/state cannot be determined separately.'),
  challenges: z
    .string()
    .optional()
    .describe('Any challenges or difficulties faced'),
  proud_of: z
    .string()
    .optional()
    .describe('What the contractor is most proud of about this work'),
  // PHILOSOPHY: ready_for_images is deprecated. Users can upload images anytime.
  // Kept for backwards compatibility with existing sessions.
  // @see /docs/philosophy/agent-philosophy.md
  ready_for_images: z
    .boolean()
    .optional()
    .describe('DEPRECATED - set true only if asking for photos next feels helpful.'),
});

/** Input type for extractProjectData tool */
export type ExtractProjectDataInput = z.infer<typeof extractProjectDataSchema>;
/** Output type for extractProjectData tool (returns same as input) */
export type ExtractProjectDataOutput = ExtractProjectDataInput;

/**
 * Schema for prompting image upload.
 * Displays an inline image gallery artifact.
 */
export const promptForImagesSchema = z.object({
  existingCount: z.number().default(0).describe('Number of images already uploaded'),
  suggestedCategories: z
    .array(z.string())
    .optional()
    .describe('Suggested photo categories based on the work (e.g., before, after, detail, process, gallery)'),
  message: z.string().optional().describe('Optional message to display with the upload prompt'),
});

/** Input type for promptForImages tool */
export type PromptForImagesInput = z.infer<typeof promptForImagesSchema>;
/** Output type for promptForImages tool */
export type PromptForImagesOutput = PromptForImagesInput;

/**
 * Schema for showing portfolio preview.
 * Updates the live preview canvas with current data.
 */
export const showPortfolioPreviewSchema = z.object({
  title: z.string().optional().describe('Suggested portfolio title'),
  message: z.string().optional().describe('Optional message about the preview update'),
  highlightFields: z
    .array(z.string())
    .optional()
    .describe('Fields to highlight as recently updated (e.g., ["materials", "photos"])'),
});

/** Input type for showPortfolioPreview tool */
export type ShowPortfolioPreviewInput = z.infer<typeof showPortfolioPreviewSchema>;
/** Output type for showPortfolioPreview tool */
export type ShowPortfolioPreviewOutput = ShowPortfolioPreviewInput;

/**
 * Schema for updating structured description blocks.
 * Used in edit mode when the model outputs block-based content.
 */
export const updateDescriptionBlocksSchema = z.object({
  blocks: descriptionBlocksSchema.describe('Structured description blocks'),
  reason: z.string().optional().describe('Brief explanation of the update'),
});

export type UpdateDescriptionBlocksInput = z.infer<typeof updateDescriptionBlocksSchema>;
export type UpdateDescriptionBlocksOutput = UpdateDescriptionBlocksInput;

/**
 * Schema for showing content editor.
 * Displays generated content in an inline editor for review/editing.
 */
export const showContentEditorSchema = z.object({
  title: z.string().describe('Generated or current title'),
  description: z.string().describe('Generated or current description (HTML allowed)'),
  seo_title: z.string().optional().describe('SEO title'),
  seo_description: z.string().optional().describe('SEO description'),
  tags: z.array(z.string()).optional().describe('Tags for categorization'),
  materials: z.array(z.string()).optional().describe('Materials used'),
  techniques: z.array(z.string()).optional().describe('Techniques demonstrated'),
  editable: z.boolean().default(true).describe('Whether the editor allows edits'),
});

/** Input type for showContentEditor tool */
export type ShowContentEditorInput = z.infer<typeof showContentEditorSchema>;
/** Output type for showContentEditor tool */
export type ShowContentEditorOutput = ShowContentEditorInput;

/**
 * Schema for requesting clarification.
 * Displays an interactive card when AI is uncertain.
 */
export const requestClarificationSchema = z.object({
  field: z.string().describe('The field being clarified (e.g., "project_type", "materials")'),
  currentValue: z.string().optional().describe('Your current best guess for the value'),
  alternatives: z
    .array(z.string())
    .optional()
    .describe('Alternative values the user might mean (2-4 options)'),
  question: z.string().describe('The clarification question to ask'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Your confidence level (0-1) in the current understanding'),
  context: z.string().optional().describe('Brief explanation of why clarification is needed'),
});

/** Input type for requestClarification tool */
export type RequestClarificationInput = z.infer<typeof requestClarificationSchema>;
/** Output type for requestClarification tool */
export type RequestClarificationOutput = RequestClarificationInput;

/**
 * Schema for suggesting quick action chips in the chat UI.
 * This is a UI-only hint to help the user take the next step.
 */
export const suggestQuickActionsSchema = z.object({
  actions: z
    .array(
      z.object({
        label: z.string().describe('Short label for the chip'),
        type: z
          .string()
          .describe('Action type (use existing UI types when possible, but any relevant action is allowed)'),
        value: z.string().optional().describe('Prefilled text for insert-type actions'),
      })
    )
    .max(5)
    .describe('Up to 5 quick actions to show'),
  reason: z
    .string()
    .optional()
    .describe('Optional reason for debugging or analytics'),
});

/** Input type for suggestQuickActions tool */
export type SuggestQuickActionsInput = z.infer<typeof suggestQuickActionsSchema>;
/** Output type for suggestQuickActions tool */
export type SuggestQuickActionsOutput = SuggestQuickActionsInput;

// ============================================================================
// Agent-Powered Tools (Orchestrator Integration)
// ============================================================================

/**
 * Schema for generating portfolio content using ContentGenerator agent.
 * Creates polished, SEO-optimized content from extracted project data.
 *
 * @see /src/lib/agents/content-generator.ts
 */
export const generatePortfolioContentSchema = z.object({
  forceRegenerate: z
    .boolean()
    .optional()
    .describe('Force regeneration even if content already exists'),
  focusAreas: z
    .array(z.string())
    .optional()
    .describe('Specific aspects to emphasize (e.g., ["craftsmanship", "materials", "historic"])'),
});

/**
 * Schema for parallel Story + Design agent execution.
 * Runs both agents simultaneously for faster initial layout after images.
 *
 * ARCHITECTURE: Orchestrator + Subagents Pattern
 * Story Agent extracts narrative while Design Agent composes initial layout.
 * Results are merged by the orchestrator for a coherent response.
 *
 * @see /todo/ai-sdk-phase-10-persona-agents.md
 * @see /src/lib/agents/orchestrator.ts delegateParallel()
 */
export const processParallelSchema = z.object({
  trigger: z
    .enum(['images_uploaded', 'content_ready', 'user_request'])
    .describe('What triggered the parallel processing'),
  userMessage: z
    .string()
    .optional()
    .describe('Optional user message to include in Story Agent context'),
  skipStory: z
    .boolean()
    .optional()
    .describe('Skip Story Agent if narrative is already complete'),
  skipDesign: z
    .boolean()
    .optional()
    .describe('Skip Design Agent if only story updates needed'),
});

/** Input type for processParallel tool */
export type ProcessParallelInput = z.infer<typeof processParallelSchema>;

/** Output type for processParallel tool */
export interface ProcessParallelOutput {
  success: boolean;
  /** Which agents were executed */
  agentsRun: ('story' | 'design')[];
  /** Story agent results if run */
  storyResult?: {
    title?: string;
    description?: string;
    checkpoint?: string;
    followUpQuestion?: string;
  };
  /** Design agent results if run */
  designResult?: {
    heroImageId?: string;
    layoutStyle?: string;
  };
  /** Combined duration of all agents */
  durationMs: number;
  /** Error if any agent failed */
  error?: string;
}

/** Input type for generatePortfolioContent tool */
export type GeneratePortfolioContentInput = z.infer<typeof generatePortfolioContentSchema>;

/** Output type for generatePortfolioContent tool */
export interface GeneratePortfolioContentOutput {
  success: boolean;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  error?: string;
  /**
   * True when the AI service is rate-limited or temporarily unavailable.
   * When rateLimited is true, success is also true to prevent AI model retries.
   * The UI should show the message and suggest the user try again manually.
   */
  rateLimited?: boolean;
  /** User-facing message explaining the situation (used with rateLimited) */
  message?: string;
}

/**
 * Schema for composing a portfolio layout using a Layout Composer agent.
 * Produces description blocks and optional image ordering guidance.
 *
 * @see /src/lib/content/description-blocks.ts
 */
export const composePortfolioLayoutSchema = z.object({
  goal: z
    .string()
    .optional()
    .describe('Optional guidance for layout focus (e.g., "before/after emphasis")'),
  focusAreas: z
    .array(z.string())
    .optional()
    .describe('Specific areas to emphasize (materials, process, results, timeline, craftsmanship)'),
  includeImageOrder: z
    .boolean()
    .optional()
    .describe('Whether to return a recommended image order for the gallery'),
});

/** Input type for composePortfolioLayout tool */
export type ComposePortfolioLayoutInput = z.infer<typeof composePortfolioLayoutSchema>;

/** Output type for composePortfolioLayout tool */
export interface ComposePortfolioLayoutOutput {
  /**
   * Description blocks must match the BlockEditor-supported schema:
   * paragraph, heading (level "2" | "3"), list, callout, stats, quote.
   */
  blocks: z.output<typeof descriptionBlocksSchema>;
  /**
   * Optional gallery ordering by image id. The first image is treated as hero.
   */
  imageOrder?: string[];
  /**
   * Hero image selection from Design Agent (Phase 10 - Subagent Architecture).
   * The Design Agent analyzes images and selects the most impactful hero.
   */
  heroImageId?: string;
  rationale?: string;
  missingContext?: string[];
  confidence?: number;
}

/**
 * Schema for composing a full UI layout using the UI Composer agent.
 * Produces design tokens and semantic blocks for rich portfolio rendering.
 *
 * @see /src/lib/agents/ui-composer.ts
 * @see /src/lib/design/tokens.ts
 * @see /src/lib/design/semantic-blocks.ts
 */
export const composeUILayoutInputSchema = z.object({
  feedback: z
    .string()
    .optional()
    .describe('User feedback for iterating on the layout (e.g., "make it more modern")'),
  focusAreas: z
    .array(z.string())
    .optional()
    .describe('Areas to focus on (e.g., ["hero", "gallery", "content"])'),
  preserveElements: z
    .array(z.string())
    .optional()
    .describe('Elements to keep unchanged during iteration'),
});

export const composeUILayoutOutputSchema = z.object({
  designTokens: DesignTokenSchema,
  blocks: SemanticBlocksSchema,
  rationale: z.string().describe('Why this layout fits the project'),
  confidence: z.number().min(0).max(1),
});

/** Input type for composeUILayout tool */
export type ComposeUILayoutInput = z.infer<typeof composeUILayoutInputSchema>;

/** Output type for composeUILayout tool */
export type ComposeUILayoutOutput = z.infer<typeof composeUILayoutOutputSchema>;

/**
 * Schema for checking publish readiness using QualityChecker agent.
 * Validates project meets all requirements and provides actionable feedback.
 *
 * @see /src/lib/agents/quality-checker.ts
 */
export const checkPublishReadySchema = z.object({
  showWarnings: z
    .boolean()
    .default(true)
    .describe('Include non-blocking recommendations in response'),
});

/** Input type for checkPublishReady tool */
export type CheckPublishReadyInput = z.infer<typeof checkPublishReadySchema>;

/** Output type for checkPublishReady tool */
export interface CheckPublishReadyOutput {
  ready: boolean;
  missing: string[];
  warnings: string[];
  suggestions: string[];
  topPriority: string | null;
  summary: string;
}

// ============================================================================
// Edit Mode Tools (Edit Chat Route)
// ============================================================================

/**
 * Editable field names for the updateField tool.
 * Includes location fields (city, state) for address updates.
 */
const updateFieldStringFields = [
  'title',
  'description',
  'seo_title',
  'seo_description',
  'project_type',
  'summary',
  'challenge',
  'solution',
  'results',
  'neighborhood',
  'duration',
  'client_type',
  'budget_range',
  'hero_image_id',
  'status',
  'city',
  'state',
] as const;

const updateFieldArrayFields = ['tags', 'materials', 'techniques', 'outcome_highlights'] as const;

export const editableFields = [
  ...updateFieldStringFields,
  ...updateFieldArrayFields,
] as const;

export type EditableField = (typeof editableFields)[number];

/**
 * Schema for updating a project field.
 * Called when user wants to change title, description, SEO, location, etc.
 */
// Use a discriminated union to enforce correct value types per field.
export const updateFieldSchema = z.discriminatedUnion('field', [
  z.object({
    field: z
      .enum(updateFieldStringFields)
      .describe('The field to update (use city/state for location changes)'),
    value: z
      .string()
      .max(5000)
      .describe('The new value for the field (string for text fields)'),
    reason: z
      .string()
      .max(500)
      .optional()
      .describe('Brief explanation of why this change was made'),
  }),
  z.object({
    field: z
      .enum(updateFieldArrayFields)
      .describe('The field to update (use arrays for tags/materials/techniques)'),
    value: z
      .array(z.string().max(100))
      .max(50)
      .describe('The new value for the field (array for tags/materials/techniques)'),
    reason: z
      .string()
      .max(500)
      .optional()
      .describe('Brief explanation of why this change was made'),
  }),
]);

/** Input type for updateField tool */
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;

/** Output type for updateField tool */
export interface UpdateFieldOutput {
  success: boolean;
  field: EditableField;
  value: string | string[];
  reason?: string;
}

/**
 * Regeneratable section names.
 */
export const regeneratableSections = ['title', 'description', 'seo'] as const;

export type RegeneratableSection = (typeof regeneratableSections)[number];

/**
 * Schema for regenerating content sections.
 * Called when user wants AI to rewrite content.
 */
export const regenerateSectionSchema = z.object({
  section: z
    .enum(['title', 'description', 'seo'])
    .describe('The section to regenerate'),
  guidance: z
    .string()
    .optional()
    .describe('Optional guidance for the regeneration (style, focus, length, etc.)'),
  preserveElements: z
    .array(z.string())
    .optional()
    .describe('Elements from the current content to preserve'),
});

/** Input type for regenerateSection tool */
export type RegenerateSectionInput = z.infer<typeof regenerateSectionSchema>;

/** Output type for regenerateSection tool */
export interface RegenerateSectionOutput {
  action: 'regenerate';
  section: RegeneratableSection;
  guidance?: string;
  preserveElements?: string[];
}

/**
 * Schema for reordering project images.
 * Changes the order of images (first becomes hero).
 */
export const reorderImagesSchema = z.object({
  imageIds: z
    .array(z.string())
    .describe('Image IDs in the new desired order'),
  reason: z
    .string()
    .optional()
    .describe('Reason for the reorder (e.g., "moved best photo to front")'),
});

/** Input type for reorderImages tool */
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;

/** Output type for reorderImages tool */
export interface ReorderImagesOutput {
  action: 'reorder';
  imageIds: string[];
  reason?: string;
}

/**
 * Validatable field names.
 */
export const validatableFields = ['title', 'description', 'images', 'seo'] as const;

export type ValidatableField = (typeof validatableFields)[number];

/**
 * Schema for validating publish readiness.
 * Checks if project meets publishing requirements.
 */
export const validateForPublishSchema = z.object({
  checkFields: z
    .array(z.enum(['title', 'description', 'images', 'seo']))
    .optional()
    .describe('Specific fields to validate (validates all if not provided)'),
});

/** Input type for validateForPublish tool */
export type ValidateForPublishInput = z.infer<typeof validateForPublishSchema>;

/** Output type for validateForPublish tool */
export interface ValidateForPublishOutput {
  action: 'validate';
  checkFields?: ValidatableField[];
}

// ============================================================================
// Business Profile Tools (Legacy name: Contractor)
// ============================================================================

/**
 * Editable business profile field names.
 * These map to columns in the businesses table.
 *
 * Note: Variables and types still use "contractor" naming for schema compatibility.
 * The tool executor implementation uses the `businesses` table internally.
 * @see /src/lib/chat/tools-runtime.ts updateContractorProfile executor
 */
const contractorProfileStringFields = [
  // Business-first fields
  'name',
  'slug',
  // Legacy contractor fields (still accepted for compatibility)
  'business_name',
  'profile_slug',
  'address',
  'postal_code',
  'phone',
  'city',
  'state',
  'description',
  'email',
  'website',
] as const;

const contractorProfileArrayFields = ['services', 'service_areas'] as const;

export const contractorProfileFields = [
  ...contractorProfileStringFields,
  ...contractorProfileArrayFields,
] as const;

export type ContractorProfileField = (typeof contractorProfileFields)[number];

/**
 * Schema for updating business profile fields.
 * Allows the agent to update business information during conversation.
 *
 * @see /src/app/api/businesses/me/route.ts (canonical)
 * @see /src/app/api/contractors/me/route.ts (legacy, still supported)
 */
// Use a discriminated union to keep field/value types aligned and bounded.
export const updateContractorProfileSchema = z.discriminatedUnion('field', [
  z.object({
    field: z
      .enum(contractorProfileStringFields)
      .describe('The contractor profile field to update'),
    value: z
      .string()
      .max(2000)
      .describe('The new value (string for text fields)'),
    reason: z
      .string()
      .max(500)
      .optional()
      .describe('Brief explanation of why this update was made'),
  }),
  z.object({
    field: z
      .enum(contractorProfileArrayFields)
      .describe('The contractor profile field to update'),
    value: z
      .array(z.string().max(100))
      .max(50)
      .describe('The new value (array for services/service_areas)'),
    reason: z
      .string()
      .max(500)
      .optional()
      .describe('Brief explanation of why this update was made'),
  }),
]);

/** Input type for updateContractorProfile tool */
export type UpdateContractorProfileInput = z.infer<typeof updateContractorProfileSchema>;

/** Output type for updateContractorProfile tool */
export interface UpdateContractorProfileOutput {
  success: boolean;
  field: ContractorProfileField;
  value: string | string[];
  reason?: string;
  error?: string;
}

// ============================================================================
// MCP Portfolio Tool Schemas (Shared)
// ============================================================================

export const createProjectDraftSchema = z.object({
  title: z.string().optional(),
  project_type: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  summary: z.string().optional(),
  challenge: z.string().optional(),
  solution: z.string().optional(),
  results: z.string().optional(),
  outcome_highlights: z.array(z.string()).optional(),
});

export const addProjectMediaSchema = z
  .object({
    project_id: z.string().uuid(),
    files: z
      .array(
        z.object({
          file_id: z.string(),
          filename: z.string(),
          content_type: z.string(),
          image_type: z.enum(['before', 'after', 'progress', 'detail']).optional(),
          alt_text: z.string().optional(),
          display_order: z.number().int().min(0).optional(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
        })
      )
      .min(1)
      .max(10)
      .optional(),
    images: z
      .array(
        z.object({
          url: z.string().url(),
          filename: z.string().optional(),
          image_type: z.enum(['before', 'after', 'progress', 'detail']).optional(),
          alt_text: z.string().optional(),
        })
      )
      .min(1)
      .max(10)
      .optional(),
  })
  .refine((data) => (data.files && data.files.length > 0) || (data.images && data.images.length > 0), {
    message: 'files or images required',
  });

export const reorderProjectMediaSchema = z.object({
  project_id: z.string().uuid(),
  image_ids: z.array(z.string().uuid()),
});

export const setProjectHeroMediaSchema = z.object({
  project_id: z.string().uuid(),
  hero_image_id: z.string().uuid(),
});

export const setProjectMediaLabelsSchema = z.object({
  project_id: z.string().uuid(),
  labels: z.array(
    z.object({
      image_id: z.string().uuid(),
      image_type: z.enum(['before', 'after', 'progress', 'detail']).nullable().optional(),
      alt_text: z.string().nullable().optional(),
    })
  ),
});

export const updateProjectSectionsSchema = z.object({
  project_id: z.string().uuid(),
  summary: z.string().optional(),
  challenge: z.string().optional(),
  solution: z.string().optional(),
  results: z.string().optional(),
  outcome_highlights: z.array(z.string()).optional(),
});

export const updateProjectMetaSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().optional(),
  project_type: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  duration: z.string().optional(),
  tags: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  techniques: z.array(z.string()).optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
});

export const finalizeProjectSchema = z.object({
  project_id: z.string().uuid(),
});

/** Alias for publish_project tool (same schema as finalize) */
export const publishProjectSchema = finalizeProjectSchema;

/** Alias for unpublish_project tool (same schema as finalize) */
export const unpublishProjectSchema = finalizeProjectSchema;

export const listContractorProjectsSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  offset: z.number().int().min(0).optional(),
});

export const getProjectStatusSchema = z.object({
  project_id: z.string().uuid(),
});

// ============================================================================
// Tool Result Types (for artifact rendering)
// ============================================================================

/**
 * Union type of all tool output types.
 * Used by artifact renderers to type-check tool results.
 */
export type ToolOutput =
  | ExtractProjectDataOutput
  | PromptForImagesOutput
  | ShowPortfolioPreviewOutput
  | ShowContentEditorOutput
  | RequestClarificationOutput
  | SuggestQuickActionsOutput
  | GeneratePortfolioContentOutput
  | ComposePortfolioLayoutOutput
  | ComposeUILayoutOutput
  | CheckPublishReadyOutput
  | UpdateFieldOutput
  | RegenerateSectionOutput
  | ReorderImagesOutput
  | ValidateForPublishOutput
  | UpdateContractorProfileOutput
  | ProcessParallelOutput;

/**
 * Tool name to output type mapping.
 * Enables type-safe artifact rendering.
 */
export interface ToolOutputMap {
  extractProjectData: ExtractProjectDataOutput;
  promptForImages: PromptForImagesOutput;
  showPortfolioPreview: ShowPortfolioPreviewOutput;
  showContentEditor: ShowContentEditorOutput;
  requestClarification: RequestClarificationOutput;
  suggestQuickActions: SuggestQuickActionsOutput;
  generatePortfolioContent: GeneratePortfolioContentOutput;
  composePortfolioLayout: ComposePortfolioLayoutOutput;
  composeUILayout: ComposeUILayoutOutput;
  checkPublishReady: CheckPublishReadyOutput;
  updateField: UpdateFieldOutput;
  regenerateSection: RegenerateSectionOutput;
  reorderImages: ReorderImagesOutput;
  validateForPublish: ValidateForPublishOutput;
  updateContractorProfile: UpdateContractorProfileOutput;
  processParallel: ProcessParallelOutput;
}

/** Tool names */
export type ToolName = keyof ToolOutputMap;

/**
 * Type-safe tool result accessor.
 *
 * @example
 * ```typescript
 * function getToolResult<T extends ToolName>(
 *   name: T,
 *   result: unknown
 * ): ToolOutputMap[T] {
 *   return result as ToolOutputMap[T];
 * }
 * ```
 */
export type GetToolOutput<T extends ToolName> = ToolOutputMap[T];

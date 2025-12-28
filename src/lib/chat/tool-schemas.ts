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

// ============================================================================
// Create Mode Tools (Main Chat Route)
// ============================================================================

/**
 * Schema for extracting project data from conversation.
 * Called by the model when it detects relevant information.
 *
 * IMPORTANT: city and state are required for publishing.
 * Always extract location as separate city and state fields.
 * @see /src/app/api/projects/[id]/publish/route.ts
 */
export const extractProjectDataSchema = z.object({
  project_type: z
    .string()
    .optional()
    .describe('Type of masonry project (chimney, tuckpointing, stone repair, brick repair, etc.)'),
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
    .describe('Materials mentioned (brick types, mortar, stone, etc.)'),
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
    .describe('REQUIRED: City where project was done (e.g., "Denver", "Hamilton"). Extract from any location mention.'),
  state: z
    .string()
    .optional()
    .describe('REQUIRED: State or province abbreviation (e.g., "CO", "ON", "CA"). Extract from any location mention.'),
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
  ready_for_images: z
    .boolean()
    .optional()
    .describe(
      'ONLY set true when ALL conditions are met: ' +
        '(1) specific project type confirmed (not "brick work"), ' +
        '(2) customer_problem is at least 15+ words, ' +
        '(3) solution_approach is at least 15+ words, ' +
        '(4) at least 2 specific materials mentioned, ' +
        '(5) city AND state are both provided. ' +
        'If any are vague, ask follow-up questions first.'
    ),
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
    .array(z.enum(['before', 'after', 'progress', 'detail']))
    .optional()
    .describe('Suggested photo categories based on project type'),
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
        type: z.enum(['addPhotos', 'generate', 'openForm', 'showPreview', 'insert']),
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
}

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
 */
export const editableFields = [
  'title',
  'description',
  'seo_title',
  'seo_description',
  'tags',
  'materials',
  'techniques',
] as const;

export type EditableField = (typeof editableFields)[number];

/**
 * Schema for updating a project field.
 * Called when user wants to change title, description, SEO, etc.
 */
export const updateFieldSchema = z.object({
  field: z
    .enum(['title', 'description', 'seo_title', 'seo_description', 'tags', 'materials', 'techniques'])
    .describe('The field to update'),
  value: z
    .union([z.string(), z.array(z.string())])
    .describe('The new value for the field (string for text fields, array for tags/materials/techniques)'),
  reason: z
    .string()
    .optional()
    .describe('Brief explanation of why this change was made'),
});

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
  | CheckPublishReadyOutput
  | UpdateFieldOutput
  | RegenerateSectionOutput
  | ReorderImagesOutput
  | ValidateForPublishOutput;

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
  checkPublishReady: CheckPublishReadyOutput;
  updateField: UpdateFieldOutput;
  regenerateSection: RegenerateSectionOutput;
  reorderImages: ReorderImagesOutput;
  validateForPublish: ValidateForPublishOutput;
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

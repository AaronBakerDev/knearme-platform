/**
 * Shared tool execution runtime for chat + live voice sessions.
 */

import type { ExtractedProjectData, ToolContext } from '@/lib/chat/chat-types';
import type {
  ExtractProjectDataOutput,
  PromptForImagesOutput,
  ShowPortfolioPreviewOutput,
  ShowContentEditorOutput,
  RequestClarificationOutput,
  SuggestQuickActionsOutput,
  GeneratePortfolioContentOutput,
  ComposePortfolioLayoutOutput,
  CheckPublishReadyOutput,
  UpdateFieldOutput,
  RegenerateSectionOutput,
  ReorderImagesOutput,
  ValidateForPublishOutput,
  UpdateDescriptionBlocksOutput,
  UpdateContractorProfileOutput,
  ContractorProfileField,
} from '@/lib/chat/tool-schemas';
import { contractorProfileFields } from '@/lib/chat/tool-schemas';
import {
  orchestrate,
  mergeProjectState,
  checkReadyForImages,
  checkQuality,
  formatQualityCheckSummary,
  getTopPriority,
  createEmptyProjectState,
  composePortfolioLayout,
  type SharedProjectState,
} from '@/lib/agents';
import { formatProjectLocation } from '@/lib/utils/location';
import { createClient } from '@/lib/supabase/server';

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
] as const;

export type AllowedToolName =
  | (typeof FAST_TURN_TOOLS)[number]
  | (typeof DEEP_CONTEXT_TOOLS)[number];

export type ToolExecutors = {
  extractProjectData: (args: ExtractedProjectData) => Promise<ExtractProjectDataOutput>;
  promptForImages: (args: PromptForImagesOutput) => Promise<PromptForImagesOutput>;
  showPortfolioPreview: (args: ShowPortfolioPreviewOutput) => Promise<ShowPortfolioPreviewOutput>;
  showContentEditor: (args: ShowContentEditorOutput) => Promise<ShowContentEditorOutput>;
  requestClarification: (args: RequestClarificationOutput) => Promise<RequestClarificationOutput>;
  suggestQuickActions: (args: SuggestQuickActionsOutput) => Promise<SuggestQuickActionsOutput>;
  generatePortfolioContent: (args: unknown) => Promise<GeneratePortfolioContentOutput>;
  composePortfolioLayout: (args: {
    goal?: string;
    focusAreas?: string[];
    includeImageOrder?: boolean;
  }) => Promise<ComposePortfolioLayoutOutput>;
  checkPublishReady: (args: { showWarnings: boolean }) => Promise<CheckPublishReadyOutput>;
  updateField: (args: { field: string; value: unknown; reason?: string }) => Promise<UpdateFieldOutput>;
  regenerateSection: (args: {
    section: 'title' | 'description' | 'seo';
    guidance?: string;
    preserveElements?: string[];
  }) => Promise<RegenerateSectionOutput>;
  reorderImages: (args: { imageIds: string[]; reason?: string }) => Promise<ReorderImagesOutput>;
  validateForPublish: (args: { checkFields?: string[] }) => Promise<ValidateForPublishOutput>;
  updateDescriptionBlocks: (args: UpdateDescriptionBlocksOutput) => Promise<UpdateDescriptionBlocksOutput>;
  updateContractorProfile: (args: {
    field: ContractorProfileField;
    value: string | string[];
    reason?: string;
  }) => Promise<UpdateContractorProfileOutput>;
};

async function loadProjectState({
  projectId,
  contractorId,
}: {
  projectId?: string;
  contractorId?: string;
}): Promise<SharedProjectState | null> {
  if (!projectId || !contractorId) {
    // Require contractor scoping to avoid unbounded cross-tenant reads.
    return null;
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    console.error('[loadProjectState] Failed to create Supabase client:', err);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = (supabase as any)
    .from('projects')
    .select(`
      id,
      title,
      description,
      project_type,
      project_type_slug,
      city,
      state,
      materials,
      techniques,
      challenge,
      solution,
      duration,
      status,
      ai_context,
      seo_title,
      seo_description,
      hero_image_id,
      project_images!project_images_project_id_fkey (
        id,
        storage_path,
        image_type,
        alt_text,
        display_order
      )
    `)
    .eq('id', projectId)
    .eq('contractor_id', contractorId);

  const { data: project, error } = await query.single();

  if (error || !project) {
    console.error('[loadProjectState] Failed to load project:', error);
    return null;
  }

  const aiContext = project.ai_context as Record<string, unknown> | null;
  const images = project.project_images || [];
  const heroImageId =
    (project as { hero_image_id?: string | null }).hero_image_id ?? images[0]?.id;

  const readyForImages = checkReadyForImages({
    projectType: project.project_type || undefined,
    customerProblem:
      (aiContext?.customer_problem as string) ||
      (project.challenge as string | null) ||
      undefined,
    solutionApproach:
      (aiContext?.solution_approach as string) ||
      (project.solution as string | null) ||
      undefined,
    materials: project.materials || [],
  });

  const state: SharedProjectState = {
    ...createEmptyProjectState(),
    projectType: project.project_type || undefined,
    projectTypeSlug: project.project_type_slug || undefined,
    city: project.city || undefined,
    state: project.state || undefined,
    location: formatProjectLocation({ city: project.city, state: project.state }) || undefined,
    title: project.title || undefined,
    description: project.description || undefined,
    seoTitle: project.seo_title || undefined,
    seoDescription: project.seo_description || undefined,
    materials: project.materials || [],
    techniques: project.techniques || [],
    tags: [],
    customerProblem:
      (aiContext?.customer_problem as string) ||
      (project.challenge as string | null) ||
      undefined,
    solutionApproach:
      (aiContext?.solution_approach as string) ||
      (project.solution as string | null) ||
      undefined,
    duration:
      (aiContext?.duration as string) ||
      (project.duration as string | null) ||
      undefined,
    proudOf: (aiContext?.proud_of as string) || undefined,
    images: images.map((img: {
      id: string;
      storage_path: string;
      image_type?: string;
      alt_text?: string;
      display_order?: number;
    }) => ({
      id: img.id,
      url: img.storage_path,
      imageType: img.image_type as 'before' | 'after' | 'progress' | 'detail' | undefined,
      altText: img.alt_text,
      displayOrder: img.display_order || 0,
    })),
    heroImageId,
    readyForImages,
    readyForContent: Boolean(
      project.project_type &&
      images.length > 0 &&
      heroImageId
    ),
    readyToPublish: project.status === 'published',
    needsClarification: [],
    clarifiedFields: [],
  };

  return state;
}

async function loadSessionExtractedData({
  sessionId,
  contractorId,
}: {
  sessionId?: string;
  contractorId?: string;
}): Promise<ExtractedProjectData | null> {
  if (!sessionId || !contractorId) return null;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error } = await (supabase as any)
    .from('chat_sessions')
    .select('extracted_data')
    .eq('id', sessionId)
    // Scope session reads to the authenticated contractor (defense in depth).
    .eq('contractor_id', contractorId)
    .single();

  if (error || !session) {
    console.warn('[loadSessionExtractedData] Failed to load session:', error);
    return null;
  }

  return (session.extracted_data as ExtractedProjectData) || null;
}

function cleanExtractedData(data: ExtractedProjectData): ExtractedProjectData {
  const cleaned: ExtractedProjectData = {};
  const addString = (key: keyof ExtractedProjectData, value?: string) => {
    if (!value) return;
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      cleaned[key] = trimmed as never;
    }
  };
  const addArray = (key: keyof ExtractedProjectData, value?: string[]) => {
    if (!value || value.length === 0) return;
    const filtered = value.map((item) => item.trim()).filter(Boolean);
    if (filtered.length > 0) {
      cleaned[key] = filtered as never;
    }
  };

  addString('project_type', data.project_type);
  addString('customer_problem', data.customer_problem);
  addString('solution_approach', data.solution_approach);
  addArray('materials_mentioned', data.materials_mentioned);
  addArray('techniques_mentioned', data.techniques_mentioned);
  addString('duration', data.duration);
  addString('city', data.city);
  addString('state', data.state);
  addString('location', data.location);
  addString('proud_of', data.proud_of);
  if (data.ready_for_images) {
    cleaned.ready_for_images = true;
  }
  return cleaned;
}

function mapExtractedDataToState(data?: ExtractedProjectData): Partial<SharedProjectState> {
  if (!data) return {};

  const locationLabel =
    data.location ||
    formatProjectLocation({ city: data.city, state: data.state }) ||
    undefined;

  return {
    projectType: data.project_type || undefined,
    customerProblem: data.customer_problem || undefined,
    solutionApproach: data.solution_approach || undefined,
    materials: data.materials_mentioned || [],
    techniques: data.techniques_mentioned || [],
    duration: data.duration || undefined,
    proudOf: data.proud_of || undefined,
    city: data.city || undefined,
    state: data.state || undefined,
    location: locationLabel,
  };
}

function mapStateToExtractedData(state: SharedProjectState): ExtractedProjectData {
  const locationLabel =
    state.location ||
    formatProjectLocation({ city: state.city, state: state.state }) ||
    undefined;

  return cleanExtractedData({
    project_type: state.projectType,
    customer_problem: state.customerProblem,
    solution_approach: state.solutionApproach,
    materials_mentioned: state.materials,
    techniques_mentioned: state.techniques,
    duration: state.duration,
    city: state.city,
    state: state.state,
    location: locationLabel,
    proud_of: state.proudOf,
    ready_for_images: state.readyForImages || undefined,
  });
}

export function createChatToolExecutors({
  toolContext,
  latestUserMessage,
}: {
  toolContext: ToolContext;
  latestUserMessage: string;
}): ToolExecutors {
  // Per-request state to prevent AI model from retrying expensive tools.
  // This closure captures state for the lifetime of a single request.
  // When AI model calls a tool multiple times, we block at the executor level.
  // @see docs/testing/agent-ux-issues-2026-01-01.md for retry loop bug details
  let contentGenerationAttempted = false;
  let layoutCompositionAttempted = false;

  return {
    extractProjectData: async (args) => {
      const sessionData = await loadSessionExtractedData({
        sessionId: toolContext.sessionId,
        contractorId: toolContext.contractorId,
      });
      let mergedState = createEmptyProjectState();
      mergedState = mergeProjectState(mergedState, mapExtractedDataToState(sessionData || undefined));
      mergedState = mergeProjectState(mergedState, mapExtractedDataToState(args));

      if (!latestUserMessage.trim()) {
        return mapStateToExtractedData(mergedState);
      }

      const result = await orchestrate({
        state: mergedState,
        message: latestUserMessage,
        phase: 'gathering',
      });

      return mapStateToExtractedData(result.state);
    },
    promptForImages: async (args) => args,
    showPortfolioPreview: async (args) => args,
    showContentEditor: async (args) => args,
    requestClarification: async (args) => args,
    suggestQuickActions: async (args) => args,
    generatePortfolioContent: async () => {
      // Block retries at executor level - AI model cannot bypass this
      if (contentGenerationAttempted) {
        return {
          success: false,
          title: '',
          description: '',
          seoTitle: '',
          seoDescription: '',
          tags: [],
          error: 'Content generation already attempted in this request. Ask the user to try again.',
        };
      }
      contentGenerationAttempted = true;

      const projectState = await loadProjectState({
        projectId: toolContext.projectId,
        contractorId: toolContext.contractorId,
      });
      if (!projectState) {
        return {
          success: false,
          title: '',
          description: '',
          seoTitle: '',
          seoDescription: '',
          tags: [],
          error: 'No project found. Please start by telling me about your project.',
        };
      }

      const result = await orchestrate({
        state: projectState,
        message: '',
        phase: 'generating',
      });

      if (result.error) {
        // For ALL errors, return success: false but with a clear error message.
        // The AI model should NOT retry - it should tell the user to try again later.
        // Using success: false + clear error ensures the AI stops and communicates to user.
        return {
          success: false,
          title: '',
          description: '',
          seoTitle: '',
          seoDescription: '',
          tags: [],
          error: result.error.retryable
            ? 'AI service is temporarily busy. Please wait a moment and try again. DO NOT automatically retry.'
            : result.error.message,
        };
      }

      if (!result.state.title || !result.state.description) {
        return {
          success: false,
          title: '',
          description: '',
          seoTitle: '',
          seoDescription: '',
          tags: [],
          error: result.message || 'Content generation failed. Please try again.',
        };
      }

      return {
        success: true,
        title: result.state.title,
        description: result.state.description,
        seoTitle: result.state.seoTitle || '',
        seoDescription: result.state.seoDescription || '',
        tags: result.state.tags || [],
      };
    },
    composePortfolioLayout: async (args) => {
      // Block retries at executor level - AI model cannot bypass this
      if (layoutCompositionAttempted) {
        return {
          blocks: [],
          rationale: 'Layout composition already attempted in this request. Ask the user to try again.',
          missingContext: [],
          confidence: 0.1,
        };
      }
      layoutCompositionAttempted = true;

      const projectState = await loadProjectState({
        projectId: toolContext.projectId,
        contractorId: toolContext.contractorId,
      });
      if (!projectState) {
        return {
          blocks: [],
          rationale: 'No project found to compose layout for.',
          missingContext: ['project'],
          confidence: 0.1,
        };
      }

      const result = await composePortfolioLayout(projectState, {
        goal: args.goal,
        focusAreas: args.focusAreas,
        includeImageOrder: args.includeImageOrder,
      });

      return result;
    },
    checkPublishReady: async (args) => {
      const projectState = await loadProjectState({
        projectId: toolContext.projectId,
        contractorId: toolContext.contractorId,
      });
      if (!projectState) {
        return {
          ready: false,
          missing: ['project'],
          warnings: [],
          suggestions: ['Start by telling me about your project.'],
          topPriority: 'project',
          summary: 'No project found. Please create a project first.',
        };
      }

      const orchestration = await orchestrate({
        state: projectState,
        message: '',
        phase: 'ready',
      });

      const result = checkQuality(orchestration.state);
      const summary = formatQualityCheckSummary(result);
      const priority = getTopPriority(result);

      return {
        ready: result.ready,
        missing: result.missing,
        warnings: args.showWarnings ? result.warnings : [],
        suggestions: result.suggestions,
        topPriority: priority,
        summary,
      };
    },
    updateField: async (args) => ({
      success: true,
      // Field is validated by Zod schema before reaching here
      field: args.field as UpdateFieldOutput['field'],
      value: args.value as string | string[],
      reason: args.reason,
    }),
    regenerateSection: async (args) => ({
      action: 'regenerate',
      section: args.section,
      guidance: args.guidance,
      preserveElements: args.preserveElements,
    }),
    reorderImages: async (args) => ({
      action: 'reorder',
      imageIds: args.imageIds,
      reason: args.reason,
    }),
    validateForPublish: async (args) => ({
      action: 'validate',
      checkFields: args.checkFields as ValidateForPublishOutput['checkFields'],
    }),
    updateDescriptionBlocks: async (args) => args,
    updateContractorProfile: async (args) => {
      if (!toolContext.contractorId) {
        return {
          success: false,
          field: args.field,
          value: args.value,
          reason: args.reason,
          error: 'No contractor ID found. Please ensure you are logged in.',
        };
      }

      // Runtime validation: prevent SQL injection via dynamic column names
      // This ensures only allowed fields can be updated, even if TypeScript types are bypassed
      const ALLOWED_FIELDS: readonly string[] = contractorProfileFields;
      if (!ALLOWED_FIELDS.includes(args.field)) {
        console.error(`[updateContractorProfile] Invalid field attempted: ${args.field}`);
        return {
          success: false,
          field: args.field,
          value: args.value,
          reason: args.reason,
          error: `Invalid field: "${args.field}" is not an allowed profile field.`,
        };
      }

      const supabase = await createClient();

      // Validate field type matches expected value type
      const arrayFields = ['services', 'service_areas'];
      const isArrayField = arrayFields.includes(args.field);
      const isArrayValue = Array.isArray(args.value);

      if (isArrayField && !isArrayValue) {
        return {
          success: false,
          field: args.field,
          value: args.value,
          reason: args.reason,
          error: `Field "${args.field}" expects an array value.`,
        };
      }

      if (!isArrayField && isArrayValue) {
        return {
          success: false,
          field: args.field,
          value: args.value,
          reason: args.reason,
          error: `Field "${args.field}" expects a string value, not an array.`,
        };
      }

      // Update the contractor profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('contractors')
        .update({ [args.field]: args.value })
        .eq('id', toolContext.contractorId);

      if (error) {
        console.error('[updateContractorProfile] Failed to update:', error);
        return {
          success: false,
          field: args.field,
          value: args.value,
          reason: args.reason,
          // Avoid leaking internal error details to the client.
          error: 'Failed to update profile. Please try again.',
        };
      }

      return {
        success: true,
        field: args.field,
        value: args.value,
        reason: args.reason,
      };
    },
  };
}

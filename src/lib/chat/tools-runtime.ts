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
  ComposeUILayoutInput,
  ComposeUILayoutOutput,
  CheckPublishReadyOutput,
  UpdateFieldOutput,
  RegenerateSectionOutput,
  ReorderImagesOutput,
  ValidateForPublishOutput,
  UpdateDescriptionBlocksOutput,
  UpdateContractorProfileOutput,
  ContractorProfileField,
  ProcessParallelInput,
  ProcessParallelOutput,
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
  composeUI,
  // Delegation functions (Phase 10 - Subagent Architecture)
  delegateToStoryAgent,
  delegateToQualityAgent,
  delegateToDesignAgent,
  delegateParallel,
  type SharedProjectState,
  type DelegationContext,
} from '@/lib/agents';
import { formatProjectLocation } from '@/lib/utils/location';
import { createClient } from '@/lib/supabase/server';
import { resolveProjectImageUrl } from '@/lib/storage/project-images';

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
  composeUILayout: (args: ComposeUILayoutInput) => Promise<ComposeUILayoutOutput>;
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
  /** Phase 10: Parallel Story + Design agent execution */
  processParallel: (args: ProcessParallelInput) => Promise<ProcessParallelOutput>;
};

async function loadProjectState({
  projectId,
  businessId,
}: {
  projectId?: string;
  businessId?: string;
}): Promise<SharedProjectState | null> {
  if (!projectId || !businessId) {
    // Require business scoping to avoid unbounded cross-tenant reads.
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
    .eq('business_id', businessId);

  const { data: project, error } = await query.single();

  if (error || !project) {
    console.error('[loadProjectState] Failed to load project:', error);
    return null;
  }

  const aiContext = project.ai_context as Record<string, unknown> | null;
  const images = project.project_images || [];
  const heroImageId =
    (project as { hero_image_id?: string | null }).hero_image_id ?? images[0]?.id;
  const isPublished = project.status === 'published';

  const imagesWithUrls = images.map((img: {
    id: string;
    storage_path: string;
    image_type?: string;
    alt_text?: string;
    display_order?: number;
  }) => ({
    id: img.id,
    url: resolveProjectImageUrl({
      projectId,
      imageId: img.id,
      storagePath: img.storage_path,
      isPublished,
    }),
    storagePath: img.storage_path,
    bucket: 'project-images-draft' as const,
    imageType: img.image_type as 'before' | 'after' | 'progress' | 'detail' | undefined,
    altText: img.alt_text,
    displayOrder: img.display_order || 0,
  }));

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
    images: imagesWithUrls,
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
  businessId,
}: {
  sessionId?: string;
  businessId?: string;
}): Promise<ExtractedProjectData | null> {
  if (!sessionId || !businessId) return null;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error } = await (supabase as any)
    .from('chat_sessions')
    .select('extracted_data')
    .eq('id', sessionId)
    // Scope session reads to the authenticated business (defense in depth).
    .eq('business_id', businessId)
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
  // ============================================================================
  // Philosophy: Let the Model Be Agentic
  // ============================================================================
  //
  // REMOVED per-request tool blocking that prevented model retries.
  // If the model calls a tool twice, it's doing so for a reason.
  // Blocking at the executor level second-guesses the model's intelligence.
  //
  // The old pattern (contentGenerationAttempted, etc.) was treating symptoms,
  // not causes. If there was a retry loop bug, the fix belongs in the prompt
  // or step limits, not in executor-level blocking.
  //
  // @see /docs/philosophy/agent-philosophy.md
  // ============================================================================

  return {
    extractProjectData: async (args) => {
      const sessionData = await loadSessionExtractedData({
        sessionId: toolContext.sessionId,
        businessId: toolContext.businessId,
      });
      let mergedState = createEmptyProjectState();
      mergedState = mergeProjectState(mergedState, mapExtractedDataToState(sessionData || undefined));
      mergedState = mergeProjectState(mergedState, mapExtractedDataToState(args));

      // If no message AND no images, return early (nothing to extract)
      // But if images exist, still delegate for image analysis even without message
      const hasImages = mergedState.images && mergedState.images.length > 0;
      if (!latestUserMessage.trim() && !hasImages) {
        return mapStateToExtractedData(mergedState);
      }

      // Use Story Agent delegation (Phase 10 - Subagent Architecture)
      // The Story Agent specializes in conversation, image analysis, and narrative extraction
      const delegationContext: DelegationContext = {
        state: mergedState,
        message: latestUserMessage || '',
        images: hasImages ? mergedState.images : undefined,
      };

      const result = await delegateToStoryAgent(delegationContext);

      // Log delegation errors but don't fail - return best available state
      if (result.error) {
        console.warn('[extractProjectData] Story Agent delegation failed:', result.error.message);
      }

      return mapStateToExtractedData(result.state);
    },
    promptForImages: async (args) => args,
    showPortfolioPreview: async (args) => args,
    showContentEditor: async (args) => args,
    requestClarification: async (args) => args,
    suggestQuickActions: async (args) => args,
    generatePortfolioContent: async () => {
      // Model can retry if needed - we trust its judgment
      const projectState = await loadProjectState({
        projectId: toolContext.projectId,
        businessId: toolContext.businessId,
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
      // Model can retry if needed - we trust its judgment
      const projectState = await loadProjectState({
        projectId: toolContext.projectId,
        businessId: toolContext.businessId,
      });
      if (!projectState) {
        return {
          blocks: [],
          rationale: 'No project found to compose layout for.',
          missingContext: ['project'],
          confidence: 0.1,
        };
      }

      // TODO: Phase 10 migration - currently calls both Design Agent and legacy composer.
      // Design Agent provides heroImageId selection, legacy provides DescriptionBlock[].
      // Future: align Design Agent schema with DescriptionBlock[] to eliminate legacy call.
      // @see /src/lib/agents/subagents/design-agent.ts

      // Use Design Agent delegation (Phase 10 - Subagent Architecture)
      // The Design Agent specializes in visual composition and hero image selection
      const delegationContext: DelegationContext = {
        state: projectState,
        message: args.goal || '',
      };

      const orchestratorResult = await delegateToDesignAgent(
        delegationContext,
        args.focusAreas?.join(', ')
      );

      // Log delegation errors but don't fail - we'll fall back to legacy
      if (orchestratorResult.error) {
        console.warn('[composePortfolioLayout] Design Agent delegation failed:', orchestratorResult.error.message);
      }

      // Legacy composePortfolioLayout produces DescriptionBlock[] format for BlockEditor
      const result = await composePortfolioLayout(projectState, {
        goal: args.goal,
        focusAreas: args.focusAreas,
        includeImageOrder: args.includeImageOrder,
      });

      // Merge: Design Agent provides heroImageId, legacy provides blocks
      return {
        blocks: result.blocks,
        rationale: result.rationale,
        missingContext: result.missingContext,
        confidence: result.confidence,
        heroImageId: orchestratorResult.state.heroImageId,
      };
    },
    composeUILayout: async (args) => {
      // Model can retry if needed - we trust its judgment
      const projectState = await loadProjectState({
        projectId: toolContext.projectId,
        businessId: toolContext.businessId,
      });

      if (!projectState) {
        return {
          designTokens: {
            layout: 'hero-gallery',
            spacing: 'comfortable',
            typography: { headingStyle: 'bold', bodySize: 'base' },
            colors: { accent: 'primary', background: 'light' },
            imageDisplay: 'rounded',
            heroStyle: 'large-single',
          },
          blocks: [],
          rationale: 'No project found to compose layout for.',
          confidence: 0,
        };
      }

      const result = await composeUI(projectState, {
        feedback: args.feedback,
        focusAreas: args.focusAreas,
        preserveElements: args.preserveElements,
      });

      return result;
    },
    checkPublishReady: async (args) => {
      const projectState = await loadProjectState({
        projectId: toolContext.projectId,
        businessId: toolContext.businessId,
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

      // Use Quality Agent delegation (Phase 10 - Subagent Architecture)
      // The Quality Agent provides contextual, advisory assessment (never blocking)
      const delegationContext: DelegationContext = {
        state: projectState,
        message: '',
      };

      const orchestratorResult = await delegateToQualityAgent(delegationContext);

      // Log delegation errors but don't fail - we'll use legacy checkQuality
      if (orchestratorResult.error) {
        console.warn('[checkPublishReady] Quality Agent delegation failed:', orchestratorResult.error.message);
      }

      // Also run legacy checkQuality for backwards-compatible response format
      // TODO: Remove this once all callers use Quality Agent format
      const result = checkQuality(orchestratorResult.state);
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
    /**
     * Updates business profile fields.
     * Note: Tool is still named updateContractorProfile for schema compatibility.
     * Internally uses businesses table and syncs to contractors for backward compat.
     */
    updateContractorProfile: async (args) => {
      if (!toolContext.businessId) {
        return {
          success: false,
          field: args.field,
          value: args.value,
          reason: args.reason,
          error: 'No business ID found. Please ensure you are logged in.',
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

      // Update businesses table (primary)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('businesses')
        .update({ [args.field]: args.value })
        .eq('id', toolContext.businessId);

      if (error) {
        console.error('[updateContractorProfile] Failed to update businesses:', error);
        return {
          success: false,
          field: args.field,
          value: args.value,
          reason: args.reason,
          // Avoid leaking internal error details to the client.
          error: 'Failed to update profile. Please try again.',
        };
      }

      // Also sync to contractors table for backward compatibility
      // Map business field names to contractor field names
      const fieldMapping: Record<string, string> = {
        name: 'business_name',
        slug: 'profile_slug',
        // Most fields have same names in both tables
      };
      const contractorField = fieldMapping[args.field] || args.field;

      // Get the legacy_contractor_id to sync
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: business } = await (supabase as any)
        .from('businesses')
        .select('legacy_contractor_id')
        .eq('id', toolContext.businessId)
        .single();

      if (business?.legacy_contractor_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('contractors')
          .update({ [contractorField]: args.value })
          .eq('id', business.legacy_contractor_id);
        // Don't fail if contractor sync fails - businesses is the source of truth
      }

      return {
        success: true,
        field: args.field,
        value: args.value,
        reason: args.reason,
      };
    },

    /**
     * Phase 10: Parallel Story + Design agent execution.
     *
     * Runs Story Agent and Design Agent simultaneously for faster processing.
     * Use cases:
     * - After images are uploaded (trigger: 'images_uploaded')
     * - When content is ready for layout (trigger: 'content_ready')
     * - When user explicitly requests (trigger: 'user_request')
     *
     * @see /todo/ai-sdk-phase-10-persona-agents.md
     * @see /src/lib/agents/orchestrator.ts delegateParallel()
     */
    processParallel: async (args) => {
      const startTime = Date.now();

      // Load project state
      const projectState = await loadProjectState({
        projectId: toolContext.projectId,
        businessId: toolContext.businessId,
      });

      if (!projectState) {
        return {
          success: false,
          agentsRun: [],
          durationMs: Date.now() - startTime,
          error: 'No project found. Please start by telling me about your project.',
        };
      }

      // Build delegation context
      const delegationContext: DelegationContext = {
        state: projectState,
        message: args.userMessage || latestUserMessage || '',
        images: projectState.images.length > 0 ? projectState.images : undefined,
      };

      // Determine which agents to run
      const runStory = !args.skipStory;
      const runDesign = !args.skipDesign;
      const agentsRun: ('story' | 'design')[] = [];

      if (runStory) agentsRun.push('story');
      if (runDesign) agentsRun.push('design');

      // If both should run, use parallel execution
      if (runStory && runDesign) {
        const result = await delegateParallel(delegationContext);

        // Extract results for each agent
        const storyDelegation = result.actions.find(
          (a) => a.type === 'parallel_delegation'
        );

        // If parallel_delegation action exists, extract results
        if (storyDelegation && storyDelegation.type === 'parallel_delegation') {
          const storyResult = storyDelegation.results.find((r) => r.subagent === 'story');
          const designResult = storyDelegation.results.find((r) => r.subagent === 'design');

          return {
            success: true,
            agentsRun,
            storyResult: storyResult?.result.success
              ? {
                  title: result.state.title,
                  description: result.state.description,
                  checkpoint: (storyResult.result as { checkpoint?: string }).checkpoint,
                  followUpQuestion: (storyResult.result as { followUpQuestion?: string }).followUpQuestion,
                }
              : undefined,
            designResult: designResult?.result.success
              ? {
                  heroImageId: result.state.heroImageId,
                  layoutStyle: (designResult.result as { layoutStyle?: string }).layoutStyle,
                }
              : undefined,
            durationMs: Date.now() - startTime,
          };
        }

        // Fallback: return merged state
        return {
          success: true,
          agentsRun,
          storyResult: {
            title: result.state.title,
            description: result.state.description,
          },
          designResult: {
            heroImageId: result.state.heroImageId,
          },
          durationMs: Date.now() - startTime,
        };
      }

      // Single agent execution
      if (runStory && !runDesign) {
        const result = await delegateToStoryAgent(delegationContext);
        return {
          success: !result.error,
          agentsRun: ['story'],
          storyResult: {
            title: result.state.title,
            description: result.state.description,
            followUpQuestion: result.message,
          },
          durationMs: Date.now() - startTime,
          error: result.error?.message,
        };
      }

      if (runDesign && !runStory) {
        const result = await delegateToDesignAgent(delegationContext);
        return {
          success: !result.error,
          agentsRun: ['design'],
          designResult: {
            heroImageId: result.state.heroImageId,
          },
          durationMs: Date.now() - startTime,
          error: result.error?.message,
        };
      }

      // No agents to run (both skipped)
      return {
        success: true,
        agentsRun: [],
        durationMs: Date.now() - startTime,
      };
    },
  };
}

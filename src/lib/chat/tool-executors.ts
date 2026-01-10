/**
 * Tool executor implementations for chat + live voice sessions.
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
  checkQuality,
  formatQualityCheckSummary,
  getTopPriority,
  createEmptyProjectState,
  composePortfolioLayout,
  composeUI,
  delegateToStoryAgent,
  delegateToQualityAgent,
  delegateToDesignAgent,
  delegateParallel,
  type DelegationContext,
} from '@/lib/agents';
import {
  loadProjectState,
  loadSessionExtractedData,
  mapExtractedDataToState,
  mapStateToExtractedData,
} from '@/lib/chat/project-state-loader';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import type { Database } from '@/types/database';

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

type BusinessUpdate = Database['public']['Tables']['businesses']['Update'];
type ContractorUpdate = Database['public']['Tables']['contractors']['Update'];

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
        logger.warn('[extractProjectData] Story Agent delegation failed', {
          error: result.error,
        });
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

      // Phase 10 migration: currently calls both Design Agent and legacy composer.
      // Design Agent provides heroImageId selection, legacy provides DescriptionBlock[].
      // Align Design Agent schema with DescriptionBlock[] to eliminate legacy call.
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
        logger.warn('[composePortfolioLayout] Design Agent delegation failed', {
          error: orchestratorResult.error,
        });
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
        logger.warn('[checkPublishReady] Quality Agent delegation failed', {
          error: orchestratorResult.error,
        });
      }

      // Legacy checkQuality keeps the response format stable until callers adopt Quality Agent output.
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
        logger.error('[updateContractorProfile] Invalid field attempted', {
          field: args.field,
        });
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

      const businessFieldMapping: Partial<Record<ContractorProfileField, keyof BusinessUpdate>> = {
        business_name: 'name',
        profile_slug: 'slug',
      };
      const businessField =
        businessFieldMapping[args.field] ?? (args.field as keyof BusinessUpdate);

      // Update businesses table (primary)
      const businessUpdate = { [businessField]: args.value } as BusinessUpdate;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('businesses')
        .update(businessUpdate)
        .eq('id', toolContext.businessId);

      if (error) {
        logger.error('[updateContractorProfile] Failed to update businesses', {
          error,
          businessId: toolContext.businessId,
          field: businessField,
        });
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
      const fieldMapping: Partial<Record<keyof BusinessUpdate, keyof ContractorUpdate>> = {
        name: 'business_name',
        slug: 'profile_slug',
      };
      const contractorField =
        fieldMapping[businessField] ?? (businessField as keyof ContractorUpdate);

      // Get the legacy_contractor_id to sync
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: business } = await (supabase as any)
        .from('businesses')
        .select('legacy_contractor_id')
        .eq('id', toolContext.businessId)
        .single();

      const businessData = business as { legacy_contractor_id?: string } | null;
      if (businessData?.legacy_contractor_id) {
        const contractorUpdate = { [contractorField]: args.value } as ContractorUpdate;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('contractors')
          .update(contractorUpdate)
          .eq('id', businessData.legacy_contractor_id);
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

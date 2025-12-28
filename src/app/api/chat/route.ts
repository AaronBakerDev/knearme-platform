/**
 * Chat API Route - Streaming conversation with function calling.
 *
 * Uses Vercel AI SDK with Google Gemini 3.0 Flash for streaming responses.
 * Extracts structured project data from natural conversation.
 *
 * POST /api/chat
 *
 * @see /src/lib/chat/chat-prompts.ts for system prompts
 * @see /src/lib/chat/chat-types.ts for type definitions
 * @see https://ai-sdk.dev/docs/ai-sdk-core/generating-text#streamtext
 */

import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { after } from 'next/server';
import { getChatModel, isGoogleAIEnabled } from '@/lib/ai/providers';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { UNIFIED_PROJECT_SYSTEM_PROMPT } from '@/lib/chat/chat-prompts';
import { chatTelemetry, flushLangfuse } from '@/lib/observability/traced-ai';
import type { ExtractedProjectData, ToolContext } from '@/lib/chat/chat-types';
import { formatProjectLocation } from '@/lib/utils/location';
import {
  extractProjectDataSchema,
  promptForImagesSchema,
  showPortfolioPreviewSchema,
  showContentEditorSchema,
  requestClarificationSchema,
  suggestQuickActionsSchema,
  generatePortfolioContentSchema,
  checkPublishReadySchema,
  updateFieldSchema,
  regenerateSectionSchema,
  reorderImagesSchema,
  validateForPublishSchema,
  updateDescriptionBlocksSchema,
  type ExtractProjectDataOutput,
  type PromptForImagesOutput,
  type ShowPortfolioPreviewOutput,
  type ShowContentEditorOutput,
  type RequestClarificationOutput,
  type SuggestQuickActionsOutput,
  type GeneratePortfolioContentOutput,
  type CheckPublishReadyOutput,
  type UpdateFieldOutput,
  type RegenerateSectionOutput,
  type ReorderImagesOutput,
  type ValidateForPublishOutput,
  type UpdateDescriptionBlocksOutput,
} from '@/lib/chat/tool-schemas';
import {
  orchestrate,
  mergeProjectState,
  checkQuality,
  formatQualityCheckSummary,
  getTopPriority,
  createEmptyProjectState,
  type SharedProjectState,
} from '@/lib/agents';
import { createClient } from '@/lib/supabase/server';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// Tool schemas are imported from @/lib/chat/tool-schemas.ts
// See that file for schema definitions and TypeScript types

/**
 * Load project data from database and convert to SharedProjectState.
 * Used by agent-powered tools to get current project state.
 *
 * @param projectId - Project ID to load
 * @returns SharedProjectState or null if not found
 */
async function loadProjectState(projectId?: string): Promise<SharedProjectState | null> {
  if (!projectId) return null;

  const supabase = await createClient();

  // Load project with images
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: project, error } = await (supabase as any)
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
      project_images (
        id,
        storage_path,
        image_type,
        alt_text,
        display_order
      )
    `)
    .eq('id', projectId)
    .single();

  if (error || !project) {
    console.error('[loadProjectState] Failed to load project:', error);
    return null;
  }

  // Extract AI context (extracted data from conversation)
  const aiContext = project.ai_context as Record<string, unknown> | null;

  // Find hero image
  const images = project.project_images || [];
  const heroImageId =
    (project as { hero_image_id?: string | null }).hero_image_id ?? images[0]?.id;

  // Build SharedProjectState from project data
  const state: SharedProjectState = {
    ...createEmptyProjectState(),

    // From project table
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
    tags: [], // Not stored directly on project

    // From AI context (extracted during conversation)
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

    // Images
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
    heroImageId: heroImageId,

    // State flags - calculate based on data
    readyForImages: Boolean(
      project.project_type &&
      project.city &&
      project.state &&
      (aiContext?.customer_problem || project.challenge) &&
      (aiContext?.solution_approach || project.solution) &&
      (project.materials?.length || 0) >= 2
    ),
    readyForContent: Boolean(
      project.project_type &&
      images.length > 0 &&
      heroImageId
    ),
    readyToPublish: project.status === 'published',

    // Clarification tracking (not persisted)
    needsClarification: [],
    clarifiedFields: [],
  };

  return state;
}

function getLatestUserMessage(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (!message) continue;
    if (message.role !== 'user') continue;
    if (Array.isArray(message.parts)) {
      const text = message.parts
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map((part) => part.text)
        .join('');
      if (text.trim()) return text;
    }
    const fallback = (message as { content?: string }).content;
    if (fallback && fallback.trim()) return fallback;
  }
  return '';
}

async function loadSessionExtractedData(
  sessionId?: string
): Promise<ExtractedProjectData | null> {
  if (!sessionId) return null;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error } = await (supabase as any)
    .from('chat_sessions')
    .select('extracted_data')
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    console.warn('[loadSessionExtractedData] Failed to load session:', error);
    return null;
  }

  return (session.extracted_data as ExtractedProjectData) || null;
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
  addString('challenges', data.challenges);
  addString('proud_of', data.proud_of);

  if (data.ready_for_images) {
    cleaned.ready_for_images = true;
  }

  return cleaned;
}

/**
 * POST /api/chat
 *
 * Stream a chat response with optional data extraction.
 */
export async function POST(request: Request) {
  try {
    // Check if AI is available
    if (!isGoogleAIEnabled()) {
      return new Response(
        JSON.stringify({ error: 'AI chat is not available. Please configure GOOGLE_GENERATIVE_AI_API_KEY.' }),
        { status: 503 }
      );
    }

    // Verify authentication
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return new Response(
        JSON.stringify({ error: auth.message }),
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    // Parse request body with optional context fields
    const body = await request.json();
    const { messages, projectId, sessionId } = body as {
      messages: UIMessage[];
      projectId?: string;
      sessionId?: string;
    };
    const latestUserMessage = getLatestUserMessage(messages);

    // Build tool context from auth + request
    // Tools receive this via closure for security (model can't manipulate)
    // @see /src/lib/chat/chat-types.ts ToolContext documentation
    const toolContext: ToolContext = {
      userId: auth.user.id,
      contractorId: auth.contractor.id,
      projectId,
      sessionId,
    };

    // Stream response with tool calling using Gemini 3.0 Flash
    const result = streamText({
      model: getChatModel(),
      system: UNIFIED_PROJECT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      // Enable Langfuse telemetry for observability
      // @see /src/lib/observability/traced-ai.ts
      experimental_telemetry: chatTelemetry({
        contractorId: toolContext.contractorId,
        projectId: toolContext.projectId,
        sessionId: toolContext.sessionId,
      }),
      // Tools have access to toolContext via closure for:
      // - userId: auth.users.id (for RLS)
      // - contractorId: contractors.id (for ownership checks)
      // - projectId: current project being edited (if any)
      // - sessionId: chat session for state persistence
      tools: {
        /**
         * Tool for extracting project data from conversation.
         * The model calls this when it detects relevant project information.
         * @see /src/lib/chat/tool-schemas.ts for schema definition
         */
        extractProjectData: tool({
          description: `Extract project information from the conversation. Call this when the user mentions:
- What type of project it was (chimney, tuckpointing, etc.)
- What problem the customer had
- How they fixed it
- What materials they used
- Any challenges or things they're proud of

IMPORTANT: Only set ready_for_images to true when you have QUALITY data for ALL of:
1. Specific project type (not generic like "brick work" - need "chimney rebuild", "tuckpointing", etc.)
2. Customer's problem (at least a full sentence, 15+ words describing the issue)
3. How it was solved (at least a full sentence, 15+ words explaining the work done)
4. At least 2 specific materials (e.g., "Type S mortar and red clay brick", not just "brick")

If any field is too vague, ask a follow-up question instead of setting ready_for_images.
The goal is a compelling portfolio story, not just checkboxes.

After extracting data with ready_for_images: true, call the promptForImages tool.`,
          inputSchema: extractProjectDataSchema,
          execute: async (args): Promise<ExtractProjectDataOutput> => {
            const sessionData = await loadSessionExtractedData(toolContext.sessionId);
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
        }),

        /**
         * Tool for displaying inline image upload UI.
         * Called when the conversation reaches the photo collection phase.
         * @see /src/lib/chat/tool-schemas.ts for schema definition
         */
        promptForImages: tool({
          description: `Display an inline image upload UI when ready for photos.
Call this tool when:
- The extractProjectData tool has set ready_for_images to true
- You've gathered enough project context and it's time for photos
- The conversation has naturally reached the photo collection phase

This renders an inline image gallery artifact where the user can:
- Upload photos via drag-drop or tap
- Categorize photos as before/after/progress/detail`,
          inputSchema: promptForImagesSchema,
          execute: async (args): Promise<PromptForImagesOutput> => args,
        }),

        /**
         * Tool for triggering a preview update in the live canvas.
         * Called to explicitly update the preview with current collected data.
         * @see /src/lib/chat/tool-schemas.ts for schema definition
         */
        showPortfolioPreview: tool({
          description: `Update the live portfolio preview canvas with current data.
Call this tool when:
- Significant project information has been collected
- After the user adds photos
- When you want to highlight progress to the user
- Before asking "Ready to generate?"

This refreshes the side preview canvas (on desktop) or can prompt the user
to check their preview (on mobile).`,
          inputSchema: showPortfolioPreviewSchema,
          execute: async (args): Promise<ShowPortfolioPreviewOutput> => args,
        }),

        /**
         * Tool for displaying inline content editor UI.
         * Called after AI content generation to allow edits.
         * @see /src/lib/chat/tool-schemas.ts for schema definition
         */
        showContentEditor: tool({
          description: `Display the generated content in an inline editor.
Call this tool after generating the portfolio content so the user can:
- Edit the title and description
- Adjust SEO title and description
- Accept or reject the generated content`,
          inputSchema: showContentEditorSchema,
          execute: async (args): Promise<ShowContentEditorOutput> => args,
        }),

        /**
         * Tool for requesting clarification when uncertain.
         * Displays an interactive card for user to confirm or correct information.
         *
         * @see /src/components/chat/artifacts/ClarificationCard.tsx
         * @see /src/lib/chat/tool-schemas.ts for schema definition
         */
        requestClarification: tool({
          description: `Request clarification when you're uncertain about something the user said.
Call this tool when:
- The user's response is ambiguous (e.g., "we used the usual stuff" for materials)
- You detected something that could mean multiple things
- You want to confirm an important detail before proceeding
- Your confidence in understanding is below 70%

This displays an interactive card where the user can:
- Confirm your current understanding
- Select from suggested alternatives
- Provide a different answer

Use this instead of asking plain text questions when you have specific alternatives to suggest.`,
          inputSchema: requestClarificationSchema,
          execute: async (args): Promise<RequestClarificationOutput> => args,
        }),

        /**
         * Tool for suggesting quick action chips in the chat UI.
         * Helps the user take the next step with one tap.
         */
        suggestQuickActions: tool({
          description: `Suggest quick action chips for the UI.
Use this to offer 2-4 next-step actions like:
- Add photos
- Generate content
- Open the edit form
- Show the preview
- Insert a short suggested reply

Keep labels short and helpful. If type is "insert", include a value.`,
          inputSchema: suggestQuickActionsSchema,
          execute: async (args): Promise<SuggestQuickActionsOutput> => args,
        }),

        /**
         * Tool for generating portfolio content using ContentGenerator agent.
         * Creates polished, SEO-optimized content from extracted project data.
         *
         * @see /src/lib/agents/content-generator.ts
         */
        generatePortfolioContent: tool({
          description: `Generate polished portfolio content from the extracted project data.
Call this tool when:
- The user has provided enough project details (project type, problem, solution, materials)
- Photos have been uploaded
- The user asks to "generate content" or is ready to see their portfolio

This uses the ContentGenerator agent to create:
- A compelling project title (60 chars max)
- Professional description (300-500 words)
- SEO title and meta description
- Relevant tags for categorization

After generating, call showContentEditor to display the results for review.`,
          inputSchema: generatePortfolioContentSchema,
          execute: async (_args): Promise<GeneratePortfolioContentOutput> => {
            // Load project data to build SharedProjectState
            const projectState = await loadProjectState(toolContext.projectId);
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
              return {
                success: false,
                title: '',
                description: '',
                seoTitle: '',
                seoDescription: '',
                tags: [],
                error: result.error.message,
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
        }),

        /**
         * Tool for checking publish readiness using QualityChecker agent.
         * Validates project meets all requirements before publishing.
         *
         * @see /src/lib/agents/quality-checker.ts
         */
        checkPublishReady: tool({
          description: `Check if the project is ready to publish.
Call this tool when:
- The user wants to publish their project
- Before showing the publish button
- When the user asks "am I ready to publish?"

This validates:
- Required fields (title, project type + slug, city + state)
- Minimum images requirement
- Hero image selection
- Recommendations (description length, materials, SEO)

Returns actionable feedback on what's missing or could be improved.`,
          inputSchema: checkPublishReadySchema,
          execute: async (args): Promise<CheckPublishReadyOutput> => {
            // Load project data to build SharedProjectState
            const projectState = await loadProjectState(toolContext.projectId);
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

            // Check quality using QualityChecker agent
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
        }),

        /**
         * Tool for updating a specific project field (edit or refine).
         * ChatWizard handles the actual update on the client.
         */
        updateField: tool({
          description: `Update a specific field on the project.
Call this tool when the user wants to change the title, description, SEO, tags, materials, or techniques.`,
          inputSchema: updateFieldSchema,
          execute: async (args): Promise<UpdateFieldOutput> => ({
            success: true,
            field: args.field,
            value: args.value,
            reason: args.reason,
          }),
        }),

        /**
         * Tool for regenerating content sections with AI guidance.
         * ChatWizard calls the regeneration endpoint.
         */
        regenerateSection: tool({
          description: `Regenerate a specific section (title, description, or SEO) with guidance.`,
          inputSchema: regenerateSectionSchema,
          execute: async (args): Promise<RegenerateSectionOutput> => ({
            action: 'regenerate',
            section: args.section,
            guidance: args.guidance,
            preserveElements: args.preserveElements,
          }),
        }),

        /**
         * Tool for reordering project images (first becomes hero).
         * ChatWizard applies the reorder via API.
         */
        reorderImages: tool({
          description: `Reorder project images. Use when the user wants to set a new hero or rearrange photos.`,
          inputSchema: reorderImagesSchema,
          execute: async (args): Promise<ReorderImagesOutput> => ({
            action: 'reorder',
            imageIds: args.imageIds,
            reason: args.reason,
          }),
        }),

        /**
         * Tool for validating publish readiness against server rules.
         * ChatWizard performs the validation request.
         */
        validateForPublish: tool({
          description: `Validate publish readiness using server rules.
Call this when the user asks if they can publish or wants to see what's missing.`,
          inputSchema: validateForPublishSchema,
          execute: async (args): Promise<ValidateForPublishOutput> => ({
            action: 'validate',
            checkFields: args.checkFields,
          }),
        }),

        /**
         * Tool for updating structured description blocks.
         * ChatWizard applies block updates on the project.
         */
        updateDescriptionBlocks: tool({
          description: `Update structured description blocks for rich content.`,
          inputSchema: updateDescriptionBlocksSchema,
          execute: async (args): Promise<UpdateDescriptionBlocksOutput> => args,
        }),
      },
      // Allow up to 10 tool steps for complex multi-tool responses
      // Increased from 3 to support clarification flows and multi-extraction
      stopWhen: stepCountIs(10),
      // Temperature for natural conversation
      temperature: 0.7,
    });

    // Flush Langfuse traces after streaming completes (serverless requirement)
    // The after() callback runs after the response is sent
    after(async () => {
      await flushLangfuse();
    });

    // Return streaming response
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[POST /api/chat] Error:', error);
    // Ensure traces are flushed even on error
    after(async () => {
      await flushLangfuse();
    });
    return new Response(
      JSON.stringify({ error: 'Failed to process chat message' }),
      { status: 500 }
    );
  }
}

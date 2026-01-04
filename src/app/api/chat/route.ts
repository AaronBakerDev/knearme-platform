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
import { z } from 'zod';
import { getChatModel, isGoogleAIEnabled } from '@/lib/ai/providers';
import { requireAuthBusiness, isBusinessAuthError } from '@/lib/api/auth';
import {
  buildSystemPromptWithContext,
  UNIFIED_PROJECT_SYSTEM_PROMPT,
} from '@/lib/chat/chat-prompts';
import { loadPromptContext } from '@/lib/chat/prompt-context';
import { chatTelemetry, flushLangfuse } from '@/lib/observability/traced-ai';
import type { ToolContext } from '@/lib/chat/chat-types';
import {
  extractProjectDataSchema,
  promptForImagesSchema,
  showPortfolioPreviewSchema,
  showContentEditorSchema,
  requestClarificationSchema,
  suggestQuickActionsSchema,
  generatePortfolioContentSchema,
  composePortfolioLayoutSchema,
  composeUILayoutInputSchema,
  checkPublishReadySchema,
  updateFieldSchema,
  regenerateSectionSchema,
  reorderImagesSchema,
  validateForPublishSchema,
  updateDescriptionBlocksSchema,
  updateContractorProfileSchema,
  processParallelSchema,
} from '@/lib/chat/tool-schemas';
import {
  createChatToolExecutors,
  FAST_TURN_TOOLS,
  DEEP_CONTEXT_TOOLS,
  type AllowedToolName,
} from '@/lib/chat/tools-runtime';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// Tool schemas are imported from @/lib/chat/tool-schemas.ts
// See that file for schema definitions and TypeScript types

const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHAT_RATE_LIMIT_MAX = 30;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

const uiMessagePartSchema = z
  .object({
    type: z.string(),
    text: z.string().max(10_000).optional(),
    toolCallId: z.string().optional(),
    toolName: z.string().optional(),
    args: z.unknown().optional(),
    result: z.unknown().optional(),
    state: z.string().optional(),
    input: z.unknown().optional(),
    output: z.unknown().optional(),
    errorText: z.string().optional(),
  })
  .passthrough();

const uiMessageSchema = z
  .object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(10_000).optional(),
    parts: z.array(uiMessagePartSchema).max(50).optional(),
  })
  .passthrough();

// Validate + size-limit chat payloads to avoid prompt injection and payload abuse.
const requestSchema = z.object({
  messages: z.array(uiMessageSchema).min(1).max(200),
  projectId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  toolChoice: z.string().optional(),
});

type DeepToolName = (typeof DEEP_CONTEXT_TOOLS)[number];

function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = rateLimitBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + CHAT_RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > CHAT_RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * @deprecated Deep tool inference is no longer used for gating.
 * All tools are now always available. The model decides what to call.
 * Kept for backwards compatibility and potential analytics use.
 *
 * @see /docs/philosophy/agent-philosophy.md
 */
function inferDeepToolChoice(text: string): DeepToolName | null {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;

  // UI composition - design tokens and semantic blocks
  const wantsUILayout =
    /\bdesign\s+(layout|tokens?)\b/.test(normalized) ||
    /\bvisual\s+layout\b/.test(normalized) ||
    /\bsemantic\s+blocks\b/.test(normalized) ||
    /\bui\s+layout\b/.test(normalized) ||
    /\bcompose\s+(ui|layout|design)\b/.test(normalized);

  if (wantsUILayout) return 'composeUILayout';

  // Portfolio layout - description blocks and image ordering
  const wantsLayout =
    /\blayout\b/.test(normalized) ||
    /\b(description|content)\s+blocks\b/.test(normalized) ||
    /\bblock\s+layout\b/.test(normalized) ||
    /\bcontent\s+structure\b/.test(normalized);

  if (wantsLayout) return 'composePortfolioLayout';

  const wantsGenerate =
    /\b(generate|draft|write)\b/.test(normalized) &&
    !/\bregenerate\b/.test(normalized) &&
    /(content|description|portfolio|page|story|write up|write-up)/.test(normalized);

  if (wantsGenerate) return 'generatePortfolioContent';

  return null;
}

/**
 * Load project data from database and convert to SharedProjectState.
 * Used by agent-powered tools to get current project state.
 *
 * @param projectId - Project ID to load
 * @returns SharedProjectState or null if not found
 */
function hasSummaryContext(messages: UIMessage[]): boolean {
  for (const message of messages) {
    if (!message) continue;
    if (message.role !== 'system') continue;
    const id = (message as { id?: string }).id;
    if (id === 'context-summary') return true;
    if (Array.isArray(message.parts)) {
      const text = message.parts
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map((part) => part.text)
        .join('');
      if (text.includes('Previous Conversation Summary')) return true;
    }
  }
  return false;
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

/**
 * Check if a system message should be allowed (trusted context only).
 * Prevents prompt injection via malicious system messages.
 */
function shouldAllowSystemMessage(message: {
  role: 'user' | 'assistant' | 'system';
  id?: string;
  parts?: Array<{ type: string; text?: string }>;
}): boolean {
  if (message.role !== 'system') return true;
  if (message.id === 'context-summary') return true;
  if (Array.isArray(message.parts)) {
    const text = message.parts
      .filter((part): part is { type: string; text: string } => part.type === 'text' && !!part.text)
      .map((part) => part.text)
      .join('');
    if (text.includes('Previous Conversation Summary')) return true;
  }
  return false;
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

    // Verify authentication (uses businesses table)
    const auth = await requireAuthBusiness();
    if (isBusinessAuthError(auth)) {
      return new Response(
        JSON.stringify({ error: auth.message }),
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    // Parse + validate request body with optional context fields
    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid chat payload', details: parsed.error.flatten() }),
        { status: 400 }
      );
    }

    // Only allow trusted summary system messages to avoid prompt injection.
    // Cast to UIMessage[] after filtering since Zod schema is compatible.
    const messages = parsed.data.messages.filter(shouldAllowSystemMessage) as UIMessage[];
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid messages provided' }), { status: 400 });
    }

    const { projectId, sessionId, toolChoice: _toolChoice } = parsed.data;

    // Best-effort in-memory rate limit to slow abuse on authenticated accounts.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const rateKey = `${auth.user.id}:${ip ?? 'unknown'}`;
    const rateLimit = checkRateLimit(rateKey);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait and try again.' }),
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const latestUserMessage = getLatestUserMessage(messages);
    const includeSummary = !hasSummaryContext(messages);

    // PHILOSOPHY: All tools always available. Model decides what to call.
    // Removed inference gating that second-guessed the model's intelligence.
    // @see /docs/philosophy/agent-philosophy.md
    const activeTools: AllowedToolName[] = [
      ...FAST_TURN_TOOLS,
      ...DEEP_CONTEXT_TOOLS,
    ];

    // Analytics only - not used for gating
    const _inferredDeepTool = inferDeepToolChoice(latestUserMessage);
    void _inferredDeepTool; // Silence unused warning

    // Let model decide tool choice freely
    const enforcedToolChoice = 'auto' as const;

    // Build tool context from auth + request
    // Tools receive this via closure for security (model can't manipulate)
    // @see /src/lib/chat/chat-types.ts ToolContext documentation
    const toolContext: ToolContext = {
      userId: auth.user.id,
      businessId: auth.business.id,
      projectId,
      sessionId,
    };

    const toolExecutors = createChatToolExecutors({
      toolContext,
      latestUserMessage,
    });

    let systemPrompt = UNIFIED_PROJECT_SYSTEM_PROMPT;
    try {
      const promptContext = await loadPromptContext({
        projectId,
        sessionId,
        businessId: auth.business.id,
        includeSummary,
      });
      systemPrompt = buildSystemPromptWithContext({
        basePrompt: UNIFIED_PROJECT_SYSTEM_PROMPT,
        summary: promptContext.summary,
        projectData: promptContext.projectData,
        businessProfile: promptContext.businessProfile,
        memory: promptContext.memory,
      });
    } catch (err) {
      console.warn('[ChatAPI] Failed to load prompt context:', err);
    }

    // Stream response with tool calling using Gemini 3.0 Flash
    const result = streamText({
      model: getChatModel(),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      activeTools,
      toolChoice: enforcedToolChoice,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingLevel: 'low',
          },
        },
      },
      // Enable Langfuse telemetry for observability
      // @see /src/lib/observability/traced-ai.ts
      experimental_telemetry: chatTelemetry({
        businessId: toolContext.businessId,
        projectId: toolContext.projectId,
        sessionId: toolContext.sessionId,
      }),
      // Tools have access to toolContext via closure for:
      // - userId: auth.users.id (for RLS)
      // - businessId: businesses.id (for ownership checks)
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
- Any scope details, constraints, outcomes, or proud moments

IMPORTANT: Only set ready_for_images to true when you have enough story to draft:
1. Specific project type
2. Customer problem (clear sentence)
3. Solution approach (clear sentence)
4. One differentiator (scope detail, constraint, or outcome)

Materials are optional. Location is a priority but not required to suggest photos.
If anything is too vague, ask a follow-up question instead of setting ready_for_images.
After extracting data with ready_for_images: true, you may call promptForImages.`,
          inputSchema: extractProjectDataSchema,
          execute: toolExecutors.extractProjectData,
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
          execute: toolExecutors.promptForImages,
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
          execute: toolExecutors.showPortfolioPreview,
        }),

        /**
         * Tool for displaying inline content editor UI.
         * Called after AI content generation to allow edits.
         * @see /src/lib/chat/tool-schemas.ts for schema definition
         */
        showContentEditor: tool({
          description: `Deprecated: inline editor is no longer shown in chat.
Do not call this tool. Instead, summarize the draft in chat and offer to open the editor panel (use suggestQuickActions with openForm).`,
          inputSchema: showContentEditorSchema,
          execute: toolExecutors.showContentEditor,
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
          execute: toolExecutors.requestClarification,
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
- Show the preview
- Insert a short suggested reply

Keep labels short and helpful. If type is "insert", include a value.`,
          inputSchema: suggestQuickActionsSchema,
          execute: toolExecutors.suggestQuickActions,
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
- The user has provided enough project details (project type, problem, solution, and one differentiator)
- The user asks to "generate content" or is ready to see their portfolio

This uses the ContentGenerator agent to create:
- A compelling project title (60 chars max)
- Professional description (300-500 words)
- SEO title and meta description
- Relevant tags for categorization

IMPORTANT: Only call this tool ONCE per user request. If it returns an error (e.g., "AI service is busy"),
do NOT retry. Instead, tell the user the service is busy and they should try again in a moment.
Never call this tool multiple times in a single response.

After generating, share the draft in the chat response and offer to open the editor panel for edits.`,
          inputSchema: generatePortfolioContentSchema,
          execute: toolExecutors.generatePortfolioContent,
        }),

        /**
         * Tool for composing structured description blocks and optional image order.
         * This is a deep-context tool; call only when explicitly asked.
         */
        composePortfolioLayout: tool({
          description: `Compose structured description blocks and optional image ordering.
Call this tool only when explicitly asked to refine layout or block structure.
Returns:
- blocks (DescriptionBlocks schema)
- optional imageOrder (image IDs)
- rationale, missingContext, confidence`,
          inputSchema: composePortfolioLayoutSchema,
          execute: toolExecutors.composePortfolioLayout,
        }),

        /**
         * Tool for composing full UI layout with design tokens and semantic blocks.
         * This is a deep-context tool; call only when explicitly asked for visual layout.
         *
         * @see /src/lib/agents/ui-composer.ts
         * @see /src/lib/design/tokens.ts
         * @see /src/lib/design/semantic-blocks.ts
         */
        composeUILayout: tool({
          description: `Compose a full UI layout with design tokens and semantic blocks.
Call this tool when the user asks to create or refine the visual design/layout of their portfolio.
Supports iterative refinement with feedback.

This uses the UI Composer agent to generate:
- Design tokens (layout style, spacing, typography, colors, image display, hero style)
- Semantic blocks (hero-section, before-after, paragraphs, stats, image-gallery, etc.)
- Rationale explaining design choices
- Confidence score

IMPORTANT: Only call this tool ONCE per user request. If it returns low confidence,
do NOT retry. Instead, ask the user for more specific feedback.

Use feedback parameter when iterating on an existing layout.
Use focusAreas to emphasize specific sections (hero, gallery, content, stats).
Use preserveElements to keep certain parts unchanged during iteration.`,
          inputSchema: composeUILayoutInputSchema,
          execute: toolExecutors.composeUILayout,
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
          execute: toolExecutors.checkPublishReady,
        }),

        /**
         * Tool for updating a specific project field (edit or refine).
         * ChatWizard handles the actual update on the client.
         */
        updateField: tool({
          description: `Update a specific field on the project.
Call this tool when the user wants to change the title, description, SEO, tags, materials, or techniques.`,
          inputSchema: updateFieldSchema,
          execute: toolExecutors.updateField,
        }),

        /**
         * Tool for regenerating content sections with AI guidance.
         * ChatWizard calls the regeneration endpoint.
         */
        regenerateSection: tool({
          description: `Regenerate a specific section (title, description, or SEO) with guidance.`,
          inputSchema: regenerateSectionSchema,
          execute: toolExecutors.regenerateSection,
        }),

        /**
         * Tool for reordering project images (first becomes hero).
         * ChatWizard applies the reorder via API.
         */
        reorderImages: tool({
          description: `Reorder project images. Use when the user wants to set a new hero or rearrange photos.`,
          inputSchema: reorderImagesSchema,
          execute: toolExecutors.reorderImages,
        }),

        /**
         * Tool for validating publish readiness against server rules.
         * ChatWizard performs the validation request.
         */
        validateForPublish: tool({
          description: `Validate publish readiness using server rules.
Call this when the user asks if they can publish or wants to see what's missing.`,
          inputSchema: validateForPublishSchema,
          execute: toolExecutors.validateForPublish,
        }),

        /**
         * Tool for updating structured description blocks.
         * ChatWizard applies block updates on the project.
         */
        updateDescriptionBlocks: tool({
          description: `Update structured description blocks for rich content.
Block types:
- paragraph {type:"paragraph", text}
- heading {type:"heading", level:"2"|"3", text}
- list {type:"list", style:"bullet"|"number", items:[...]}
- callout {type:"callout", variant:"info"|"tip"|"warning", title?, text}
- stats {type:"stats", items:[{label,value}]}
- quote {type:"quote", text, cite?}

Return the full blocks array with the intended layout.`,
          inputSchema: updateDescriptionBlocksSchema,
          execute: toolExecutors.updateDescriptionBlocks,
        }),

        /**
         * Tool for updating contractor business profile fields.
         * Allows the agent to update business info during conversation.
         *
         * @see /src/lib/chat/tool-schemas.ts for schema definition
         */
        updateContractorProfile: tool({
          description: `Update the contractor's business profile information.
Call this tool when the user wants to update their:
- Business name
- Location (city, state)
- Services offered
- Service areas
- Business description
- Contact info (phone, email, website)

Example: "Update my services to include chimney repair and tuckpointing"
Example: "Change my business name to Smith Masonry LLC"

The update is applied immediately to the contractor's profile.`,
          inputSchema: updateContractorProfileSchema,
          execute: toolExecutors.updateContractorProfile,
        }),

        /**
         * Tool for parallel Story + Design agent execution.
         * Runs both agents simultaneously for faster processing.
         *
         * ARCHITECTURE: Phase 10 - Orchestrator + Subagents Pattern
         * Story Agent extracts narrative while Design Agent composes layout.
         *
         * @see /todo/ai-sdk-phase-10-persona-agents.md
         * @see /src/lib/agents/orchestrator.ts delegateParallel()
         */
        processParallel: tool({
          description: `Run Story and Design agents in parallel for faster processing.
Call this tool when:
- User has just uploaded images (trigger: 'images_uploaded')
- Content is ready for layout composition (trigger: 'content_ready')
- User explicitly requests both story and design work (trigger: 'user_request')

This runs Story Agent (narrative extraction) and Design Agent (layout composition)
simultaneously, reducing total processing time.

Use skipStory if narrative is already complete and only layout is needed.
Use skipDesign if only story extraction is needed.

IMPORTANT: Only call this tool ONCE per user request. The parallel execution
handles both agents automatically. Do not call followed by separate agent tools.`,
          inputSchema: processParallelSchema,
          execute: toolExecutors.processParallel,
        }),
      },
      // Allow up to 15 tool steps for complex multi-tool responses
      // PHILOSOPHY: Trust the model to use the right number of steps
      // @see /docs/philosophy/agent-philosophy.md
      stopWhen: stepCountIs(15),
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

/**
 * Subagent Spawn Infrastructure
 *
 * Provides the core functionality for spawning and managing subagents.
 * Subagents are specialized AI instances that handle specific tasks:
 * - Story Agent: Conversation, image analysis, narrative
 * - Design Agent: Layout, tokens, visual composition
 * - Quality Agent: Assessment, advisory suggestions
 *
 * The spawn function calls generateText() with agent-specific prompts
 * and parses structured output.
 *
 * @see /todo/ai-sdk-phase-10-persona-agents.md
 * @see /.claude/skills/agent-builder/references/architectures.md
 */

import { generateText, Output, type UserModelMessage, type TextPart, type ImagePart } from 'ai';
import { google } from '@ai-sdk/google';
import { AI_MODELS, isGoogleAIEnabled } from '@/lib/ai/providers';
import type { ProjectImageState } from '../types';
import { downloadProjectImage } from '@/lib/storage/upload.server';
import type {
  SubagentType,
  SubagentContext,
  SubagentResult,
  StoryAgentResult,
  DesignAgentResult,
  QualityAgentResult,
  SpawnOptions,
  DelegationResult,
  DelegationRequest,
} from './types';
import {
  STORY_AGENT_PROMPT,
  STORY_AGENT_SCHEMA,
  buildStoryAgentContext,
} from './story-agent';
import {
  DESIGN_AGENT_PROMPT,
  DESIGN_AGENT_SCHEMA,
  buildDesignAgentContext,
} from './design-agent';
import {
  QUALITY_AGENT_PROMPT,
  QUALITY_AGENT_SCHEMA,
  buildQualityAgentContext,
} from './quality-agent';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_MAX_TOKENS = 2048;

// ============================================================================
// Multimodal Message Building
// ============================================================================

/**
 * Build a multimodal message with text and images for the AI SDK.
 *
 * For the Story Agent, this enables true multimodal understanding—
 * the model sees images directly rather than just text descriptions.
 *
 * @param textPrompt - The text portion of the message
 * @param images - Optional array of images with URLs
 * @returns CoreMessage with multimodal content
 *
 * @see https://sdk.vercel.ai/docs/foundations/prompts#multi-modal-messages
 */
async function buildMultimodalMessage(
  textPrompt: string,
  images?: ProjectImageState[]
): Promise<UserModelMessage> {
  // If no images, return simple text message
  if (!images || images.length === 0) {
    return {
      role: 'user',
      content: textPrompt,
    };
  }

  // Build content array with text first, then images
  const content: (TextPart | ImagePart)[] = [
    { type: 'text', text: textPrompt },
  ];

  // Add each image as an ImagePart
  for (const img of images) {
    const shouldDownload =
      Boolean(img.storagePath) &&
      (img.bucket === 'project-images-draft' || (img.url?.startsWith('/api/') ?? false));

    if (shouldDownload && img.storagePath) {
      const downloadResult = await downloadProjectImage(img.storagePath);
      if (!('error' in downloadResult)) {
        content.push({
          type: 'image',
          image: downloadResult.data,
          ...(downloadResult.contentType ? { mediaType: downloadResult.contentType } : {}),
        });
        continue;
      }
      console.warn('[buildMultimodalMessage] Draft image download failed:', downloadResult.error);
    }

    if (img.url && !img.url.startsWith('/api/')) {
      content.push({
        type: 'image',
        image: img.url,
      });
    }
  }

  return {
    role: 'user',
    content,
  };
}

/**
 * Default temperatures by subagent type.
 * - Story: Lower for consistent extraction
 * - Design: Higher for creative layouts
 * - Quality: Lower for consistent assessment
 */
const DEFAULT_TEMPERATURES: Record<SubagentType, number> = {
  story: 0.3,
  design: 0.7,
  quality: 0.2,
};

// ============================================================================
// Subagent Registry
// ============================================================================

/**
 * Registry of subagent configurations.
 * Maps subagent type to its prompt, schema, and context builder.
 */
const SUBAGENT_REGISTRY = {
  story: {
    prompt: STORY_AGENT_PROMPT,
    schema: STORY_AGENT_SCHEMA,
    buildContext: buildStoryAgentContext,
  },
  design: {
    prompt: DESIGN_AGENT_PROMPT,
    schema: DESIGN_AGENT_SCHEMA,
    buildContext: buildDesignAgentContext,
  },
  quality: {
    prompt: QUALITY_AGENT_PROMPT,
    schema: QUALITY_AGENT_SCHEMA,
    buildContext: buildQualityAgentContext,
  },
} as const;

// ============================================================================
// Spawn Function
// ============================================================================

/**
 * Spawn a subagent to handle a specific task.
 *
 * This is the core function that:
 * 1. Looks up the subagent's configuration
 * 2. Builds the context prompt
 * 3. Calls generateText() with structured output
 * 4. Returns the typed result
 *
 * @param type - Which subagent to spawn
 * @param context - Context data for the subagent
 * @param options - Optional configuration overrides
 * @returns The subagent's typed result
 *
 * @example
 * ```typescript
 * const result = await spawnSubagent('story', {
 *   projectState,
 *   userMessage: "I just finished a kitchen remodel",
 *   images: uploadedImages,
 * });
 *
 * if (result.success) {
 *   console.log('Narrative:', result.narrative);
 * }
 * ```
 */
export async function spawnSubagent<T extends SubagentType>(
  type: T,
  context: SubagentContext,
  options: SpawnOptions = {}
): Promise<
  T extends 'story'
    ? StoryAgentResult
    : T extends 'design'
      ? DesignAgentResult
      : QualityAgentResult
> {
  const _startTime = Date.now();

  // Type alias for the unwrapped return type (async function auto-wraps in Promise)
  type SubagentResultType = T extends 'story'
    ? StoryAgentResult
    : T extends 'design'
      ? DesignAgentResult
      : QualityAgentResult;

  // Check if AI is available
  if (!isGoogleAIEnabled()) {
    return createErrorResult(type, 'AI service not available', false) as SubagentResultType;
  }

  // Get subagent configuration
  const config = SUBAGENT_REGISTRY[type];
  if (!config) {
    return createErrorResult(type, `Unknown subagent type: ${type}`, false) as SubagentResultType;
  }

  // Build the user prompt with context
  const userPrompt = config.buildContext(context);

  // Determine model parameters
  const temperature = options.temperature ?? DEFAULT_TEMPERATURES[type];
  const maxOutputTokens = options.maxOutputTokens ?? DEFAULT_MAX_TOKENS;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Build the appropriate prompt format
    // @see https://sdk.vercel.ai/docs/foundations/prompts#multi-modal-messages
    //
    // Gemini is multimodal by default - no need to "switch modes".
    // We always use the messages format; buildMultimodalMessage handles
    // text-only vs text+images automatically.
    //
    // TYPE SAFETY NOTE: We cast to `any` because TypeScript can't narrow the union
    // of Zod schemas (STORY_AGENT_SCHEMA | DESIGN_AGENT_SCHEMA | QUALITY_AGENT_SCHEMA)
    // based on the `type` parameter. This is a compile-time limitation only.
    //
    // RUNTIME SAFETY: The Zod schema still validates the AI output at runtime.
    // If the schema changes or the AI returns invalid data, Zod will reject it
    // and `result` will be null (handled below).
    //
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schemaTyped = config.schema as any;

    // Story Agent gets images passed for vision understanding; others get text only
    const images = type === 'story' ? context.images : undefined;

    const generateTextOptions = {
      model: google(options.model ?? AI_MODELS.generation),
      output: Output.object({ schema: schemaTyped }),
      system: config.prompt,
      messages: [await buildMultimodalMessage(userPrompt, images)],
      maxOutputTokens,
      temperature,
      abortSignal: controller.signal,
    };

    // Call generateText with structured output
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { output: result } = await generateText(generateTextOptions) as { output: any };

    // Handle null result (schema validation failure)
    if (!result) {
      return createErrorResult(
        type,
        'Subagent returned invalid response',
        true
      ) as SubagentResultType;
    }

    // Add success metadata - cast result to expected shape since we used any for schema
    const typedResult = result as { confidence?: number };

    // Confidence is required in all schemas, so missing = schema mismatch
    // Use conservative default (0.5) and warn for debugging
    if (typedResult.confidence === undefined) {
      console.warn(`[spawnSubagent] ${type} agent did not return confidence score - using fallback`);
    }

    const enrichedResult = {
      ...result,
      success: true,
      confidence: typedResult.confidence ?? 0.5, // Conservative fallback
    };

    return enrichedResult as SubagentResultType;
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    const isRateLimit =
      error instanceof Error &&
      (error.message.includes('429') || error.message.includes('rate limit'));

    console.warn(`[spawnSubagent] ${type} agent failed:`, error instanceof Error ? error.message : error);

    return createErrorResult(
      type,
      isTimeout
        ? 'Subagent timed out'
        : isRateLimit
          ? 'AI service is busy, please try again'
          : `Subagent error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isTimeout || isRateLimit
    ) as SubagentResultType;
  } finally {
    // Always clean up the timeout to prevent memory leaks
    clearTimeout(timeoutId);
  }
}

/**
 * Create an error result for a subagent.
 */
function createErrorResult(
  type: SubagentType,
  error: string,
  retryable: boolean
): SubagentResult {
  const base = {
    success: false,
    error,
    retryable,
    confidence: 0,
  };

  switch (type) {
    case 'story':
      return {
        ...base,
        stateUpdates: {},
      } as StoryAgentResult;

    case 'design':
      return base as DesignAgentResult;

    case 'quality':
      return {
        ...base,
        assessment: {
          ready: false,
          confidence: 'low',
          checksPerformed: [],
        },
        suggestions: [],
        summaryMessage: error,
      } as QualityAgentResult;
  }
}

// ============================================================================
// Parallel Execution
// ============================================================================

/**
 * Spawn multiple subagents in parallel.
 *
 * Use this when subagents are independent and can run simultaneously.
 * Results are returned in the same order as requests.
 *
 * @param requests - Array of delegation requests
 * @returns Array of delegation results
 *
 * @example
 * ```typescript
 * // Story and Design can work in parallel for initial layout
 * const results = await spawnParallel([
 *   { subagent: 'story', context: storyContext },
 *   { subagent: 'design', context: designContext },
 * ]);
 * ```
 */
export async function spawnParallel(
  requests: DelegationRequest[]
): Promise<DelegationResult[]> {
  const startTime = Date.now();

  const promises = requests.map(async (request): Promise<DelegationResult> => {
    const subagentStart = Date.now();

    const result = await spawnSubagent(request.subagent, request.context, {
      timeout: request.timeout,
    });

    return {
      subagent: request.subagent,
      result,
      durationMs: Date.now() - subagentStart,
      wasParallel: true,
    };
  });

  const results = await Promise.all(promises);

  console.log(
    `[SpawnParallel] Completed ${requests.length} subagents in ${Date.now() - startTime}ms`
  );

  return results;
}

// ============================================================================
// Sequential Execution
// ============================================================================

/**
 * Spawn subagents sequentially, passing results between them.
 *
 * Use this when later subagents depend on earlier results.
 * Each subagent receives the updated context from previous subagents.
 *
 * @param requests - Array of delegation requests (in order)
 * @param mergeResults - Function to merge subagent results into context
 * @returns Array of delegation results
 *
 * @example
 * ```typescript
 * // Story extracts content, then Design uses it
 * const results = await spawnSequential(
 *   [
 *     { subagent: 'story', context: initialContext },
 *     { subagent: 'design', context: initialContext },
 *   ],
 *   (context, result) => ({
 *     ...context,
 *     projectState: {
 *       ...context.projectState,
 *       ...result.stateUpdates,
 *     },
 *   })
 * );
 * ```
 */
export async function spawnSequential(
  requests: DelegationRequest[],
  mergeResults: (
    context: SubagentContext,
    result: SubagentResult,
    subagent: SubagentType
  ) => SubagentContext
): Promise<DelegationResult[]> {
  const results: DelegationResult[] = [];
  let currentContext = requests[0]?.context;

  for (const request of requests) {
    const startTime = Date.now();

    // Use the evolving context
    const result = await spawnSubagent(request.subagent, currentContext ?? request.context, {
      timeout: request.timeout,
    });

    results.push({
      subagent: request.subagent,
      result,
      durationMs: Date.now() - startTime,
      wasParallel: false,
    });

    // Merge result into context for next subagent
    if (currentContext && result.success) {
      currentContext = mergeResults(currentContext, result, request.subagent);
    }
  }

  return results;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a subagent result indicates success.
 */
export function isSuccessfulResult(result: SubagentResult): boolean {
  return result.success && !result.error;
}

/**
 * Get the primary error message from a delegation result.
 */
export function getErrorMessage(result: DelegationResult): string | undefined {
  if (result.result.success) return undefined;
  return result.result.error;
}

/**
 * Merge multiple delegation results into a single project state update.
 */
export function mergeSubagentResults(
  baseState: SubagentContext['projectState'],
  results: DelegationResult[]
): SubagentContext['projectState'] {
  let merged = { ...baseState };

  for (const delegation of results) {
    if (!delegation.result.success) continue;

    const result = delegation.result;

    // Merge story agent updates
    if ('stateUpdates' in result && result.stateUpdates) {
      merged = {
        ...merged,
        ...result.stateUpdates,
        // Merge arrays intelligently
        materials: [
          ...new Set([...merged.materials, ...(result.stateUpdates.materials ?? [])]),
        ],
        techniques: [
          ...new Set([...merged.techniques, ...(result.stateUpdates.techniques ?? [])]),
        ],
        tags: [...new Set([...merged.tags, ...(result.stateUpdates.tags ?? [])])],
      };

      // Apply narrative if present
      if ('narrative' in result && result.narrative) {
        if (result.narrative.title) merged.title = result.narrative.title;
        if (result.narrative.description) merged.description = result.narrative.description;
      }
    }

    // Merge design agent updates
    if ('heroImageId' in result && result.heroImageId) {
      merged.heroImageId = result.heroImageId;
    }
  }

  return merged;
}

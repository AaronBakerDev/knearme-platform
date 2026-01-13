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

import { generateText, Output, type FlexibleSchema, type UserModelMessage, type TextPart, type ImagePart } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { AI_MODELS, isGoogleAIEnabled } from '@/lib/ai/providers';
import { withCircuitBreaker } from '@/lib/agents/circuit-breaker';
import { isRateLimitError, isTimeoutError } from '@/lib/api/errors';
import type { ProjectImageState } from '../types';
import { downloadProjectImage } from '@/lib/storage/upload.server';
import { logger } from '@/lib/logging';
import {
  createAgentLogger,
  createCorrelationContext,
  type CorrelationContext,
} from '@/lib/observability/agent-logger';
import { getTelemetryConfig } from '@/lib/observability/langfuse';
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
// Response Validation
// ============================================================================

/**
 * Base schema for validating subagent responses.
 * Uses safeParse to catch malformed AI responses gracefully.
 *
 * All subagent responses must have at minimum:
 * - success: boolean indicating if the subagent completed its task
 * - confidence: number between 0-1 indicating certainty
 *
 * Optional fields that may be present:
 * - stateUpdates: partial state updates from story agent
 * - message: optional message to display
 */
const BaseSubagentResultSchema = z.object({
  success: z.boolean().optional().default(true),
  confidence: z.number().min(0).max(1).optional(),
  stateUpdates: z.record(z.string(), z.unknown()).optional(),
  message: z.string().optional(),
}).passthrough(); // Allow additional fields from specific subagent schemas

// ============================================================================
// Multimodal Message Building
// ============================================================================

/** Timeout for individual image downloads (10 seconds) */
const IMAGE_DOWNLOAD_TIMEOUT = 10000;

/** Maximum concurrent image downloads to avoid overwhelming storage service */
const MAX_PARALLEL_DOWNLOADS = 5;

/**
 * Download result with metadata for parallel processing
 */
interface ImageDownloadResult {
  success: boolean;
  image?: ProjectImageState;
  data?: Buffer | Uint8Array;
  contentType?: string;
  error?: string;
}

/**
 * Download an image with timeout protection.
 * Returns error result instead of throwing on failure.
 */
async function downloadWithTimeout(
  storagePath: string,
  timeout: number
): Promise<ImageDownloadResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Note: downloadProjectImage doesn't support AbortSignal natively,
    // so we race it against a timeout promise
    const downloadPromise = downloadProjectImage(storagePath);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Download timeout'));
      }, timeout);
    });

    const result = await Promise.race([downloadPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    if ('error' in result) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: result.data,
      contentType: result.contentType,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    // Use centralized error type detection helpers
    // @see src/lib/api/errors.ts for pattern definitions
    if (isTimeoutError(error)) {
      logger.warn('[buildMultimodalMessage] Download timeout', { storagePath });
      return { success: false, error: 'Download timeout' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build a multimodal message with text and images for the AI SDK.
 *
 * For the Story Agent, this enables true multimodal understanding—
 * the model sees images directly rather than just text descriptions.
 *
 * PERFORMANCE: Downloads images in parallel (up to MAX_PARALLEL_DOWNLOADS)
 * with timeout protection to prevent slow image downloads from blocking
 * the entire request.
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

  // Separate images that need downloading from those that can use URLs directly
  const imagesToDownload: { image: ProjectImageState; storagePath: string }[] = [];
  const urlImages: ProjectImageState[] = [];

  for (const img of images) {
    const shouldDownload =
      Boolean(img.storagePath) &&
      (img.bucket === 'project-images-draft' || (img.url?.startsWith('/api/') ?? false));

    if (shouldDownload && img.storagePath) {
      imagesToDownload.push({ image: img, storagePath: img.storagePath });
    } else if (img.url && !img.url.startsWith('/api/')) {
      urlImages.push(img);
    }
  }

  // Download images in parallel with timeout, limited to MAX_PARALLEL_DOWNLOADS
  if (imagesToDownload.length > 0) {
    // Process in batches to limit concurrency
    const batches = [];
    for (let i = 0; i < imagesToDownload.length; i += MAX_PARALLEL_DOWNLOADS) {
      batches.push(imagesToDownload.slice(i, i + MAX_PARALLEL_DOWNLOADS));
    }

    for (const batch of batches) {
      const downloadPromises = batch.map(async ({ image, storagePath }) => {
        const result = await downloadWithTimeout(storagePath, IMAGE_DOWNLOAD_TIMEOUT);
        return { image, result };
      });

      const batchResults = await Promise.allSettled(downloadPromises);

      for (const settledResult of batchResults) {
        if (settledResult.status === 'rejected') {
          logger.warn('[buildMultimodalMessage] Parallel download rejected', {
            reason: settledResult.reason,
          });
          continue;
        }

        const { image, result } = settledResult.value;

        if (result.success && result.data) {
          content.push({
            type: 'image',
            image: result.data,
            ...(result.contentType ? { mediaType: result.contentType } : {}),
          });
        } else {
          // Fallback to URL if download failed and URL is available
          if (image.url && !image.url.startsWith('/api/')) {
            logger.info('[buildMultimodalMessage] Falling back to URL after download failure', {
              storagePath: image.storagePath,
            });
            content.push({
              type: 'image',
              image: image.url,
            });
          } else {
            logger.warn('[buildMultimodalMessage] Image download failed, no fallback URL', {
              storagePath: image.storagePath,
              error: result.error,
            });
          }
        }
      }
    }
  }

  // Add URL-based images directly
  for (const img of urlImages) {
    content.push({
      type: 'image',
      image: img.url!,
    });
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
 *   logger.info('Narrative', { narrative: result.narrative });
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
  const startTime = Date.now();

  // Type alias for the unwrapped return type (async function auto-wraps in Promise)
  type SubagentResultType = T extends 'story'
    ? StoryAgentResult
    : T extends 'design'
      ? DesignAgentResult
      : QualityAgentResult;

  // Create correlation context for observability
  // @see /docs/philosophy/operational-excellence.md - Observability Strategy
  const correlationCtx = options.correlationContext
    ? createCorrelationContext(
        options.correlationContext.conversationId,
        options.correlationContext.contractorId,
        options.correlationContext.projectId
      )
    : createCorrelationContext('unknown', 'unknown', undefined);

  // Create agent logger for this subagent
  // Maps subagent type to AgentType (story -> story, etc.)
  const agentLogger = createAgentLogger(type, correlationCtx);
  agentLogger.start({
    subagentType: type,
    hasUserMessage: Boolean(context.userMessage),
    imageCount: context.images?.length ?? 0,
    projectStateFields: Object.keys(context.projectState).filter(
      k => context.projectState[k as keyof typeof context.projectState]
    ).length,
  });

  // Check if AI is available
  if (!isGoogleAIEnabled()) {
    agentLogger.decision('AI not available - returning error', {
      confidence: 0,
      decision: 'blocked_no_ai',
    });
    agentLogger.error(new Error('AI service not available'), { reason: 'ai_disabled' });
    return createErrorResult(type, 'AI service not available', false) as SubagentResultType;
  }

  // Get subagent configuration
  const config = SUBAGENT_REGISTRY[type];
  if (!config) {
    agentLogger.error(new Error(`Unknown subagent type: ${type}`), { reason: 'invalid_type' });
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
    // TYPE SAFETY NOTE: TypeScript can't narrow the union of Zod schemas
    // based on the `type` parameter, so we cast through unknown to the expected type.
    // This is safe because the schemas are properly typed in each agent's definition.
    const schemaTyped = config.schema as unknown as FlexibleSchema<SubagentResultType>;

    // Story Agent gets images passed for vision understanding; others get text only
    const images = type === 'story' ? context.images : undefined;

    // Build the message before the circuit breaker call
    // (async prep work that doesn't need protection)
    const userMessage = await buildMultimodalMessage(userPrompt, images);

    // Call generateText with structured output, wrapped in circuit breaker
    // Each subagent type has its own circuit breaker for independent failure tracking
    // @see /docs/philosophy/operational-excellence.md - Resilience Strategy
    const { output: result } = await withCircuitBreaker(type, async () => {
      return generateText({
        model: google(options.model ?? AI_MODELS.generation),
        output: Output.object<SubagentResultType>({ schema: schemaTyped }),
        system: config.prompt,
        messages: [userMessage],
        maxOutputTokens,
        temperature,
        abortSignal: controller.signal,
        // Enable Langfuse tracing via OpenTelemetry
        // @see /src/lib/observability/langfuse.ts
        experimental_telemetry: getTelemetryConfig({
          functionId: `subagent-${type}`,
          metadata: {
            agent: type,
            subagentType: type,
            hasImages: Boolean(images?.length),
          },
        }),
      });
    });

    // Handle null result (schema validation failure from AI SDK)
    if (!result) {
      return createErrorResult(
        type,
        'Subagent returned null response',
        true
      ) as SubagentResultType;
    }

    // Validate response structure using safeParse for resilience
    // This catches malformed AI responses that pass the AI SDK schema
    // but don't match our expected structure
    const validation = BaseSubagentResultSchema.safeParse(result);
    if (!validation.success) {
      logger.warn('[spawnSubagent] Invalid response structure', {
        subagent: type,
        errors: validation.error.issues, // Zod v4 uses 'issues' instead of 'errors'
        rawResult: JSON.stringify(result).slice(0, 200), // Truncate for logs
      });
      return createErrorResult(
        type,
        'Subagent returned invalid response structure',
        true
      ) as SubagentResultType;
    }

    // Extract validated result and handle missing confidence
    const validatedResult = validation.data;
    const hasValidConfidence =
      typeof validatedResult.confidence === 'number' &&
      Number.isFinite(validatedResult.confidence);
    // Explicitly type as number to satisfy TypeScript after the hasValidConfidence check
    const confidence: number = hasValidConfidence ? (validatedResult.confidence as number) : 0.5;

    if (!hasValidConfidence) {
      logger.warn('[spawnSubagent] Missing confidence score, using fallback', {
        subagent: type,
      });
    }

    const enrichedResult = {
      ...result,
      success: true,
      confidence, // Use validated or fallback
    };

    // Log successful subagent completion
    agentLogger.decision(`${type} subagent completed successfully`, {
      confidence,
      decision: 'subagent_success',
      observations: [
        `Confidence: ${(confidence * 100).toFixed(0)}%`,
        hasValidConfidence ? 'Model provided confidence' : 'Using fallback confidence',
      ],
    });

    agentLogger.complete({
      durationMs: Date.now() - startTime,
      confidence,
      hasStateUpdates: 'stateUpdates' in result && Boolean(result.stateUpdates),
    });

    return enrichedResult as SubagentResultType;
  } catch (error) {
    // Use centralized error type detection helpers
    // @see src/lib/api/errors.ts for pattern definitions
    const timeoutErr = isTimeoutError(error);
    const rateLimit = isRateLimitError(error);

    const errorMessage = timeoutErr
      ? 'Subagent timed out'
      : rateLimit
        ? 'AI service is busy, please try again'
        : `Subagent error: ${error instanceof Error ? error.message : 'Unknown error'}`;

    agentLogger.error(error instanceof Error ? error : new Error(String(error)), {
      isTimeout: timeoutErr,
      isRateLimit: rateLimit,
      retryable: timeoutErr || rateLimit,
      durationMs: Date.now() - startTime,
    });

    logger.warn('[spawnSubagent] Subagent failed', {
      subagent: type,
      error,
    });

    return createErrorResult(type, errorMessage, timeoutErr || rateLimit) as SubagentResultType;
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

  logger.info('[SpawnParallel] Completed subagents', {
    count: requests.length,
    durationMs: Date.now() - startTime,
  });

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

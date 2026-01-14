/**
 * Gemini 3.0 Flash image analysis for contractor project detection.
 *
 * Uses Vercel AI SDK with Google provider for type-safe structured outputs.
 *
 * Trade-agnostic: Analyzes project photos to identify:
 * - Project type (inferred from visual content)
 * - Materials used (trade-specific vocabulary)
 * - Techniques demonstrated
 * - Before/after/progress status
 *
 * The model infers the trade context from images without assumptions.
 *
 * @see /docs/03-architecture/c4-container.md for AI pipeline flow
 * @see https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
 */

import { generateText, Output, type DataContent } from 'ai';
import { getVisionModel, isGoogleAIEnabled, OUTPUT_LIMITS, validateTokenLimit, TOKEN_LIMITS } from './providers';
import { IMAGE_ANALYSIS_PROMPT, buildImageAnalysisMessage } from './prompts';
import { ImageAnalysisSchema } from './schemas';
import { withRetry, AI_RETRY_OPTIONS } from './retry';
import { logger } from '@/lib/logging';
import {
  createAgentLogger,
  createCorrelationContext,
  type CorrelationContext,
} from '@/lib/observability/agent-logger';
import { getTelemetryConfig } from '@/lib/observability/langfuse';

/**
 * Result of analyzing project images.
 */
export interface ImageAnalysisResult {
  /** Primary type of work detected (trade-agnostic) */
  project_type: string;
  /** Confidence in project type detection (0-1) */
  project_type_confidence: number;
  /** Materials identified in the images */
  materials: string[];
  /** Techniques observed */
  techniques: string[];
  /** Stage of the project (before/during/after) */
  image_stage: 'before' | 'during' | 'after' | 'detail' | 'unknown';
  /** Notes about craftsmanship quality */
  quality_notes: string;
  /** Keywords for title generation */
  suggested_title_keywords: string[];
  /**
   * AI-generated alt texts for each image, keyed by index ("0", "1", etc.).
   * Format: "[What's visible] - [Project context/stage] - [Location/area]"
   */
  image_alt_texts: Record<string, string>;
}

/**
 * Default result when analysis fails or is unavailable.
 */
const DEFAULT_ANALYSIS: ImageAnalysisResult = {
  project_type: 'project',
  project_type_confidence: 0,
  materials: [],
  techniques: [],
  image_stage: 'unknown',
  quality_notes: '',
  suggested_title_keywords: ['project', 'work'],
  image_alt_texts: {},
};

/**
 * Options for image analysis with optional observability context.
 */
export interface ImageAnalysisOptions {
  /** Correlation context for observability - links to conversation trace */
  correlationContext?: CorrelationContext;
  /** Business ID for RLS context (used if no correlationContext provided) */
  businessId?: string;
  /** Conversation ID for tracing (used if no correlationContext provided) */
  conversationId?: string;
}

/**
 * Analyze project images using Gemini 3.0 Flash with AI SDK.
 *
 * @param imageInputs - Image inputs (URLs or raw data) to analyze (max 4 for cost control)
 * @param options - Optional analysis options including observability context
 * @returns Analysis result or error
 *
 * @example
 * const result = await analyzeProjectImages([
 *   'https://storage.example.com/project-images/contractor1/project1/photo1.webp',
 *   'https://storage.example.com/project-images/contractor1/project1/photo2.webp',
 * ], { conversationId: 'conv_123', businessId: 'biz_456' });
 *
 * if ('error' in result) {
 *   // Handle error result
 * } else {
 *   const { project_type } = result; // "chimney-rebuild"
 * }
 */
export async function analyzeProjectImages(
  imageInputs: Array<string | { data: DataContent; mediaType?: string }>,
  options?: ImageAnalysisOptions
): Promise<ImageAnalysisResult | { error: string; retryable: boolean }> {
  // Create correlation context for observability
  // @see /docs/philosophy/operational-excellence.md - Observability Strategy
  const correlationCtx = options?.correlationContext ?? createCorrelationContext(
    options?.conversationId ?? 'unknown',
    options?.businessId ?? 'unknown',
    undefined
  );

  const agentLogger = createAgentLogger('image-analysis', correlationCtx, 'images');
  agentLogger.start({
    imageCount: imageInputs.length,
    inputTypes: imageInputs.map(i => typeof i === 'string' ? 'url' : 'data'),
  });

  // Check if AI is available
  if (!isGoogleAIEnabled()) {
    agentLogger.decision('AI not available - returning defaults', {
      confidence: 0,
      decision: 'fallback_defaults',
    });
    agentLogger.complete({ method: 'fallback', reason: 'ai_not_enabled' });
    logger.warn('[analyzeProjectImages] Google AI not enabled, returning defaults');
    return DEFAULT_ANALYSIS;
  }

  // Limit images to control costs (charges per image)
  const limitedInputs = imageInputs.slice(0, 4);

  if (limitedInputs.length === 0) {
    agentLogger.error(new Error('No images provided'), { reason: 'empty_input' });
    return { error: 'No images provided for analysis', retryable: false };
  }

  // Build prompt for token validation
  const userPrompt = buildImageAnalysisMessage(limitedInputs.length);

  // Validate token limits before making request
  const tokenValidation = validateTokenLimit(
    {
      systemPrompt: IMAGE_ANALYSIS_PROMPT,
      userPrompt,
      images: limitedInputs.length,
    },
    TOKEN_LIMITS.imageAnalysisInput
  );

  if (!tokenValidation.valid) {
    agentLogger.decision('Token limit exceeded - blocking request', {
      confidence: 0,
      decision: 'blocked_token_limit',
    });
    agentLogger.error(new Error('Token limit exceeded'), {
      estimated: tokenValidation.estimated,
      limit: tokenValidation.limit,
    });
    logger.warn('[analyzeProjectImages] Token limit exceeded', {
      estimated: tokenValidation.estimated,
      limit: tokenValidation.limit,
    });
    return {
      error: tokenValidation.message || 'Request too large for AI processing',
      retryable: false,
    };
  }

  try {
    /**
     * Build multimodal content array for AI SDK.
     * Format: [{ type: 'text', text: ... }, { type: 'image', image: URL }, ...]
     *
     * @see https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data#multimodal-inputs
     */
    const content: Array<
      { type: 'text'; text: string } | { type: 'image'; image: URL | DataContent; mediaType?: string }
    > = [
      { type: 'text', text: userPrompt },
      ...limitedInputs.map((input) => {
        if (typeof input === 'string') {
          return {
            type: 'image' as const,
            image: new URL(input),
          };
        }

        return {
          type: 'image' as const,
          image: input.data,
          ...(input.mediaType ? { mediaType: input.mediaType } : {}),
        };
      }),
    ];

    // Wrap in retry logic for transient failures (rate limits, timeouts)
    const { output: object } = await withRetry(
      () =>
        generateText({
          model: getVisionModel(),
          output: Output.object({ schema: ImageAnalysisSchema }),
          system: IMAGE_ANALYSIS_PROMPT,
          messages: [{ role: 'user', content }],
          maxOutputTokens: OUTPUT_LIMITS.imageAnalysis,
          // Enable Langfuse tracing via OpenTelemetry
          // @see /src/lib/observability/langfuse.ts
          experimental_telemetry: getTelemetryConfig({
            functionId: 'image-analysis',
            metadata: {
              agent: 'image-analysis',
              imageCount: limitedInputs.length,
            },
          }),
        }),
      AI_RETRY_OPTIONS
    );

    if (!object || !object.project_type) {
      agentLogger.decision('No project type detected - returning defaults', {
        confidence: 0.3,
        decision: 'fallback_no_detection',
      });
      agentLogger.complete({ method: 'fallback', reason: 'no_project_type' });
      return DEFAULT_ANALYSIS;
    }

    // Handle unrecognized work types gracefully
    if (object.project_type === 'unknown' || object.project_type === 'not_construction') {
      agentLogger.decision('Unrecognized work type', {
        confidence: object.project_type_confidence ?? 0.3,
        decision: 'unknown_project_type',
        observations: ['Image does not appear to show construction or trade work'],
      });
      agentLogger.complete({
        projectType: object.project_type,
        confidence: object.project_type_confidence ?? 0.3,
      });
      return {
        ...DEFAULT_ANALYSIS,
        quality_notes: 'Image does not appear to show construction or trade work',
      };
    }

    const result: ImageAnalysisResult = {
      project_type: object.project_type || DEFAULT_ANALYSIS.project_type,
      project_type_confidence: object.project_type_confidence ?? 0.5,
      materials: object.materials || [],
      techniques: object.techniques || [],
      image_stage: object.image_stage || 'unknown',
      quality_notes: object.quality_notes || '',
      suggested_title_keywords: object.suggested_title_keywords || [],
      image_alt_texts: object.image_alt_texts || {},
    };

    // Log successful analysis
    agentLogger.decision('Image analysis completed', {
      confidence: result.project_type_confidence,
      decision: 'analysis_complete',
      observations: [
        `Detected: ${result.project_type}`,
        `Materials: ${result.materials.length}`,
        `Techniques: ${result.techniques.length}`,
        `Stage: ${result.image_stage}`,
      ],
    });

    agentLogger.complete({
      projectType: result.project_type,
      confidence: result.project_type_confidence,
      materialCount: result.materials.length,
      techniqueCount: result.techniques.length,
      imageStage: result.image_stage,
    });

    return result;
  } catch (error) {
    // Parse and categorize errors
    const aiError = parseImageAnalysisError(error);
    agentLogger.error(error instanceof Error ? error : new Error(String(error)), {
      retryable: aiError.retryable,
      parsedError: aiError.message,
    });
    logger.error('[analyzeProjectImages] Error', { error: aiError });
    return { error: aiError.message, retryable: aiError.retryable };
  }
}

/**
 * Parse errors from image analysis into user-friendly messages.
 */
function parseImageAnalysisError(error: unknown): { message: string; retryable: boolean } {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Rate limiting
    if (message.includes('rate') || message.includes('quota') || message.includes('429')) {
      return {
        message: 'AI service is busy. Please try again in a moment.',
        retryable: true,
      };
    }

    // Context/token limits
    if (message.includes('token') || message.includes('length') || message.includes('too long')) {
      return {
        message: 'Images are too large for AI processing. Please use smaller images.',
        retryable: false,
      };
    }

    // Content filtering
    if (message.includes('safety') || message.includes('blocked') || message.includes('filter')) {
      return {
        message: 'Content was flagged by safety filters. Please try different images.',
        retryable: false,
      };
    }

    // Network/timeout
    if (message.includes('timeout') || message.includes('network') || message.includes('fetch')) {
      return {
        message: 'AI request timed out. Please try again.',
        retryable: true,
      };
    }

    // Invalid image URL
    if (message.includes('url') || message.includes('image') || message.includes('400')) {
      return {
        message: 'Could not load one or more images. Please check the image URLs.',
        retryable: false,
      };
    }

    // API key issues
    if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
      return {
        message: 'AI service configuration error. Please contact support.',
        retryable: false,
      };
    }

    return {
      message: error.message,
      retryable: true,
    };
  }

  return {
    message: 'An unexpected error occurred with AI processing.',
    retryable: true,
  };
}

/**
 * Map project type to a URL-friendly slug.
 * Used for SEO routing: /{city}/{trade}/{project-type-slug}/{slug}
 *
 * NOTE: This includes common masonry types for backward compatibility.
 * New project types are normalized automatically via the fallback logic.
 * As more trades are added, their common types can be added here.
 */
export function projectTypeToSlug(projectType: string): string {
  const slugMap: Record<string, string> = {
    'chimney-rebuild': 'chimney-rebuild',
    'chimney rebuild': 'chimney-rebuild',
    'chimney repair': 'chimney-repair',
    'tuckpointing': 'tuckpointing',
    'brick repair': 'brick-repair',
    'stone wall': 'stone-wall',
    'stone-wall': 'stone-wall',
    'patio': 'patio',
    'walkway': 'walkway',
    'patio/walkway': 'patio-walkway',
    'fireplace': 'fireplace',
    'foundation repair': 'foundation-repair',
    'retaining wall': 'retaining-wall',
    'retaining-wall': 'retaining-wall',
    'masonry project': 'masonry',
    'masonry-project': 'masonry',
  };

  const normalized = projectType.toLowerCase().trim();
  return slugMap[normalized] || normalized.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Get human-readable project type name.
 *
 * NOTE: This includes common masonry types for backward compatibility.
 * Unknown types are title-cased automatically via the fallback logic.
 */
export function projectTypeToDisplay(projectType: string): string {
  const displayMap: Record<string, string> = {
    'chimney-rebuild': 'Chimney Rebuild',
    'chimney-repair': 'Chimney Repair',
    'tuckpointing': 'Tuckpointing',
    'brick-repair': 'Brick Repair',
    'stone-wall': 'Stone Wall',
    'patio': 'Patio',
    'walkway': 'Walkway',
    'patio-walkway': 'Patio & Walkway',
    'fireplace': 'Fireplace',
    'foundation-repair': 'Foundation Repair',
    'retaining-wall': 'Retaining Wall',
    'masonry': 'Masonry Project',
  };

  const slug = projectTypeToSlug(projectType);
  return displayMap[slug] || projectType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

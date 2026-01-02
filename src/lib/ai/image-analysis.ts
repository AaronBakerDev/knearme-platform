/**
 * Gemini 3.0 Flash image analysis for masonry project detection.
 *
 * Uses Vercel AI SDK with Google provider for type-safe structured outputs.
 *
 * Analyzes project photos to identify:
 * - Project type (chimney, tuckpointing, etc.)
 * - Materials used (brick type, mortar, stone)
 * - Techniques demonstrated
 * - Before/after/progress status
 *
 * @see /docs/03-architecture/c4-container.md for AI pipeline flow
 * @see https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
 */

import { generateText, Output } from 'ai';
import { getVisionModel, isGoogleAIEnabled, OUTPUT_LIMITS, validateTokenLimit, TOKEN_LIMITS } from './providers';
import { IMAGE_ANALYSIS_PROMPT, buildImageAnalysisMessage } from './prompts';
import { ImageAnalysisSchema } from './schemas';
import { withRetry, AI_RETRY_OPTIONS } from './retry';

/**
 * Result of analyzing project images.
 */
export interface ImageAnalysisResult {
  /** Primary type of masonry work detected */
  project_type: string;
  /** Confidence in project type detection (0-1) */
  project_type_confidence: number;
  /** Materials identified in the images */
  materials: string[];
  /** Masonry techniques observed */
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
  project_type: 'masonry-project',
  project_type_confidence: 0,
  materials: [],
  techniques: [],
  image_stage: 'unknown',
  quality_notes: '',
  suggested_title_keywords: ['masonry', 'project'],
  image_alt_texts: {},
};

/**
 * Analyze project images using Gemini 3.0 Flash with AI SDK.
 *
 * @param imageUrls - Public URLs of images to analyze (max 4 for cost control)
 * @returns Analysis result or error
 *
 * @example
 * const result = await analyzeProjectImages([
 *   'https://storage.example.com/project-images/contractor1/project1/photo1.webp',
 *   'https://storage.example.com/project-images/contractor1/project1/photo2.webp',
 * ]);
 *
 * if ('error' in result) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.project_type); // "chimney-rebuild"
 * }
 */
export async function analyzeProjectImages(
  imageUrls: string[]
): Promise<ImageAnalysisResult | { error: string; retryable: boolean }> {
  // Check if AI is available
  if (!isGoogleAIEnabled()) {
    console.warn('[analyzeProjectImages] Google AI not enabled, returning defaults');
    return DEFAULT_ANALYSIS;
  }

  // Limit images to control costs (charges per image)
  const limitedUrls = imageUrls.slice(0, 4);

  if (limitedUrls.length === 0) {
    return { error: 'No images provided for analysis', retryable: false };
  }

  // Build prompt for token validation
  const userPrompt = buildImageAnalysisMessage(limitedUrls);

  // Validate token limits before making request
  const tokenValidation = validateTokenLimit(
    {
      systemPrompt: IMAGE_ANALYSIS_PROMPT,
      userPrompt,
      images: limitedUrls.length,
    },
    TOKEN_LIMITS.imageAnalysisInput
  );

  if (!tokenValidation.valid) {
    console.warn(
      `[analyzeProjectImages] Token limit exceeded: ${tokenValidation.estimated} > ${tokenValidation.limit}`
    );
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
    const content: Array<{ type: 'text'; text: string } | { type: 'image'; image: URL }> = [
      { type: 'text', text: userPrompt },
      ...limitedUrls.map((url) => ({
        type: 'image' as const,
        image: new URL(url),
      })),
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
        }),
      AI_RETRY_OPTIONS
    );

    if (!object || !object.project_type) {
      return DEFAULT_ANALYSIS;
    }

    // Handle non-masonry images gracefully
    if (object.project_type === 'not_masonry') {
      return {
        ...DEFAULT_ANALYSIS,
        quality_notes: 'Image does not appear to show masonry work',
      };
    }

    return {
      project_type: object.project_type || DEFAULT_ANALYSIS.project_type,
      project_type_confidence: object.project_type_confidence ?? 0.5,
      materials: object.materials || [],
      techniques: object.techniques || [],
      image_stage: object.image_stage || 'unknown',
      quality_notes: object.quality_notes || '',
      suggested_title_keywords: object.suggested_title_keywords || [],
      image_alt_texts: object.image_alt_texts || {},
    };
  } catch (error) {
    // Parse and categorize errors
    const aiError = parseImageAnalysisError(error);
    console.error('[analyzeProjectImages] Error:', aiError);
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
 * Used for SEO routing: /{city}/masonry/{project-type-slug}/{slug}
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

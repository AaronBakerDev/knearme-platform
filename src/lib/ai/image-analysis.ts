/**
 * GPT-4o image analysis for masonry project detection.
 *
 * Uses OpenAI Responses API with structured outputs for type-safe parsing.
 *
 * Analyzes project photos to identify:
 * - Project type (chimney, tuckpointing, etc.)
 * - Materials used (brick type, mortar, stone)
 * - Techniques demonstrated
 * - Before/after/progress status
 *
 * @see /docs/03-architecture/c4-container.md for AI pipeline flow
 * @see https://platform.openai.com/docs/guides/structured-outputs
 */

import OpenAI from 'openai';
import { LengthFinishReasonError, ContentFilterFinishReasonError } from 'openai/core/error';
import { zodTextFormat } from 'openai/helpers/zod';
import { openai, AI_MODELS, OUTPUT_LIMITS, parseAIError, isAIEnabled } from './openai';
import { IMAGE_ANALYSIS_PROMPT, buildImageAnalysisMessage } from './prompts';
import { ImageAnalysisSchema } from './schemas';

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
 * Analyze project images using GPT-4o with Responses API.
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
  if (!isAIEnabled()) {
    console.warn('[analyzeProjectImages] AI not enabled, returning defaults');
    return DEFAULT_ANALYSIS;
  }

  // Limit images to control costs (GPT-4o charges per image)
  const limitedUrls = imageUrls.slice(0, 4);

  if (limitedUrls.length === 0) {
    return { error: 'No images provided for analysis', retryable: false };
  }

  try {
    // Build input array with text prompt + images for Responses API
    const inputContent: OpenAI.Responses.ResponseInputItem[] = [
      {
        type: 'message',
        role: 'user',
        content: [
          { type: 'input_text', text: buildImageAnalysisMessage(limitedUrls) },
          ...limitedUrls.map((url) => ({
            type: 'input_image' as const,
            image_url: url,
            detail: 'auto' as const, // Let API choose detail level based on image size
          })),
        ],
      },
    ];

    const response = await openai.responses.parse({
      model: AI_MODELS.vision,
      instructions: IMAGE_ANALYSIS_PROMPT,
      input: inputContent,
      text: {
        format: zodTextFormat(ImageAnalysisSchema, 'image_analysis'),
      },
      max_output_tokens: OUTPUT_LIMITS.imageAnalysis,
    });

    const parsed = response.output_parsed;

    if (!parsed || !parsed.project_type) {
      return DEFAULT_ANALYSIS;
    }

    // Handle non-masonry images gracefully
    if (parsed.project_type === 'not_masonry') {
      return {
        ...DEFAULT_ANALYSIS,
        quality_notes: 'Image does not appear to show masonry work',
      };
    }

    return {
      project_type: parsed.project_type || DEFAULT_ANALYSIS.project_type,
      project_type_confidence: parsed.project_type_confidence ?? 0.5,
      materials: parsed.materials || [],
      techniques: parsed.techniques || [],
      image_stage: parsed.image_stage || 'unknown',
      quality_notes: parsed.quality_notes || '',
      suggested_title_keywords: parsed.suggested_title_keywords || [],
      image_alt_texts: parsed.image_alt_texts || {},
    };
  } catch (error) {
    // Handle Responses API specific errors (thrown by responses.parse() helper)
    if (error instanceof LengthFinishReasonError) {
      console.error('[analyzeProjectImages] Response truncated');
      return { error: 'Analysis response was too long', retryable: true };
    }
    if (error instanceof ContentFilterFinishReasonError) {
      console.error('[analyzeProjectImages] Content filtered');
      return { error: 'Content was flagged by safety filters', retryable: false };
    }

    const aiError = parseAIError(error);
    console.error('[analyzeProjectImages] Error:', aiError);
    return { error: aiError.message, retryable: aiError.retryable };
  }
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

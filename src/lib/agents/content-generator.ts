/**
 * Content Generator Agent
 *
 * Creates polished, SEO-optimized content from extracted project data.
 * Uses Gemini AI to generate professional portfolio content that highlights
 * craftsmanship, problem-solving, and trade expertise.
 *
 * Trade-agnostic: Works for any business type. The model infers
 * appropriate terminology from the project data.
 *
 * @see /docs/09-agent/multi-agent-architecture.md
 * @see /src/lib/ai/providers.ts for model configuration
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { getGenerationModel, isGoogleAIEnabled, OUTPUT_LIMITS } from '@/lib/ai/providers';
import { formatProjectLocation } from '@/lib/utils/location';
import type { SharedProjectState, ContentGenerationResult } from './types';

// ============================================================================
// Schema
// ============================================================================

/**
 * Zod schema for AI-generated content.
 * Enforces character limits and required fields.
 */
const ContentGenerationSchema = z.object({
  title: z.string().max(60).describe('Compelling project title (max 60 chars)'),
  description: z.string().describe('Professional description (300-500 words)'),
  seoTitle: z.string().max(60).describe('SEO-optimized page title (max 60 chars)'),
  seoDescription: z.string().max(160).describe('Meta description (max 160 chars)'),
  tags: z.array(z.string()).describe('Relevant tags for categorization (5-10 items)'),
});

// ============================================================================
// Prompts
// ============================================================================

/**
 * System prompt for content generation.
 *
 * Philosophy: Let the model tell the story naturally. Don't prescribe
 * sections like "Problem → Solution → Results" - each project is unique
 * and the model knows how to write compelling content.
 */
const CONTENT_GENERATION_SYSTEM_PROMPT = `You are a professional content writer for business portfolios.

Write compelling, authentic content that:
- Tells this project's unique story in a natural way
- Highlights craftsmanship and attention to detail
- Uses appropriate trade vocabulary when relevant
- Writes in third person for SEO pages
- Appeals to homeowners looking for quality work

Output Requirements:
- Title: Compelling, includes location if natural, max 60 characters
- Description: Professional narrative (300-500 words) that tells the project's story
- SEO Title: Optimized for search, max 60 characters
- SEO Description: Compelling meta description with call-to-action, max 160 chars
- Tags: 5-10 relevant keywords

Let the project's actual details guide the structure. Don't force a template.`;

/**
 * Build the user prompt with project data.
 */
function buildContentPrompt(state: SharedProjectState): string {
  const sections: string[] = [];
  const locationLabel = getLocationLabel(state);

  // Project type
  if (state.projectType) {
    sections.push(`Project Type: ${state.projectType}`);
  }

  // Location
  if (locationLabel) {
    sections.push(`Location: ${locationLabel}`);
  }

  // Customer problem
  if (state.customerProblem) {
    sections.push(`Customer's Problem:\n${state.customerProblem}`);
  }

  // Solution approach
  if (state.solutionApproach) {
    sections.push(`Solution Approach:\n${state.solutionApproach}`);
  }

  // Materials
  if (state.materials.length > 0) {
    sections.push(`Materials Used:\n- ${state.materials.join('\n- ')}`);
  }

  // Techniques
  if (state.techniques.length > 0) {
    sections.push(`Techniques Applied:\n- ${state.techniques.join('\n- ')}`);
  }

  // Duration
  if (state.duration) {
    sections.push(`Project Duration: ${state.duration}`);
  }

  // What they're proud of
  if (state.proudOf) {
    sections.push(`Pride Point:\n${state.proudOf}`);
  }

  // Number of images
  if (state.images.length > 0) {
    const imageTypes = state.images
      .map((img) => img.imageType)
      .filter(Boolean)
      .join(', ');
    sections.push(`Images: ${state.images.length} photos${imageTypes ? ` (${imageTypes})` : ''}`);
  }

  return `Generate portfolio content for this project:

${sections.join('\n\n')}

Requirements:
- Title must be under 60 characters
- SEO title must be under 60 characters
- SEO description must be under 160 characters
- Description should be 300-500 words
- Include 5-10 relevant tags
${locationLabel ? `- Include "${locationLabel}" in the title if it fits naturally` : ''}`;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Required fields for content generation.
 * At minimum, we need a project type or some description of the work.
 */

/**
 * Validate that we have enough data to generate content.
 * Returns an error message if validation fails, or null if valid.
 */
function validateProjectData(state: SharedProjectState): string | null {
  // Must have project type OR (customer problem OR solution approach)
  const hasProjectType = Boolean(state.projectType);
  const hasStory = Boolean(state.customerProblem) || Boolean(state.solutionApproach);
  const hasMaterials = state.materials.length > 0;

  if (!hasProjectType && !hasStory && !hasMaterials) {
    return 'Missing required data: need at least project type, problem description, or materials';
  }

  // Must have at least some narrative content
  const totalContentLength =
    (state.customerProblem?.length || 0) +
    (state.solutionApproach?.length || 0) +
    (state.proudOf?.length || 0);

  if (totalContentLength < 50) {
    return 'Insufficient project details: need more information about the work performed';
  }

  return null;
}

// ============================================================================
// Content Generation
// ============================================================================

/**
 * Error result for content generation failures.
 */
export interface ContentGenerationError {
  error: string;
  retryable: boolean;
}

/**
 * Generate portfolio content from extracted project data.
 *
 * @param state - Shared project state with extracted data
 * @returns Generated content or error object
 *
 * @example
 * ```typescript
 * const state: SharedProjectState = {
 *   projectType: 'kitchen-remodel',
 *   location: 'Denver, CO',
 *   customerProblem: 'Outdated kitchen with poor layout...',
 *   solutionApproach: 'Complete renovation with modern design...',
 *   materials: ['quartz countertops', 'oak cabinets'],
 *   techniques: ['custom carpentry', 'tile installation'],
 *   // ... other fields
 * };
 *
 * const result = await generateContent(state);
 * if ('error' in result) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.title); // "Modern Kitchen Transformation in Denver"
 * }
 * ```
 */
export async function generateContent(
  state: SharedProjectState
): Promise<ContentGenerationResult | ContentGenerationError> {
  // Validate AI availability
  if (!isGoogleAIEnabled()) {
    return {
      error: 'AI content generation is not available. Please configure GOOGLE_GENERATIVE_AI_API_KEY.',
      retryable: false,
    };
  }

  // Validate required data
  const validationError = validateProjectData(state);
  if (validationError) {
    return {
      error: validationError,
      retryable: false,
    };
  }

  try {
    const { object } = await generateObject({
      model: getGenerationModel(),
      schema: ContentGenerationSchema,
      system: CONTENT_GENERATION_SYSTEM_PROMPT,
      prompt: buildContentPrompt(state),
      maxOutputTokens: OUTPUT_LIMITS.contentGeneration,
      temperature: 0.7, // Some creativity for engaging content
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingLevel: 'medium',
          },
        },
      },
    });

    // Post-process to ensure constraints are met
    const result = enforceConstraints(object, state);

    return result;
  } catch (error) {
    const parsed = parseGenerationError(error);
    console.error('[ContentGenerator] Error:', parsed.error);
    return parsed;
  }
}

// ============================================================================
// Post-Processing
// ============================================================================

/**
 * Enforce character limits and add location if missing.
 * AI sometimes exceeds limits, so we truncate intelligently.
 */
function enforceConstraints(
  raw: z.infer<typeof ContentGenerationSchema>,
  state: SharedProjectState
): ContentGenerationResult {
  const locationLabel = getLocationLabel(state);
  // Truncate title to 60 chars, preserving whole words
  let title = raw.title;
  if (title.length > 60) {
    title = truncateToLimit(title, 60);
  }

  // Add location to title if available and fits
  if (locationLabel && !title.toLowerCase().includes(locationLabel.toLowerCase())) {
    const withLocation = `${title} in ${locationLabel}`;
    if (withLocation.length <= 60) {
      title = withLocation;
    }
  }

  // Truncate SEO title to 60 chars
  let seoTitle = raw.seoTitle;
  if (seoTitle.length > 60) {
    seoTitle = truncateToLimit(seoTitle, 60);
  }

  // Truncate SEO description to 160 chars
  let seoDescription = raw.seoDescription;
  if (seoDescription.length > 160) {
    seoDescription = truncateToLimit(seoDescription, 157) + '...';
  }

  // Ensure tags are deduplicated and lowercase
  const tags = [...new Set(raw.tags.map((tag) => tag.toLowerCase().trim()))].filter(Boolean);

  return {
    title,
    description: raw.description,
    seoTitle,
    seoDescription,
    tags,
  };
}

/**
 * Return the best available location label for prompts and titles.
 */
function getLocationLabel(state: SharedProjectState): string | null {
  if (state.location && state.location.trim().length > 0) {
    return state.location;
  }
  return formatProjectLocation({ city: state.city, state: state.state });
}

/**
 * Truncate string to limit while preserving whole words.
 */
function truncateToLimit(str: string, limit: number): string {
  if (str.length <= limit) return str;

  // Find last space before limit
  const truncated = str.slice(0, limit);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > limit * 0.7) {
    // Only truncate at word boundary if we keep most of the content
    return truncated.slice(0, lastSpace).trim();
  }

  // Otherwise just truncate (rare edge case with very long words)
  return truncated.trim();
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Parse AI errors into user-friendly messages.
 */
function parseGenerationError(error: unknown): ContentGenerationError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Rate limiting
    if (message.includes('rate') || message.includes('quota') || message.includes('429')) {
      return {
        error: 'AI service is busy. Please try again in a moment.',
        retryable: true,
      };
    }

    // Context/token limits
    if (message.includes('token') || message.includes('length') || message.includes('too long')) {
      return {
        error: 'Content is too long for AI processing. Please use shorter inputs.',
        retryable: false,
      };
    }

    // Content filtering
    if (message.includes('safety') || message.includes('blocked') || message.includes('filter')) {
      return {
        error: 'Content was flagged by safety filters. Please try different content.',
        retryable: false,
      };
    }

    // Network/timeout
    if (message.includes('timeout') || message.includes('network')) {
      return {
        error: 'AI request timed out. Please try again.',
        retryable: true,
      };
    }

    // API key issues
    if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
      return {
        error: 'AI service configuration error. Please contact support.',
        retryable: false,
      };
    }

    return {
      error: error.message,
      retryable: true,
    };
  }

  return {
    error: 'An unexpected error occurred with AI processing.',
    retryable: true,
  };
}

// ============================================================================
// Testing Utilities (exported for tests)
// ============================================================================

/** @internal Exported for testing only */
export const _internal = {
  validateProjectData,
  enforceConstraints,
  truncateToLimit,
  buildContentPrompt,
  ContentGenerationSchema,
};

/**
 * Gemini 3.0 Flash content generation for portfolio showcases.
 *
 * Uses Vercel AI SDK with Google provider for type-safe structured outputs.
 *
 * Generates SEO-optimized content from:
 * - Image analysis results
 * - Interview transcripts
 * - Contractor business context
 *
 * @see /docs/03-architecture/c4-container.md for AI pipeline flow
 * @see https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
 */

import { generateText, Output } from 'ai';
import { getGenerationModel, isGoogleAIEnabled, OUTPUT_LIMITS, validateTokenLimit, TOKEN_LIMITS } from './providers';
import {
  CONTENT_GENERATION_PROMPT,
  INTERVIEW_QUESTIONS_PROMPT,
  buildContentGenerationMessage,
  buildQuestionGenerationMessage,
  DEFAULT_INTERVIEW_QUESTIONS,
} from './prompts';
import { InterviewQuestionsSchema, GeneratedContentSchema } from './schemas';
import type { ImageAnalysisResult } from './image-analysis';
import { withRetry, AI_RETRY_OPTIONS } from './retry';

/**
 * Interview question with context.
 */
export interface InterviewQuestion {
  id: string;
  text: string;
  purpose: string;
}

/**
 * Generated content for a project.
 */
export interface GeneratedContent {
  /** Project title (60-70 chars) */
  title: string;
  /** Full project description (400-600 words) */
  description: string;
  /** SEO title (<60 chars) */
  seo_title: string;
  /** SEO meta description (150-160 chars) */
  seo_description: string;
  /** Keywords/tags for categorization */
  tags: string[];
  /** Materials detected/mentioned */
  materials: string[];
  /** Techniques used */
  techniques: string[];
}

/**
 * Business context for content generation.
 */
export interface BusinessContext {
  business_name: string;
  city: string;
  state: string;
  services: string[];
}

/**
 * Generate interview questions based on image analysis.
 * Uses AI SDK with Gemini for structured outputs.
 *
 * @param imageAnalysis - Results from Gemini image analysis
 * @param businessContext - Contractor's business info
 * @returns Array of questions to ask the contractor
 */
export async function generateInterviewQuestions(
  imageAnalysis: ImageAnalysisResult,
  businessContext: BusinessContext
): Promise<InterviewQuestion[]> {
  // Return defaults if AI is unavailable
  if (!isGoogleAIEnabled()) {
    return DEFAULT_INTERVIEW_QUESTIONS;
  }

  try {
    // Wrap in retry logic for transient failures
    const { output: object } = await withRetry(
      () =>
        generateText({
          model: getGenerationModel(),
          output: Output.object({ schema: InterviewQuestionsSchema }),
          system: INTERVIEW_QUESTIONS_PROMPT,
          prompt: buildQuestionGenerationMessage(imageAnalysis, businessContext),
          maxOutputTokens: OUTPUT_LIMITS.questionGeneration,
        }),
      AI_RETRY_OPTIONS
    );

    if (!object?.questions || object.questions.length === 0) {
      return DEFAULT_INTERVIEW_QUESTIONS;
    }

    return object.questions;
  } catch (error) {
    console.error('[generateInterviewQuestions] Error:', parseContentError(error));
    return DEFAULT_INTERVIEW_QUESTIONS;
  }
}

/**
 * Generate portfolio content from interview responses.
 * Uses AI SDK with Gemini for structured outputs.
 *
 * @param imageAnalysis - Results from image analysis
 * @param interviewResponses - Q&A pairs from the interview
 * @param businessContext - Contractor's business info
 * @returns Generated content or error
 *
 * @example
 * const result = await generatePortfolioContent(
 *   imageAnalysis,
 *   [
 *     { question: "What was the customer's problem?", answer: "Their chimney was crumbling..." },
 *     { question: "What materials did you use?", answer: "We used reclaimed brick..." }
 *   ],
 *   { business_name: "Mike's Masonry", city: "Denver", state: "CO", services: ["chimney repair"] }
 * );
 */
export async function generatePortfolioContent(
  imageAnalysis: ImageAnalysisResult,
  interviewResponses: Array<{ question: string; answer: string }>,
  businessContext: BusinessContext
): Promise<GeneratedContent | { error: string; retryable: boolean }> {
  // Check if AI is available
  if (!isGoogleAIEnabled()) {
    return {
      error: 'AI content generation is not available',
      retryable: false,
    };
  }

  // Validate we have enough content to work with
  const hasContent = interviewResponses.some((r) => r.answer && r.answer.length > 10);
  if (!hasContent) {
    return {
      error: 'Please provide more detailed answers for content generation',
      retryable: false,
    };
  }

  // Build prompt for token validation
  const userPrompt = buildContentGenerationMessage(imageAnalysis, interviewResponses, businessContext);

  // Validate token limits before making request
  const tokenValidation = validateTokenLimit(
    {
      systemPrompt: CONTENT_GENERATION_PROMPT,
      userPrompt,
    },
    TOKEN_LIMITS.contentGenerationInput
  );

  if (!tokenValidation.valid) {
    console.warn(
      `[generatePortfolioContent] Token limit exceeded: ${tokenValidation.estimated} > ${tokenValidation.limit}`
    );
    return {
      error: tokenValidation.message || 'Interview content too large for AI processing',
      retryable: false,
    };
  }

  try {
    // Wrap in retry logic for transient failures
    const { output: object } = await withRetry(
      () =>
        generateText({
          model: getGenerationModel(),
          output: Output.object({ schema: GeneratedContentSchema }),
          system: CONTENT_GENERATION_PROMPT,
          prompt: userPrompt,
          maxOutputTokens: OUTPUT_LIMITS.contentGeneration,
          temperature: 0.7, // Some creativity for engaging content
        }),
      AI_RETRY_OPTIONS
    );

    // Validate required fields
    if (!object?.title || !object?.description) {
      return {
        error: 'Generated content is incomplete. Please try again.',
        retryable: true,
      };
    }

    // Ensure arrays are properly typed
    return {
      title: object.title,
      description: object.description,
      seo_title: object.seo_title || `${object.title} | ${businessContext.business_name}`,
      seo_description:
        object.seo_description || object.description.slice(0, 157) + '...',
      tags: object.tags || [],
      materials: object.materials || imageAnalysis.materials || [],
      techniques: object.techniques || imageAnalysis.techniques || [],
    };
  } catch (error) {
    const aiError = parseContentError(error);
    console.error('[generatePortfolioContent] Error:', aiError);
    return { error: aiError.message, retryable: aiError.retryable };
  }
}

/**
 * Regenerate content with user feedback.
 * Used when contractor wants to refine the AI output.
 *
 * @param previousContent - Previously generated content
 * @param feedback - User's feedback on what to change
 * @param businessContext - Contractor's business info
 */
export async function regenerateWithFeedback(
  previousContent: GeneratedContent,
  feedback: string,
  businessContext: BusinessContext
): Promise<GeneratedContent | { error: string; retryable: boolean }> {
  if (!isGoogleAIEnabled()) {
    return {
      error: 'AI content generation is not available',
      retryable: false,
    };
  }

  try {
    const regenerationPrompt = `Here is the previously generated content:
${JSON.stringify(previousContent, null, 2)}

The contractor (${businessContext.business_name} in ${businessContext.city}, ${businessContext.state}) has requested changes:
"${feedback}"

Please regenerate the content incorporating this feedback while maintaining SEO optimization and professional quality.`;

    // Wrap in retry logic for transient failures
    const { output: object } = await withRetry(
      () =>
        generateText({
          model: getGenerationModel(),
          output: Output.object({ schema: GeneratedContentSchema }),
          system: CONTENT_GENERATION_PROMPT,
          prompt: regenerationPrompt,
          maxOutputTokens: OUTPUT_LIMITS.contentGeneration,
          temperature: 0.7,
        }),
      AI_RETRY_OPTIONS
    );

    return {
      title: object?.title || previousContent.title,
      description: object?.description || previousContent.description,
      seo_title: object?.seo_title || previousContent.seo_title,
      seo_description: object?.seo_description || previousContent.seo_description,
      tags: object?.tags || previousContent.tags,
      materials: object?.materials || previousContent.materials,
      techniques: object?.techniques || previousContent.techniques,
    };
  } catch (error) {
    const aiError = parseContentError(error);
    console.error('[regenerateWithFeedback] Error:', aiError);
    return { error: aiError.message, retryable: aiError.retryable };
  }
}

/**
 * Parse errors from content generation into user-friendly messages.
 */
function parseContentError(error: unknown): { message: string; retryable: boolean } {
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
        message: 'Content is too long for AI processing. Please use shorter inputs.',
        retryable: false,
      };
    }

    // Content filtering
    if (message.includes('safety') || message.includes('blocked') || message.includes('filter')) {
      return {
        message: 'Content was flagged by safety filters. Please try different content.',
        retryable: false,
      };
    }

    // Network/timeout
    if (message.includes('timeout') || message.includes('network')) {
      return {
        message: 'AI request timed out. Please try again.',
        retryable: true,
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

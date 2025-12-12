/**
 * GPT-4o content generation for portfolio showcases.
 *
 * Uses OpenAI Responses API with structured outputs for type-safe parsing.
 *
 * Generates SEO-optimized content from:
 * - Image analysis results
 * - Interview transcripts
 * - Contractor business context
 *
 * @see /docs/03-architecture/c4-container.md for AI pipeline flow
 * @see https://platform.openai.com/docs/guides/structured-outputs
 */

import { LengthFinishReasonError, ContentFilterFinishReasonError } from 'openai/core/error';
import { zodTextFormat } from 'openai/helpers/zod';
import { openai, AI_MODELS, OUTPUT_LIMITS, parseAIError, isAIEnabled } from './openai';
import {
  CONTENT_GENERATION_PROMPT,
  INTERVIEW_QUESTIONS_PROMPT,
  buildContentGenerationMessage,
  buildQuestionGenerationMessage,
  DEFAULT_INTERVIEW_QUESTIONS,
} from './prompts';
import { InterviewQuestionsSchema, GeneratedContentSchema } from './schemas';
import type { ImageAnalysisResult } from './image-analysis';

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
 * Uses Responses API with structured outputs.
 *
 * @param imageAnalysis - Results from GPT-4o image analysis
 * @param businessContext - Contractor's business info
 * @returns Array of questions to ask the contractor
 */
export async function generateInterviewQuestions(
  imageAnalysis: ImageAnalysisResult,
  businessContext: BusinessContext
): Promise<InterviewQuestion[]> {
  // Return defaults if AI is unavailable
  if (!isAIEnabled()) {
    return DEFAULT_INTERVIEW_QUESTIONS;
  }

  try {
    const response = await openai.responses.parse({
      model: AI_MODELS.generation,
      instructions: INTERVIEW_QUESTIONS_PROMPT,
      input: buildQuestionGenerationMessage(imageAnalysis, businessContext),
      text: {
        format: zodTextFormat(InterviewQuestionsSchema, 'interview_questions'),
      },
      max_output_tokens: OUTPUT_LIMITS.questionGeneration,
    });

    const parsed = response.output_parsed;

    if (!parsed?.questions || parsed.questions.length === 0) {
      return DEFAULT_INTERVIEW_QUESTIONS;
    }

    return parsed.questions;
  } catch (error) {
    console.error('[generateInterviewQuestions] Error:', parseAIError(error));
    return DEFAULT_INTERVIEW_QUESTIONS;
  }
}

/**
 * Generate portfolio content from interview responses.
 * Uses Responses API with structured outputs for type-safe parsing.
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
  if (!isAIEnabled()) {
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

  try {
    const response = await openai.responses.parse({
      model: AI_MODELS.generation,
      instructions: CONTENT_GENERATION_PROMPT,
      input: buildContentGenerationMessage(imageAnalysis, interviewResponses, businessContext),
      text: {
        format: zodTextFormat(GeneratedContentSchema, 'generated_content'),
      },
      max_output_tokens: OUTPUT_LIMITS.contentGeneration,
      temperature: 0.7, // Some creativity for engaging content
    });

    const parsed = response.output_parsed;

    // Validate required fields
    if (!parsed?.title || !parsed?.description) {
      return {
        error: 'Generated content is incomplete. Please try again.',
        retryable: true,
      };
    }

    // Ensure arrays are properly typed
    return {
      title: parsed.title,
      description: parsed.description,
      seo_title: parsed.seo_title || `${parsed.title} | ${businessContext.business_name}`,
      seo_description:
        parsed.seo_description || parsed.description.slice(0, 157) + '...',
      tags: parsed.tags || [],
      materials: parsed.materials || imageAnalysis.materials || [],
      techniques: parsed.techniques || imageAnalysis.techniques || [],
    };
  } catch (error) {
    // Handle Responses API specific errors (thrown by responses.parse() helper)
    if (error instanceof LengthFinishReasonError) {
      return {
        error: 'Content generation was truncated. Please try again.',
        retryable: true,
      };
    }
    if (error instanceof ContentFilterFinishReasonError) {
      return {
        error: 'Content was flagged by safety filters. Please try different content.',
        retryable: false,
      };
    }

    const aiError = parseAIError(error);
    console.error('[generatePortfolioContent] Error:', aiError);
    return { error: aiError.message, retryable: aiError.retryable };
  }
}

/**
 * Regenerate content with user feedback.
 * Used when contractor wants to refine the AI output.
 * Uses Responses API with structured outputs.
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
  if (!isAIEnabled()) {
    return {
      error: 'AI content generation is not available',
      retryable: false,
    };
  }

  try {
    const regenerationInput = `Here is the previously generated content:
${JSON.stringify(previousContent, null, 2)}

The contractor (${businessContext.business_name} in ${businessContext.city}, ${businessContext.state}) has requested changes:
"${feedback}"

Please regenerate the content incorporating this feedback while maintaining SEO optimization and professional quality.`;

    const response = await openai.responses.parse({
      model: AI_MODELS.generation,
      instructions: CONTENT_GENERATION_PROMPT,
      input: regenerationInput,
      text: {
        format: zodTextFormat(GeneratedContentSchema, 'generated_content'),
      },
      max_output_tokens: OUTPUT_LIMITS.contentGeneration,
      temperature: 0.7,
    });

    const parsed = response.output_parsed;

    return {
      title: parsed?.title || previousContent.title,
      description: parsed?.description || previousContent.description,
      seo_title: parsed?.seo_title || previousContent.seo_title,
      seo_description: parsed?.seo_description || previousContent.seo_description,
      tags: parsed?.tags || previousContent.tags,
      materials: parsed?.materials || previousContent.materials,
      techniques: parsed?.techniques || previousContent.techniques,
    };
  } catch (error) {
    // Handle Responses API specific errors (thrown by responses.parse() helper)
    if (error instanceof LengthFinishReasonError) {
      return {
        error: 'Content regeneration was truncated. Please try again.',
        retryable: true,
      };
    }
    if (error instanceof ContentFilterFinishReasonError) {
      return {
        error: 'Content was flagged by safety filters. Please try different feedback.',
        retryable: false,
      };
    }

    const aiError = parseAIError(error);
    console.error('[regenerateWithFeedback] Error:', aiError);
    return { error: aiError.message, retryable: aiError.retryable };
  }
}

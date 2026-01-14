/**
 * Zod schemas for type-safe OpenAI Responses API parsing.
 *
 * These schemas are used with `responses.parse()` and `zodTextFormat()`
 * to get strongly-typed outputs from AI operations.
 *
 * @see https://platform.openai.com/docs/guides/structured-outputs
 * @see /docs/05-decisions/adr/ADR-003-openai.md
 */

import { z } from 'zod';

/**
 * Schema for image analysis results from GPT-4o vision.
 * Detects project type, materials, techniques from masonry photos.
 */
export const ImageAnalysisSchema = z.object({
  /** Primary type of masonry work detected (e.g., "chimney-rebuild", "tuckpointing") */
  project_type: z.string(),
  /** Confidence in project type detection (0-1) */
  project_type_confidence: z.number().min(0).max(1),
  /** Materials identified in the images (e.g., ["red brick", "portland mortar"]) */
  materials: z.array(z.string()),
  /** Masonry techniques observed (e.g., ["repointing", "flashing repair"]) */
  techniques: z.array(z.string()),
  /** Stage of the project shown in images */
  image_stage: z.enum(['before', 'during', 'after', 'detail', 'unknown']),
  /** Notes about craftsmanship quality */
  quality_notes: z.string(),
  /** Keywords for title generation */
  suggested_title_keywords: z.array(z.string()),
  /**
   * AI-generated alt texts for each image, keyed by index ("0", "1", etc.).
   * Format: "[What's visible] - [Project context/stage] - [Location/area]"
   * @example { "0": "Completed chimney with new cap - After rebuild - Historic brick chimney" }
   */
  image_alt_texts: z.record(z.string(), z.string()),
});

export type ImageAnalysisSchemaType = z.infer<typeof ImageAnalysisSchema>;

/**
 * Schema for AI-generated interview questions.
 * Questions are tailored based on image analysis results.
 */
export const InterviewQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      /** Unique identifier for the question */
      id: z.string(),
      /** The question text to display to the contractor */
      text: z.string(),
      /** Why this question is being asked (for internal tracking) */
      purpose: z.string(),
    })
  ),
});

export type InterviewQuestionsSchemaType = z.infer<typeof InterviewQuestionsSchema>;

/**
 * Schema for AI-generated portfolio content.
 * Includes SEO-optimized title, description, and metadata.
 */
export const GeneratedContentSchema = z.object({
  /** Project title (60-70 chars, SEO-optimized) */
  title: z.string(),
  /** Full project description (400-600 words, narrative style) */
  description: z.string(),
  /** SEO title for meta tag (<60 chars) */
  seo_title: z.string(),
  /** SEO meta description (150-160 chars with CTA) */
  seo_description: z.string(),
  /** Keywords/tags for categorization (5-10 items) */
  tags: z.array(z.string()),
  /** Materials mentioned in the content */
  materials: z.array(z.string()),
  /** Techniques described in the content */
  techniques: z.array(z.string()),
});

export type GeneratedContentSchemaType = z.infer<typeof GeneratedContentSchema>;

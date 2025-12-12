/**
 * OpenAI client configuration with error handling and rate limiting.
 *
 * Uses OpenAI Responses API for structured outputs with type-safe parsing.
 *
 * API Methods:
 * - responses.parse(): Structured JSON output with Zod schemas (vision + generation)
 * - audio.transcriptions.create(): Voice transcription (Whisper)
 *
 * @see /docs/05-decisions/adr/ADR-003-openai.md
 * @see /docs/02-requirements/nfr.md for timeout requirements
 * @see https://platform.openai.com/docs/guides/structured-outputs
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { LengthFinishReasonError, ContentFilterFinishReasonError } from 'openai/core/error';

// Validate API key at import time
if (!process.env.OPENAI_API_KEY) {
  console.warn('[OpenAI] OPENAI_API_KEY not set - AI features will be disabled');
}

/**
 * Singleton OpenAI client instance.
 * Server-side only - never expose to client.
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
  // Reasonable timeout for AI operations
  timeout: 60_000, // 60 seconds
  maxRetries: 2,
});

/** Model IDs for different use cases */
export const AI_MODELS = {
  /** Vision model for image analysis (GPT-4o with vision) */
  vision: 'gpt-4o',
  /** Fast model for content generation */
  generation: 'gpt-4o',
  /** Whisper model for transcription */
  transcription: 'whisper-1',
} as const;

/**
 * Output token limits to prevent runaway costs.
 * Used with max_output_tokens in Responses API.
 */
export const OUTPUT_LIMITS = {
  /** Max output tokens for image analysis response */
  imageAnalysis: 500,
  /** Max output tokens for content generation */
  contentGeneration: 1500,
  /** Max output tokens for question generation */
  questionGeneration: 300,
} as const;

/**
 * @deprecated Use OUTPUT_LIMITS instead. Kept for backward compatibility.
 */
export const TOKEN_LIMITS = OUTPUT_LIMITS;

/**
 * Error types for AI operations.
 */
export type AIErrorCode =
  | 'API_KEY_MISSING'
  | 'RATE_LIMITED'
  | 'CONTEXT_LENGTH_EXCEEDED'
  | 'CONTENT_FILTERED'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT'
  | 'PARSE_ERROR'
  | 'UNKNOWN';

export interface AIError {
  code: AIErrorCode;
  message: string;
  retryable: boolean;
}

/**
 * Parse OpenAI errors into standardized format.
 * Handles both legacy API errors and new Responses API error types.
 */
export function parseAIError(error: unknown): AIError {
  if (!process.env.OPENAI_API_KEY) {
    return {
      code: 'API_KEY_MISSING',
      message: 'AI features are not configured. Please contact support.',
      retryable: false,
    };
  }

  // Responses API specific error types (thrown by responses.parse() helper)
  if (error instanceof LengthFinishReasonError) {
    return {
      code: 'CONTEXT_LENGTH_EXCEEDED',
      message: 'Response was truncated due to length limits. Please try with less input.',
      retryable: true,
    };
  }

  if (error instanceof ContentFilterFinishReasonError) {
    return {
      code: 'CONTENT_FILTERED',
      message: 'Content was flagged by safety filters. Please try different content.',
      retryable: false,
    };
  }

  // Standard API errors
  if (error instanceof OpenAI.APIError) {
    // Rate limiting
    if (error.status === 429) {
      return {
        code: 'RATE_LIMITED',
        message: 'AI service is busy. Please try again in a moment.',
        retryable: true,
      };
    }

    // Context length exceeded (legacy error code)
    if (error.code === 'context_length_exceeded') {
      return {
        code: 'CONTEXT_LENGTH_EXCEEDED',
        message: 'Content is too long for AI processing. Please use shorter inputs.',
        retryable: false,
      };
    }

    // Content policy violation (legacy error code)
    if (error.code === 'content_policy_violation') {
      return {
        code: 'CONTENT_FILTERED',
        message: 'Content was flagged by safety filters. Please try different content.',
        retryable: false,
      };
    }

    // Service unavailable
    if (error.status === 503 || error.status === 500) {
      return {
        code: 'SERVICE_UNAVAILABLE',
        message: 'AI service is temporarily unavailable. Please try again later.',
        retryable: true,
      };
    }

    // Bad Request (e.g. invalid image URL)
    if (error.status === 400) {
      console.error('[OpenAI] Bad Request:', JSON.stringify(error));
      return {
        code: 'PARSE_ERROR', // Reusing PARSE_ERROR or could add INVALID_INPUT
        message: `AI Request Failed: ${error.message}`,
        retryable: false,
      };
    }
  }

  // Timeout errors
  if (error instanceof Error && error.message.includes('timeout')) {
    return {
      code: 'TIMEOUT',
      message: 'AI request timed out. Please try again.',
      retryable: true,
    };
  }

  // JSON parse errors (from responses.parse())
  if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('parse'))) {
    return {
      code: 'PARSE_ERROR',
      message: 'Failed to parse AI response. Please try again.',
      retryable: true,
    };
  }

  // Generic fallback
  console.error('[OpenAI] Unexpected error:', error);

  // Log full error details for debugging
  try {
    const logPath = path.resolve(process.cwd(), 'debug-error.log');
    const errorLog = `[${new Date().toISOString()}] ERROR: ${
      error instanceof Error ? error.stack : JSON.stringify(error)
    }\nFull Object: ${JSON.stringify(error, null, 2)}\n\n`;
    fs.appendFileSync(logPath, errorLog);
  } catch (e) {
    console.error('Failed to write debug log', e);
  }

  if (typeof error === 'object' && error !== null) {
    try {
      console.error(JSON.stringify(error, null, 2));
    } catch { /* ignore circular */ }
  }

  return {
    code: 'UNKNOWN',
    message: error instanceof Error ? error.message : 'An unexpected error occurred with AI processing.',
    retryable: true,
  };
}

/**
 * Check if AI features are available.
 */
export function isAIEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Estimate cost for an operation (for budgeting/monitoring).
 * Prices as of Dec 2024 - update as needed.
 *
 * @param model - Model used
 * @param inputTokens - Input token count
 * @param outputTokens - Output token count
 * @returns Estimated cost in USD
 */
export function estimateCost(
  model: keyof typeof AI_MODELS,
  inputTokens: number,
  outputTokens: number
): number {
  // Approximate pricing per 1M tokens (GPT-4o pricing)
  const pricing = {
    vision: { input: 2.5, output: 10 },
    generation: { input: 2.5, output: 10 },
    transcription: { perMinute: 0.006 },
  };

  if (model === 'transcription') {
    // Whisper charges per minute, not tokens
    return 0; // Handled separately
  }

  const modelPricing = pricing[model];
  const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (outputTokens / 1_000_000) * modelPricing.output;

  return inputCost + outputCost;
}

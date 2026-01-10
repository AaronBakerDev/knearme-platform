/**
 * Centralized AI provider configuration.
 *
 * Uses Vercel AI SDK for provider-agnostic model access.
 * Provider: Google Gemini (vision, generation, chat, transcription)
 *
 * @see https://ai-sdk.dev/docs/introduction
 * @see https://ai.google.dev/gemini-api/docs/models#gemini-3-flash
 */

import { google } from '@ai-sdk/google';
import { logger } from '@/lib/logging';

// ============================================================================
// Environment Validation
// ============================================================================

/** Check if Google AI is configured */
export function isGoogleAIEnabled(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

/** Check if any AI provider is available */
export function isAIEnabled(): boolean {
  return isGoogleAIEnabled();
}

// Log warnings at module load
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  logger.warn('[AI Providers] GOOGLE_GENERATIVE_AI_API_KEY not set - AI features disabled');
}

// ============================================================================
// Model Configuration
// ============================================================================

/**
 * Model identifiers for different AI tasks.
 *
 * Using Gemini 3.0 Flash for all vision/generation tasks:
 * - 1M token context window
 * - Multimodal: text, images, audio, video, PDFs
 * - Structured output support
 * - $0.50/1M input, $3/1M output (vs GPT-4o: $2.50/$10)
 */
export const AI_MODELS = {
  /** Vision model for image analysis (Gemini 3.0 Flash) */
  vision: 'gemini-3-flash-preview',
  /** Generation model for content creation (Gemini 3.0 Flash) */
  generation: 'gemini-3-flash-preview',
  /**
   * Chat model for conversational AI (Gemini 2.5 Flash)
   * Uses 2.5 Flash for caching support (90% discount on cached tokens).
   * Discovery Agent and other conversational flows route through this.
   */
  chat: 'gemini-2.5-flash',
  /** Live audio model for Voice -> Voice sessions */
  live: 'gemini-2.5-flash-native-audio-preview-12-2025',
  /**
   * Stable fallback model for reliability-first flows.
   * Upgraded from 2.0 to 2.5 Flash for better quality + 90% cache discount.
   */
  fallback: 'gemini-2.5-flash',
} as const;

/**
 * Gate preview models behind a feature flag for reliability-first flows.
 * Set AI_PREVIEW_MODELS=true to use preview Gemini 3 models.
 */
const PREVIEW_MODELS_ENABLED = process.env.AI_PREVIEW_MODELS === 'true';

function getGeminiModel(task: 'vision' | 'generation' | 'chat') {
  return PREVIEW_MODELS_ENABLED ? AI_MODELS[task] : AI_MODELS.fallback;
}

/**
 * Output token limits to prevent runaway costs.
 * Gemini 3.0 Flash supports up to 65,536 output tokens.
 */
export const OUTPUT_LIMITS = {
  /** Max output tokens for image analysis response */
  imageAnalysis: 500,
  /** Max output tokens for content generation */
  contentGeneration: 1500,
  /** Max output tokens for question generation */
  questionGeneration: 300,
} as const;

// ============================================================================
// Model Instances
// ============================================================================

/**
 * Get the vision model for image analysis.
 * Uses Gemini 3.0 Flash with multimodal capabilities.
 */
export function getVisionModel() {
  if (!isGoogleAIEnabled()) {
    throw new Error('Google AI not configured. Set GOOGLE_GENERATIVE_AI_API_KEY.');
  }
  return google(getGeminiModel('vision'));
}

/**
 * Get the generation model for content creation.
 * Uses Gemini 3.0 Flash for fast, high-quality text generation.
 */
export function getGenerationModel() {
  if (!isGoogleAIEnabled()) {
    throw new Error('Google AI not configured. Set GOOGLE_GENERATIVE_AI_API_KEY.');
  }
  return google(getGeminiModel('generation'));
}

/**
 * Get the chat model for conversational AI.
 * Uses Gemini 3.0 Flash for streaming responses.
 */
export function getChatModel() {
  if (!isGoogleAIEnabled()) {
    throw new Error('Google AI not configured. Set GOOGLE_GENERATIVE_AI_API_KEY.');
  }
  return google(getGeminiModel('chat'));
}

// ============================================================================
// Cost Estimation
// ============================================================================

/**
 * Pricing per 1M tokens (as of Jan 2026).
 *
 * Gemini 3.0 Flash Preview:
 * - Input: $0.50/1M tokens
 * - Output: $3.00/1M tokens
 * - Audio input: $1.00/1M tokens
 * - Caching: NOT YET AVAILABLE
 *
 * Gemini 2.5 Flash:
 * - Input: $0.15/1M tokens
 * - Output: $0.60/1M tokens
 * - Cached input: $0.015/1M tokens (90% discount)
 *
 * @see https://ai.google.dev/gemini-api/docs/pricing
 */
const PRICING = {
  'gemini-3-flash-preview': { input: 0.5, output: 3.0, audioInput: 1.0, cachedInput: 0.5 },
  'gemini-2.5-flash': { input: 0.15, output: 0.6, audioInput: 1.0, cachedInput: 0.015 },
} as const;

/**
 * Estimate cost for a Gemini operation.
 *
 * @param inputTokens - Number of input tokens (non-cached)
 * @param outputTokens - Number of output tokens
 * @param options - Optional settings for audio and caching
 * @returns Estimated cost in USD
 *
 * @example
 * // Without caching (Gemini 3.0)
 * estimateGeminiCost(10000, 5000)
 *
 * // With caching (Gemini 2.5)
 * estimateGeminiCost(2000, 5000, {
 *   model: 'gemini-2.5-flash',
 *   cachedInputTokens: 8000  // System prompt cached
 * })
 */
export function estimateGeminiCost(
  inputTokens: number,
  outputTokens: number,
  options: {
    model?: keyof typeof PRICING;
    includeAudio?: boolean;
    cachedInputTokens?: number;
  } = {}
): number {
  const {
    model = 'gemini-3-flash-preview',
    includeAudio = false,
    cachedInputTokens = 0,
  } = options;

  const pricing = PRICING[model] ?? PRICING['gemini-3-flash-preview'];
  const inputRate = includeAudio ? pricing.audioInput : pricing.input;
  const cachedRate = 'cachedInput' in pricing ? pricing.cachedInput : inputRate;

  const inputCost = (inputTokens / 1_000_000) * inputRate;
  const cachedCost = (cachedInputTokens / 1_000_000) * cachedRate;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + cachedCost + outputCost;
}

// ============================================================================
// Token Estimation & Validation
// ============================================================================

/**
 * Input token limits for different contexts.
 * Gemini 3.0 Flash has 1M token context, but we set conservative limits.
 */
export const TOKEN_LIMITS = {
  /** Max input tokens for image analysis (includes image tokens) */
  imageAnalysisInput: 100_000,
  /** Max input tokens for content generation */
  contentGenerationInput: 50_000,
  /** Max input tokens for chat messages */
  chatInput: 100_000,
} as const;

/**
 * Estimate token count for text content.
 * Uses character-based approximation (~4 chars per token for English).
 */
function estimateTextTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Validate that input doesn't exceed token limits.
 *
 * @param input - Text content to validate
 * @param limit - Maximum allowed tokens
 * @returns Validation result with estimated count
 */
export function validateTokenLimit(
  input: { systemPrompt?: string; userPrompt?: string; images?: number },
  limit: number
): { valid: boolean; estimated: number; limit: number; message?: string } {
  const systemTokens = estimateTextTokens(input.systemPrompt || '');
  const userTokens = estimateTextTokens(input.userPrompt || '');
  const imageTokens = (input.images || 0) * 750; // ~750 tokens per image

  const estimated = systemTokens + userTokens + imageTokens;

  if (estimated > limit) {
    return {
      valid: false,
      estimated,
      limit,
      message: `Estimated ${estimated} tokens exceeds limit of ${limit}`,
    };
  }

  return { valid: true, estimated, limit };
}

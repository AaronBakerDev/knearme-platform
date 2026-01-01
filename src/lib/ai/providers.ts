/**
 * Centralized AI provider configuration.
 *
 * Uses Vercel AI SDK for provider-agnostic model access.
 * Primary provider: Google Gemini 3.0 Flash (vision, generation, chat)
 * Secondary provider: OpenAI Whisper (transcription only)
 *
 * @see https://ai-sdk.dev/docs/introduction
 * @see https://ai.google.dev/gemini-api/docs/models#gemini-3-flash
 */

import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

// ============================================================================
// Environment Validation
// ============================================================================

/** Check if Google AI is configured */
export function isGoogleAIEnabled(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

/** Check if OpenAI is configured (for Whisper transcription) */
export function isOpenAIEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Check if any AI provider is available */
export function isAIEnabled(): boolean {
  return isGoogleAIEnabled() || isOpenAIEnabled();
}

// Log warnings at module load
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  console.warn('[AI Providers] GOOGLE_GENERATIVE_AI_API_KEY not set - Gemini features disabled');
}
if (!process.env.OPENAI_API_KEY) {
  console.warn('[AI Providers] OPENAI_API_KEY not set - Whisper transcription disabled');
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
  /** Chat model for conversational AI (Gemini 3.0 Flash) */
  chat: 'gemini-3-flash-preview',
  /** Live audio model for Voice -> Voice sessions */
  live: 'gemini-2.5-flash-native-audio-preview-12-2025',
  /** Stable fallback model for reliability-first flows */
  fallback: 'gemini-2.0-flash',
  /** Transcription model (OpenAI Whisper - AI SDK doesn't support Gemini transcription yet) */
  transcription: 'whisper-1',
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

/**
 * Get the transcription model for audio-to-text.
 * Uses OpenAI Whisper (AI SDK doesn't support Gemini transcription yet).
 */
export function getTranscriptionModel() {
  if (!isOpenAIEnabled()) {
    throw new Error('OpenAI not configured. Set OPENAI_API_KEY for transcription.');
  }
  return openai.transcription(AI_MODELS.transcription);
}

// ============================================================================
// Cost Estimation
// ============================================================================

/**
 * Pricing per 1M tokens (as of Dec 2025).
 *
 * Gemini 3.0 Flash:
 * - Input: $0.50/1M tokens
 * - Output: $3.00/1M tokens
 * - Audio input: $1.00/1M tokens
 *
 * OpenAI Whisper:
 * - $0.006/minute of audio
 */
const PRICING = {
  'gemini-3-flash-preview': { input: 0.5, output: 3.0, audioInput: 1.0 },
  'whisper-1': { perMinute: 0.006 },
} as const;

/**
 * Estimate cost for a Gemini operation.
 *
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param includeAudio - Whether input includes audio (higher rate)
 * @returns Estimated cost in USD
 */
export function estimateGeminiCost(
  inputTokens: number,
  outputTokens: number,
  includeAudio = false
): number {
  const pricing = PRICING['gemini-3-flash-preview'];
  const inputRate = includeAudio ? pricing.audioInput : pricing.input;
  const inputCost = (inputTokens / 1_000_000) * inputRate;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Estimate cost for Whisper transcription.
 *
 * @param durationSeconds - Audio duration in seconds
 * @returns Estimated cost in USD
 */
export function estimateWhisperCost(durationSeconds: number): number {
  const durationMinutes = durationSeconds / 60;
  return durationMinutes * PRICING['whisper-1'].perMinute;
}

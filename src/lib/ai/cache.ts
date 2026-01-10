/**
 * Gemini Context Caching Utilities
 *
 * Gemini 2.5 models support **implicit caching** automatically:
 * - 90% discount on cached tokens
 * - No code changes needed - just use consistent prompt prefixes
 * - Check `providerMetadata.google.usageMetadata.cachedContentTokenCount`
 *
 * This module provides:
 * 1. Cache usage tracking for cost monitoring
 * 2. Helpers for structuring prompts for optimal cache hits
 * 3. Optional explicit caching (requires @google/generative-ai package)
 *
 * @see https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
 * @see https://ai.google.dev/gemini-api/docs/caching
 */

import { logger } from '@/lib/logging';

// ============================================================================
// Types
// ============================================================================

export interface CacheStats {
  /** Total cache hits this session */
  hits: number;
  /** Total cache misses this session */
  misses: number;
  /** Estimated tokens saved via caching */
  tokensSaved: number;
  /** Estimated cost saved in USD */
  costSaved: number;
}

export interface GoogleUsageMetadata {
  cachedContentTokenCount?: number;
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  thoughtsTokenCount?: number;
}

export interface GoogleProviderMetadata {
  usageMetadata?: GoogleUsageMetadata;
  groundingMetadata?: unknown;
  safetyRatings?: unknown;
}

// ============================================================================
// In-memory cache tracking
// ============================================================================

const stats: CacheStats = { hits: 0, misses: 0, tokensSaved: 0, costSaved: 0 };

// ============================================================================
// Implicit Caching Helpers
// ============================================================================

/**
 * Track cache usage from Gemini provider metadata.
 *
 * Call this after each generateText/streamText call to track savings.
 * Gemini 2.5 models automatically cache repeated prompt prefixes.
 *
 * @param googleMetadata - The providerMetadata.google from AI SDK response
 * @returns Cache usage statistics for this call
 *
 * @example
 * ```typescript
 * const { text, providerMetadata } = await generateText({
 *   model: google('gemini-2.5-flash'),
 *   system: DISCOVERY_PERSONA, // This gets cached automatically
 *   prompt: userMessage,
 * });
 *
 * const usage = trackCacheUsage(providerMetadata?.google);
 * console.log(`Cached ${usage.cached} of ${usage.total} tokens (${usage.savingsPercent}%)`);
 * ```
 */
export function trackCacheUsage(
  googleMetadata?: GoogleProviderMetadata
): {
  cached: number;
  total: number;
  savingsPercent: number;
  costSaved: number;
} {
  const cached = googleMetadata?.usageMetadata?.cachedContentTokenCount ?? 0;
  const total = googleMetadata?.usageMetadata?.promptTokenCount ?? 0;

  // Calculate savings (90% discount on cached tokens)
  // Base rate: $0.15/MTok, Cached rate: $0.015/MTok
  // Savings: $0.135/MTok (90%)
  const costSavedThisCall = (cached / 1_000_000) * 0.135;

  if (cached > 0) {
    stats.hits++;
    stats.tokensSaved += cached;
    stats.costSaved += costSavedThisCall;
  } else if (total > 0) {
    stats.misses++;
  }

  const savingsPercent = total > 0 ? Math.round((cached / total) * 100) : 0;

  return {
    cached,
    total,
    savingsPercent,
    costSaved: costSavedThisCall,
  };
}

/**
 * Log cache usage for a single call (useful for debugging).
 */
export function logCacheUsage(
  operation: string,
  googleMetadata?: GoogleProviderMetadata
): void {
  const usage = trackCacheUsage(googleMetadata);

  if (usage.cached > 0) {
    logger.info(`[Cache] ${operation}`, {
      cached: usage.cached,
      total: usage.total,
      savings: `${usage.savingsPercent}%`,
      costSaved: `$${usage.costSaved.toFixed(6)}`,
    });
  }
  // No-hit case doesn't need logging - it's the common path
}

// ============================================================================
// Stats & Monitoring
// ============================================================================

/**
 * Get current cache statistics for the session.
 */
export function getCacheStats(): CacheStats {
  return { ...stats };
}

/**
 * Reset cache statistics.
 */
export function resetCacheStats(): void {
  stats.hits = 0;
  stats.misses = 0;
  stats.tokensSaved = 0;
  stats.costSaved = 0;
}

/**
 * Log cache statistics summary for the session.
 */
export function logCacheStats(): void {
  const totalCalls = stats.hits + stats.misses;
  const hitRate = totalCalls > 0 ? Math.round((stats.hits / totalCalls) * 100) : 0;

  logger.info('[Cache] Session summary', {
    hits: stats.hits,
    misses: stats.misses,
    hitRate: `${hitRate}%`,
    tokensSaved: stats.tokensSaved.toLocaleString(),
    costSaved: `$${stats.costSaved.toFixed(4)}`,
  });
}

// ============================================================================
// Prompt Structuring Helpers
// ============================================================================

/**
 * Combine static and dynamic prompt parts for optimal caching.
 *
 * Gemini's implicit caching works by detecting repeated prefixes.
 * Structure prompts with static content first, dynamic content last.
 *
 * @param staticParts - Parts that don't change (system prompt, tool docs, etc.)
 * @param dynamicParts - Parts that change per request (user input, state, etc.)
 * @returns Combined prompt optimized for cache hits
 *
 * @example
 * ```typescript
 * const prompt = buildCacheablePrompt(
 *   [DISCOVERY_PERSONA, TOOL_USAGE_GUIDE],  // Static - will be cached
 *   [stateContext, `User: ${userMessage}`]   // Dynamic - not cached
 * );
 * ```
 */
export function buildCacheablePrompt(
  staticParts: string[],
  dynamicParts: string[]
): string {
  const staticSection = staticParts.filter(Boolean).join('\n\n');
  const dynamicSection = dynamicParts.filter(Boolean).join('\n\n');

  // Clear separator helps Gemini identify the cache boundary
  return `${staticSection}\n\n---\n\n${dynamicSection}`;
}

/**
 * Minimum tokens required for caching to apply.
 * Content below this threshold won't be cached.
 */
export const MIN_CACHE_TOKENS = 2048;

/**
 * Check if content is likely to benefit from caching.
 *
 * @param text - The text content to check
 * @returns Whether the content meets minimum caching requirements
 */
export function isLikelyCacheable(text: string): boolean {
  // Rough estimate: ~4 chars per token
  const estimatedTokens = Math.ceil(text.length / 4);
  return estimatedTokens >= MIN_CACHE_TOKENS;
}

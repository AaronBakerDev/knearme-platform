/**
 * Rate Limiting Utilities for Meta Graph Worker
 *
 * Implements sliding window rate limiting using KV storage.
 * Limits: 60 requests per minute per IP (conservative vs Meta's 200/hour)
 *
 * @module utils/rate-limit
 */

import type { Env, RateLimitResult, RateLimitInfo } from '../types';

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
  /** Maximum requests per window */
  MAX_REQUESTS: 60,
  /** Window size in seconds */
  WINDOW_SECONDS: 60,
  /** KV key prefix */
  KEY_PREFIX: 'rate:',
};

/**
 * Get client identifier from request
 * Uses CF-Connecting-IP header or falls back to X-Forwarded-For
 *
 * @param request - Incoming request
 * @returns Client IP or identifier
 */
function getClientId(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/**
 * Check rate limit for request
 *
 * @param request - Incoming request
 * @param env - Environment with KV storage
 * @returns Rate limit check result
 */
export async function checkRateLimit(
  request: Request,
  env: Env
): Promise<RateLimitResult> {
  const clientId = getClientId(request);
  const key = `${RATE_LIMIT_CONFIG.KEY_PREFIX}${clientId}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.WINDOW_SECONDS * 1000;

  try {
    // Get existing rate limit data
    const existingData = await env.RATE_LIMITER.get(key);
    let requests: number[] = [];

    if (existingData) {
      try {
        requests = JSON.parse(existingData);
        // Filter to only requests within current window
        requests = requests.filter((timestamp) => timestamp > windowStart);
      } catch {
        // Invalid data, reset
        requests = [];
      }
    }

    // Check if limit exceeded
    if (requests.length >= RATE_LIMIT_CONFIG.MAX_REQUESTS) {
      const oldestRequest = Math.min(...requests);
      const resetTime = oldestRequest + RATE_LIMIT_CONFIG.WINDOW_SECONDS * 1000;

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        error: 'Rate limit exceeded',
      };
    }

    // Add current request timestamp
    requests.push(now);

    // Store updated data
    await env.RATE_LIMITER.put(key, JSON.stringify(requests), {
      expirationTtl: RATE_LIMIT_CONFIG.WINDOW_SECONDS * 2,
    });

    const remaining = RATE_LIMIT_CONFIG.MAX_REQUESTS - requests.length;
    const resetTime = now + RATE_LIMIT_CONFIG.WINDOW_SECONDS * 1000;

    return {
      allowed: true,
      remaining,
      resetTime,
    };
  } catch (error) {
    // On error, allow request but log
    console.error('Rate limit check error:', error);
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS,
      resetTime: now + RATE_LIMIT_CONFIG.WINDOW_SECONDS * 1000,
    };
  }
}

/**
 * Get rate limit headers for response
 *
 * @param result - Rate limit check result
 * @returns Headers object with rate limit info
 */
export function getRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    'X-RateLimit-Limit': RATE_LIMIT_CONFIG.MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(result.resetTime / 1000).toString(),
  };
}

/**
 * Create rate limit info object
 *
 * @param result - Rate limit check result
 * @returns Rate limit info for response body
 */
export function createRateLimitInfo(result: RateLimitResult): RateLimitInfo {
  return {
    remaining: result.remaining,
    resetTime: result.resetTime,
  };
}

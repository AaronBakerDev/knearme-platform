/**
 * Retry utility with exponential backoff for AI API calls.
 *
 * Handles transient failures (rate limits, timeouts, network errors)
 * by automatically retrying with increasing delays.
 *
 * @example
 * const result = await withRetry(
 *   () => generateObject({ model, prompt }),
 *   { maxRetries: 3, baseDelayMs: 1000 }
 * );
 *
 * @see https://cloud.google.com/apis/design/errors#retrying_errors
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds before first retry (default: 1000) */
  baseDelayMs?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Optional callback for logging retry attempts */
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

/**
 * Error types that are safe to retry.
 * Based on HTTP status codes and common AI API error patterns.
 */
const RETRYABLE_ERROR_PATTERNS = [
  // Rate limiting
  '429',
  'rate limit',
  'rate_limit',
  'quota',
  'too many requests',
  // Transient server errors
  '500',
  '502',
  '503',
  '504',
  'internal server error',
  'service unavailable',
  'bad gateway',
  'gateway timeout',
  // Network errors
  'timeout',
  'network',
  'econnreset',
  'econnrefused',
  'etimedout',
  'fetch failed',
  // AI-specific transient errors
  'overloaded',
  'capacity',
  'temporarily unavailable',
] as const;

/**
 * Check if an error is retryable based on its message or status.
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const hasRetryablePattern = RETRYABLE_ERROR_PATTERNS.some(
    (pattern) => message.includes(pattern)
  );

  // Also check for status code property (common in API errors)
  const errorWithStatus = error as Error & { status?: number; statusCode?: number };
  const status = errorWithStatus.status || errorWithStatus.statusCode;
  const hasRetryableStatus = status === 429 || (status !== undefined && status >= 500 && status < 600);

  return hasRetryablePattern || hasRetryableStatus;
}

/**
 * Calculate delay for next retry using exponential backoff with jitter.
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay cap
 * @param multiplier - Backoff multiplier
 * @returns Delay in milliseconds
 */
function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  multiplier: number
): number {
  // Exponential backoff: baseDelay * (multiplier ^ attempt)
  const exponentialDelay = baseDelayMs * Math.pow(multiplier, attempt);

  // Add jitter (0-25% random variation) to prevent thundering herd
  const jitter = exponentialDelay * Math.random() * 0.25;

  // Cap at maxDelay
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

/**
 * Execute a function with automatic retry on failure.
 *
 * Uses exponential backoff with jitter to handle transient failures
 * like rate limits, timeouts, and server errors.
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration
 * @returns Result of the function
 * @throws Last error if all retries fail
 *
 * @example
 * // Basic usage
 * const result = await withRetry(() => callAIAPI());
 *
 * @example
 * // With custom options
 * const result = await withRetry(
 *   () => generateObject({ model, prompt }),
 *   {
 *     maxRetries: 5,
 *     baseDelayMs: 2000,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
 *     }
 *   }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if we've exhausted attempts or error isn't retryable
      const isLastAttempt = attempt >= maxRetries;
      const shouldRetry = isRetryableError(error);

      if (isLastAttempt || !shouldRetry) {
        throw lastError;
      }

      // Calculate delay and wait
      const delayMs = calculateDelay(attempt, baseDelayMs, maxDelayMs, backoffMultiplier);

      // Notify caller about retry (useful for logging/metrics)
      if (onRetry) {
        onRetry(attempt + 1, lastError, delayMs);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // TypeScript: This should never be reached, but satisfies the compiler
  throw lastError || new Error('Retry failed');
}

/**
 * Default retry options for AI operations.
 * Tuned for Google Gemini API rate limits and error patterns.
 */
export const AI_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  onRetry: (attempt, error, delayMs) => {
    console.warn(
      `[AI Retry] Attempt ${attempt} failed: ${error.message}. Retrying in ${Math.round(delayMs)}ms...`
    );
  },
};

/**
 * Error Type Detection Helper Tests
 *
 * Tests the isRateLimitError and isTimeoutError functions that provide
 * reliable error classification for retry logic and circuit breaker decisions.
 *
 * @see /src/lib/api/errors.ts
 * @see /src/lib/agents/subagents/spawn.ts - Primary consumer of these helpers
 */

import { describe, it, expect } from 'vitest';
import { isRateLimitError, isTimeoutError } from '../errors';

// =============================================================================
// isRateLimitError Tests
// =============================================================================

describe('isRateLimitError', () => {
  describe('Error instances', () => {
    it('detects 429 in error message', () => {
      const error = new Error('Request failed with status 429');
      expect(isRateLimitError(error)).toBe(true);
    });

    it('detects "rate limit" text (case insensitive)', () => {
      const error = new Error('Rate Limit exceeded');
      expect(isRateLimitError(error)).toBe(true);
    });

    it('detects "too many requests" text', () => {
      const error = new Error('Too many requests, please slow down');
      expect(isRateLimitError(error)).toBe(true);
    });

    it('detects "quota exceeded" text', () => {
      const error = new Error('API quota exceeded for today');
      expect(isRateLimitError(error)).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      const error = new Error('Network connection failed');
      expect(isRateLimitError(error)).toBe(false);
    });

    it('returns false for 500 errors', () => {
      const error = new Error('Request failed with status 500');
      expect(isRateLimitError(error)).toBe(false);
    });
  });

  describe('HTTP response-like objects', () => {
    it('detects status: 429', () => {
      const error = { status: 429, message: 'Rate limited' };
      expect(isRateLimitError(error)).toBe(true);
    });

    it('detects statusCode: 429', () => {
      const error = { statusCode: 429, body: 'Too many requests' };
      expect(isRateLimitError(error)).toBe(true);
    });

    it('detects rate limit in message property', () => {
      const error = { status: 200, message: 'Rate limit warning' };
      expect(isRateLimitError(error)).toBe(true);
    });

    it('returns false for non-429 status', () => {
      const error = { status: 500, message: 'Internal error' };
      expect(isRateLimitError(error)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('returns false for null', () => {
      expect(isRateLimitError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isRateLimitError(undefined)).toBe(false);
    });

    it('returns false for plain strings', () => {
      expect(isRateLimitError('429 error')).toBe(false);
    });

    it('returns false for numbers', () => {
      expect(isRateLimitError(429)).toBe(false);
    });

    it('returns false for empty object', () => {
      expect(isRateLimitError({})).toBe(false);
    });
  });
});

// =============================================================================
// isTimeoutError Tests
// =============================================================================

describe('isTimeoutError', () => {
  describe('Error instances', () => {
    it('detects AbortError by name', () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      expect(isTimeoutError(error)).toBe(true);
    });

    it('detects "timeout" in message (case insensitive)', () => {
      const error = new Error('Request Timeout');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('detects ETIMEDOUT in message', () => {
      const error = new Error('connect ETIMEDOUT 192.168.1.1:443');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('detects "aborted" in message', () => {
      const error = new Error('Request was aborted');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('returns false for network errors', () => {
      const error = new Error('ECONNREFUSED');
      expect(isTimeoutError(error)).toBe(false);
    });

    it('returns false for generic errors', () => {
      const error = new Error('Something went wrong');
      expect(isTimeoutError(error)).toBe(false);
    });
  });

  describe('error-like objects', () => {
    it('detects name: AbortError', () => {
      const error = { name: 'AbortError', message: 'Aborted' };
      expect(isTimeoutError(error)).toBe(true);
    });

    it('detects code: ETIMEDOUT', () => {
      const error = { code: 'ETIMEDOUT', syscall: 'connect' };
      expect(isTimeoutError(error)).toBe(true);
    });

    it('detects code: ECONNABORTED', () => {
      const error = { code: 'ECONNABORTED', message: 'Connection aborted' };
      expect(isTimeoutError(error)).toBe(true);
    });

    it('detects timeout in message property', () => {
      const error = { message: 'Request timeout after 30s' };
      expect(isTimeoutError(error)).toBe(true);
    });

    it('returns false for non-timeout error codes', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };
      expect(isTimeoutError(error)).toBe(false);
    });
  });

  describe('real-world scenarios', () => {
    it('detects fetch AbortController timeout', () => {
      // Simulates what happens when AbortController.abort() is called
      const error = new DOMException('The user aborted a request.', 'AbortError');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('detects Node.js socket timeout', () => {
      const error = new Error('Socket timeout after 30000ms');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('detects AI SDK timeout patterns', () => {
      // Pattern from Vercel AI SDK when request times out
      const error = new Error('Request aborted due to timeout');
      expect(isTimeoutError(error)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('returns false for null', () => {
      expect(isTimeoutError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isTimeoutError(undefined)).toBe(false);
    });

    it('returns false for plain strings', () => {
      expect(isTimeoutError('timeout')).toBe(false);
    });

    it('returns false for numbers', () => {
      expect(isTimeoutError(504)).toBe(false);
    });

    it('returns false for empty object', () => {
      expect(isTimeoutError({})).toBe(false);
    });
  });
});

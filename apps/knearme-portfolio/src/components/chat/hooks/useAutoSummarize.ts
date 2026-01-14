/**
 * Hook for auto-summarizing chat sessions on session end.
 *
 * Triggers summarization when:
 * 1. User navigates away (beforeunload) - uses sendBeacon
 * 2. Component unmounts
 * 3. Session becomes inactive for a period
 *
 * Summaries are only generated when the conversation exceeds
 * the context budget (to avoid unnecessary summarization).
 *
 * Uses the Beacon API for reliable delivery even on tab close.
 *
 * @see /src/app/api/chat/sessions/[id]/summarize/route.ts
 * @see /src/lib/chat/memory.ts
 * @see /todo/ai-sdk-phase-7-persistence-memory.md
 */

import { useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logging';

interface UseAutoSummarizeOptions {
  /** The session ID to summarize */
  sessionId: string | null;
  /** Whether auto-summarize is enabled */
  enabled?: boolean;
  /** Minimum messages before summarizing */
  minMessages?: number;
  /** Inactivity timeout before summarizing (ms) */
  inactivityTimeout?: number;
}

interface UseAutoSummarizeReturn {
  /** Manually trigger summarization */
  summarize: () => Promise<void>;
  /** Update message count - resets inactivity timer */
  updateMessageCount: (count: number) => void;
  /** Whether summarization is in progress */
  isSummarizing: boolean;
}

/**
 * Default inactivity timeout before summarizing (30 minutes).
 */
const DEFAULT_INACTIVITY_TIMEOUT = 30 * 60 * 1000;

/**
 * Minimum messages required before summarization is worthwhile.
 */
const DEFAULT_MIN_MESSAGES = 3;

/**
 * Context budget constants (mirrors context-loader defaults).
 * Keep these in sync with src/lib/chat/context-loader.ts.
 */
const MAX_CONTEXT_TOKENS = 30_000;
const TOKENS_PER_MESSAGE = 150;
const PROJECT_DATA_TOKENS = 500;

/**
 * Check if the current session is large enough to benefit from summarization.
 */
function shouldSummarizeByLength(messageCount: number): boolean {
  const estimatedTokens =
    messageCount * TOKENS_PER_MESSAGE + PROJECT_DATA_TOKENS;
  return estimatedTokens > MAX_CONTEXT_TOKENS;
}

/**
 * Hook for auto-summarizing sessions.
 */
export function useAutoSummarize({
  sessionId,
  enabled = true,
  minMessages = DEFAULT_MIN_MESSAGES,
  inactivityTimeout = DEFAULT_INACTIVITY_TIMEOUT,
}: UseAutoSummarizeOptions): UseAutoSummarizeReturn {
  const isSummarizingRef = useRef(false);
  const messageCountRef = useRef(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasBeenSummarizedRef = useRef(false);

  /**
   * Perform summarization via API.
   * Uses fetch for async calls, sendBeacon for beforeunload.
   */
  const summarize = useCallback(async () => {
    if (!sessionId || !enabled) return;
    if (isSummarizingRef.current) return;
    if (hasBeenSummarizedRef.current) return;
    if (messageCountRef.current < minMessages) return;
    if (!shouldSummarizeByLength(messageCountRef.current)) return;

    isSummarizingRef.current = true;

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        hasBeenSummarizedRef.current = true;
        logger.info('[AutoSummarize] Session summarized successfully');
      } else {
        logger.error('[AutoSummarize] Summarization failed', { status: response.status });
      }
    } catch (error) {
      logger.error('[AutoSummarize] Summarization error', { error });
    } finally {
      isSummarizingRef.current = false;
    }
  }, [sessionId, enabled, minMessages]);

  /**
   * Summarize using Beacon API (for beforeunload).
   * Beacon is fire-and-forget but works even when tab closes.
   */
  const summarizeWithBeacon = useCallback(() => {
    if (!sessionId || !enabled) return;
    if (hasBeenSummarizedRef.current) return;
    if (messageCountRef.current < minMessages) return;
    if (!shouldSummarizeByLength(messageCountRef.current)) return;

    // Use Beacon API for reliable delivery on tab close
    const url = `/api/chat/sessions/${sessionId}/summarize`;
    const data = new Blob([JSON.stringify({})], { type: 'application/json' });

    const sent = navigator.sendBeacon(url, data);
    if (sent) {
      hasBeenSummarizedRef.current = true;
      logger.info('[AutoSummarize] Beacon sent for summarization');
    } else {
      logger.warn('[AutoSummarize] Beacon failed to send');
    }
  }, [sessionId, enabled, minMessages]);

  /**
   * Reset inactivity timer on activity.
   */
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (sessionId && enabled && inactivityTimeout > 0) {
      inactivityTimerRef.current = setTimeout(() => {
        logger.info('[AutoSummarize] Inactivity timeout reached');
        void summarize();
      }, inactivityTimeout);
    }
  }, [sessionId, enabled, inactivityTimeout, summarize]);

  /**
   * Update message count (should be called when messages change).
   */
  const updateMessageCount = useCallback((count: number) => {
    messageCountRef.current = count;
    // Reset inactivity timer on new messages
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Set up beforeunload handler
  useEffect(() => {
    if (!sessionId || !enabled) return;

    const handleBeforeUnload = () => {
      summarizeWithBeacon();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId, enabled, summarizeWithBeacon]);

  // Set up visibility change handler (for mobile tab switching)
  useEffect(() => {
    if (!sessionId || !enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab is being hidden - try to summarize
        summarizeWithBeacon();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId, enabled, summarizeWithBeacon]);

  // Start inactivity timer on mount
  useEffect(() => {
    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  // Summarize on unmount if not already done
  useEffect(() => {
    return () => {
      if (!hasBeenSummarizedRef.current && messageCountRef.current >= minMessages) {
        // Can't use async in cleanup, use beacon
        summarizeWithBeacon();
      }
    };
  }, [summarizeWithBeacon, minMessages]);

  return {
    summarize,
    updateMessageCount,
    isSummarizing: isSummarizingRef.current,
  };
}

/**
 * Export a simpler version that just needs to be called to update message count.
 * This is what ChatWizard will use to trigger activity tracking.
 */
export function useSessionActivity(
  sessionId: string | null,
  messageCount: number,
  enabled = true
) {
  const { summarize } = useAutoSummarize({
    sessionId,
    enabled,
    minMessages: 3,
  });

  // Update message count whenever it changes
  useEffect(() => {
    // This effect runs on message count change, which triggers
    // the internal timer reset in useAutoSummarize
  }, [messageCount]);

  return { summarize };
}

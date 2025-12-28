/**
 * Hook for optimistic saves with retry queue.
 *
 * Provides reliable data persistence with:
 * 1. Immediate optimistic saves (no debounce for user actions)
 * 2. Automatic retry on network failure (exponential backoff)
 * 3. Save status tracking for UI feedback
 * 4. Beacon fallback for tab close (best-effort)
 *
 * @see /src/components/chat/artifacts/shared/SaveStatusBadge.tsx for status display
 * @see /src/app/api/chat/sessions/[id]/route.ts for PATCH endpoint
 * @see /todo/ai-sdk-phase-7-persistence-memory.md
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import type { SaveStatus } from '../artifacts/shared/SaveStatusBadge';

interface SaveItem {
  /** Unique ID for deduplication */
  id: string;
  /** Data to save */
  data: Record<string, unknown>;
  /** Number of retry attempts */
  retries: number;
  /** Timestamp of last attempt */
  lastAttempt: number;
}

interface UseSaveQueueOptions {
  /** Session ID to save to */
  sessionId: string | null;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  baseDelay?: number;
  /** Whether saving is enabled (default: true) */
  enabled?: boolean;
}

interface UseSaveQueueReturn {
  /** Current save status */
  status: SaveStatus;
  /** Error message if status is 'error' */
  errorMessage: string | undefined;
  /** Queue a save operation */
  save: (data: Record<string, unknown>, id?: string) => void;
  /** Force immediate save of pending data */
  flush: () => Promise<void>;
  /** Number of pending saves */
  pendingCount: number;
}

/**
 * Maximum retries before giving up.
 */
const DEFAULT_MAX_RETRIES = 3;

/**
 * Base delay for exponential backoff (doubles each retry).
 */
const DEFAULT_BASE_DELAY = 1000;

/**
 * Debounce time for coalescing rapid saves.
 */
const COALESCE_DELAY = 100;

/**
 * Hook for managing a save queue with retry logic.
 */
export function useSaveQueue({
  sessionId,
  maxRetries = DEFAULT_MAX_RETRIES,
  baseDelay = DEFAULT_BASE_DELAY,
  enabled = true,
}: UseSaveQueueOptions): UseSaveQueueReturn {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [pendingCount, setPendingCount] = useState(0);

  // Queue of pending saves
  const queueRef = useRef<SaveItem[]>([]);
  // Coalesced data waiting to be queued
  const pendingDataRef = useRef<Record<string, unknown>>({});
  // Timer for coalescing
  const coalesceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Timer for retry processing
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Flag to prevent concurrent processing
  const processingRef = useRef(false);

  /**
   * Process the save queue.
   * Attempts to save items in order, with exponential backoff on failure.
   */
  const processQueue = useCallback(async () => {
    if (!sessionId || !enabled || processingRef.current) return;
    if (queueRef.current.length === 0) {
      setStatus('idle');
      setPendingCount(0);
      return;
    }

    processingRef.current = true;
    setStatus('saving');

    const item = queueRef.current[0];
    // TypeScript guard - should never be undefined after empty queue check
    if (!item) {
      processingRef.current = false;
      return;
    }
    const now = Date.now();

    // Check if we need to wait before retrying
    if (item.retries > 0) {
      const delay = baseDelay * Math.pow(2, item.retries - 1);
      const timeSinceLastAttempt = now - item.lastAttempt;
      if (timeSinceLastAttempt < delay) {
        // Schedule retry after remaining delay
        const remaining = delay - timeSinceLastAttempt;
        retryTimerRef.current = setTimeout(() => {
          processingRef.current = false;
          void processQueue();
        }, remaining);
        processingRef.current = false;
        return;
      }
    }

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      // Success - remove from queue
      queueRef.current.shift();
      setPendingCount(queueRef.current.length);

      if (queueRef.current.length === 0) {
        setStatus('saved');
        setErrorMessage(undefined);
        // Reset to idle after showing success
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        // Process next item
        processingRef.current = false;
        void processQueue();
        return;
      }
    } catch (error) {
      console.error('[SaveQueue] Save failed:', error);

      // Update retry count
      item.retries++;
      item.lastAttempt = now;

      if (item.retries > maxRetries) {
        // Give up on this item
        console.error('[SaveQueue] Max retries exceeded, dropping item:', item.id);
        queueRef.current.shift();
        setPendingCount(queueRef.current.length);
        setStatus('error');
        setErrorMessage('Failed to save after multiple attempts');
      } else {
        // Schedule retry with exponential backoff
        const delay = baseDelay * Math.pow(2, item.retries - 1);
        console.log(`[SaveQueue] Retrying in ${delay}ms (attempt ${item.retries}/${maxRetries})`);
        retryTimerRef.current = setTimeout(() => {
          processingRef.current = false;
          void processQueue();
        }, delay);
      }
    }

    processingRef.current = false;
  }, [sessionId, enabled, maxRetries, baseDelay]);

  /**
   * Add data to the save queue.
   * Coalesces rapid calls into a single save.
   */
  const save = useCallback(
    (data: Record<string, unknown>, id?: string) => {
      if (!sessionId || !enabled) return;

      // Merge with pending data
      pendingDataRef.current = {
        ...pendingDataRef.current,
        ...data,
      };

      // Clear existing coalesce timer
      if (coalesceTimerRef.current) {
        clearTimeout(coalesceTimerRef.current);
      }

      // Set new coalesce timer
      coalesceTimerRef.current = setTimeout(() => {
        const coalescedData = { ...pendingDataRef.current };
        pendingDataRef.current = {};

        // Add to queue
        const saveId = id || `save-${Date.now()}`;

        // Check if we already have a pending save with this ID
        const existingIndex = queueRef.current.findIndex((item) => item.id === saveId);
        const existingItem = existingIndex >= 0 ? queueRef.current[existingIndex] : undefined;
        if (existingItem) {
          // Merge data into existing item
          existingItem.data = {
            ...existingItem.data,
            ...coalescedData,
          };
        } else {
          // Add new item
          queueRef.current.push({
            id: saveId,
            data: coalescedData,
            retries: 0,
            lastAttempt: 0,
          });
        }

        setPendingCount(queueRef.current.length);
        void processQueue();
      }, COALESCE_DELAY);
    },
    [sessionId, enabled, processQueue]
  );

  /**
   * Force immediate save of all pending data.
   * Used before tab close or navigation.
   */
  const flush = useCallback(async () => {
    if (!sessionId || !enabled) return;

    // Clear coalesce timer and immediately queue pending data
    if (coalesceTimerRef.current) {
      clearTimeout(coalesceTimerRef.current);
      coalesceTimerRef.current = null;
    }

    if (Object.keys(pendingDataRef.current).length > 0) {
      queueRef.current.push({
        id: `flush-${Date.now()}`,
        data: { ...pendingDataRef.current },
        retries: 0,
        lastAttempt: 0,
      });
      pendingDataRef.current = {};
    }

    // Process queue synchronously (best effort)
    while (queueRef.current.length > 0) {
      const item = queueRef.current[0];
      // TypeScript guard - should never be undefined in while loop
      if (!item) break;
      try {
        const response = await fetch(`/api/chat/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });
        if (response.ok) {
          queueRef.current.shift();
        } else {
          break; // Stop on first failure
        }
      } catch {
        break; // Stop on error
      }
    }
  }, [sessionId, enabled]);

  /**
   * Use Beacon API on beforeunload for best-effort save.
   */
  useEffect(() => {
    if (!sessionId || !enabled) return;

    const handleBeforeUnload = () => {
      // Merge any pending coalesced data
      if (Object.keys(pendingDataRef.current).length > 0) {
        queueRef.current.push({
          id: `beacon-${Date.now()}`,
          data: { ...pendingDataRef.current },
          retries: 0,
          lastAttempt: 0,
        });
        pendingDataRef.current = {};
      }

      // Send all pending saves via Beacon
      for (const item of queueRef.current) {
        const blob = new Blob([JSON.stringify(item.data)], {
          type: 'application/json',
        });
        navigator.sendBeacon(`/api/chat/sessions/${sessionId}`, blob);
      }
      queueRef.current = [];
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, enabled]);

  /**
   * Cleanup timers on unmount.
   */
  useEffect(() => {
    return () => {
      if (coalesceTimerRef.current) {
        clearTimeout(coalesceTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  return {
    status,
    errorMessage,
    save,
    flush,
    pendingCount,
  };
}

/**
 * Offline Sync Hook.
 *
 * Manages automatic synchronization of queued drafts when online.
 * Listens for online/offline events and processes the queue accordingly.
 *
 * Features:
 * - Automatic sync when coming back online
 * - Manual sync trigger
 * - Queue status monitoring
 * - Retry logic with exponential backoff
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOnline, queueCount, isSyncing, syncNow } = useOfflineSync();
 *
 *   return (
 *     <div>
 *       {!isOnline && <Badge>Offline</Badge>}
 *       {queueCount > 0 && <span>{queueCount} drafts pending</span>}
 *       <Button onClick={syncNow} disabled={isSyncing}>Sync Now</Button>
 *     </div>
 *   );
 * }
 * ```
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getQueue,
  getQueueCount,
  removeFromQueue,
  updateQueueItem,
  type QueuedDraft,
} from './draft-queue';

const MAX_RETRY_ATTEMPTS = 3;
const SYNC_DEBOUNCE_MS = 2000;

interface UseOfflineSyncOptions {
  /** Callback when sync completes successfully */
  onSyncComplete?: (syncedCount: number) => void;
  /** Callback when sync fails */
  onSyncError?: (error: Error, draft: QueuedDraft) => void;
}

interface UseOfflineSyncReturn {
  /** Whether the browser is currently online */
  isOnline: boolean;
  /** Number of drafts waiting to be synced */
  queueCount: number;
  /** Whether sync is currently in progress */
  isSyncing: boolean;
  /** Manually trigger sync */
  syncNow: () => Promise<void>;
  /** Last sync timestamp */
  lastSyncAt: Date | null;
}

/**
 * Syncs a single draft to the server.
 *
 * @param draft - The queued draft to sync
 * @returns True if sync was successful
 */
async function syncDraft(draft: QueuedDraft): Promise<boolean> {
  const url = draft.projectId
    ? `/api/projects/${draft.projectId}`
    : '/api/projects';

  const method = draft.projectId ? 'PATCH' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(draft.data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Sync failed: ${response.status}`);
  }

  return true;
}

export function useOfflineSync(
  options: UseOfflineSyncOptions = {}
): UseOfflineSyncReturn {
  const { onSyncComplete, onSyncError } = options;

  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  // Refs to avoid stale closures
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  /**
   * Updates the queue count from IndexedDB.
   */
  const refreshQueueCount = useCallback(async () => {
    try {
      const count = await getQueueCount();
      setQueueCount(count);
    } catch (error) {
      console.error('[OfflineSync] Failed to get queue count:', error);
    }
  }, []);

  /**
   * Processes the offline queue, syncing each draft.
   */
  const processQueue = useCallback(async () => {
    if (isSyncingRef.current) {
      console.log('[OfflineSync] Sync already in progress, skipping');
      return;
    }

    if (!navigator.onLine) {
      console.log('[OfflineSync] Offline, skipping sync');
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);

    let syncedCount = 0;

    try {
      const queue = await getQueue();

      if (queue.length === 0) {
        console.log('[OfflineSync] Queue is empty, nothing to sync');
        return;
      }

      console.log(`[OfflineSync] Processing ${queue.length} queued drafts`);

      for (const draft of queue) {
        // Skip items that have exceeded retry limit
        if (draft.attempts >= MAX_RETRY_ATTEMPTS) {
          console.warn(
            `[OfflineSync] Skipping draft ${draft.id} - exceeded max attempts`
          );
          continue;
        }

        try {
          await syncDraft(draft);
          await removeFromQueue(draft.id);
          syncedCount++;
          console.log(`[OfflineSync] Synced draft ${draft.id}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error(
            `[OfflineSync] Failed to sync draft ${draft.id}:`,
            errorMessage
          );

          // Update attempt count and error
          await updateQueueItem(draft.id, {
            attempts: draft.attempts + 1,
            lastError: errorMessage,
          });

          if (onSyncError) {
            onSyncError(
              error instanceof Error ? error : new Error(errorMessage),
              draft
            );
          }
        }
      }

      if (syncedCount > 0 && onSyncComplete) {
        onSyncComplete(syncedCount);
      }

      setLastSyncAt(new Date());
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
      await refreshQueueCount();
    }
  }, [onSyncComplete, onSyncError, refreshQueueCount]);

  /**
   * Debounced sync trigger to avoid multiple rapid syncs.
   */
  const scheduleSyncDebounced = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      processQueue();
    }, SYNC_DEBOUNCE_MS);
  }, [processQueue]);

  /**
   * Manually trigger sync immediately.
   */
  const syncNow = useCallback(async () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    await processQueue();
  }, [processQueue]);

  // Initialize online state and queue count
  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshQueueCount();
  }, [refreshQueueCount]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineSync] Back online, scheduling sync');
      setIsOnline(true);
      scheduleSyncDebounced();
    };

    const handleOffline = () => {
      console.log('[OfflineSync] Gone offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [scheduleSyncDebounced]);

  // Attempt initial sync on mount if online and queue has items
  useEffect(() => {
    if (isOnline && queueCount > 0) {
      scheduleSyncDebounced();
    }
  }, [isOnline, queueCount, scheduleSyncDebounced]);

  return {
    isOnline,
    queueCount,
    isSyncing,
    syncNow,
    lastSyncAt,
  };
}

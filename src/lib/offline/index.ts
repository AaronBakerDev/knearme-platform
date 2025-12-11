/**
 * Offline Support Module.
 *
 * Provides IndexedDB-based draft queuing and automatic sync when online.
 * Used in conjunction with the PWA service worker for full offline support.
 *
 * @example
 * ```tsx
 * import { addToQueue, useOfflineSync } from '@/lib/offline';
 *
 * // Queue a draft when offline
 * if (!navigator.onLine) {
 *   await addToQueue(draftData, projectId);
 * }
 *
 * // Monitor sync status
 * const { isOnline, queueCount, isSyncing } = useOfflineSync();
 * ```
 */

export {
  addToQueue,
  getQueue,
  getQueueCount,
  removeFromQueue,
  updateQueueItem,
  clearQueue,
  type QueuedDraft,
} from './draft-queue';

export { useOfflineSync } from './use-offline-sync';

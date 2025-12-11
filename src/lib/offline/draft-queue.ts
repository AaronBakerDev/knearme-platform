/**
 * Offline Draft Queue with IndexedDB.
 *
 * Stores draft projects locally when offline, automatically syncs when
 * the connection is restored. Uses IndexedDB for persistence across
 * browser sessions.
 *
 * Flow:
 * 1. User creates/edits project while offline
 * 2. Draft is saved to IndexedDB queue
 * 3. When online, queue is processed and synced to server
 * 4. Successfully synced items are removed from queue
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 * @see https://web.dev/articles/indexeddb
 */

const DB_NAME = 'knearme-offline';
const DB_VERSION = 1;
const STORE_NAME = 'draft-queue';

/**
 * Represents a queued draft project that needs to be synced.
 */
export interface QueuedDraft {
  /** Unique ID for this queue item */
  id: string;
  /** The project ID (if updating existing) or undefined (if creating) */
  projectId?: string;
  /** Draft data to sync */
  data: {
    title?: string;
    description?: string;
    project_type_slug?: string;
    city_slug?: string;
    seo_keywords?: string[];
    tags?: string[];
    /** Additional fields as needed */
    [key: string]: unknown;
  };
  /** ISO timestamp when queued */
  queuedAt: string;
  /** Number of sync attempts */
  attempts: number;
  /** Last error message if sync failed */
  lastError?: string;
}

/**
 * Opens the IndexedDB database, creating object stores if needed.
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store for draft queue
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('queuedAt', 'queuedAt', { unique: false });
      }
    };
  });
}

/**
 * Adds a draft to the offline queue.
 *
 * @param draft - The draft data to queue
 * @param projectId - Optional project ID if updating existing project
 * @returns The queued draft with generated ID
 */
export async function addToQueue(
  draft: QueuedDraft['data'],
  projectId?: string
): Promise<QueuedDraft> {
  const db = await openDatabase();

  const queuedDraft: QueuedDraft = {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    projectId,
    data: draft,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(queuedDraft);

    request.onsuccess = () => {
      console.log('[OfflineQueue] Draft added to queue:', queuedDraft.id);
      resolve(queuedDraft);
    };

    request.onerror = () => {
      reject(new Error('Failed to add draft to queue'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets all drafts in the queue.
 */
export async function getQueue(): Promise<QueuedDraft[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Failed to get queue'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Removes a draft from the queue after successful sync.
 */
export async function removeFromQueue(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log('[OfflineQueue] Draft removed from queue:', id);
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to remove draft from queue'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Updates a draft's attempt count and error message after failed sync.
 */
export async function updateQueueItem(
  id: string,
  updates: Partial<Pick<QueuedDraft, 'attempts' | 'lastError'>>
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const draft = getRequest.result as QueuedDraft | undefined;
      if (!draft) {
        reject(new Error('Draft not found in queue'));
        return;
      }

      const updated = { ...draft, ...updates };
      store.put(updated);
      resolve();
    };

    getRequest.onerror = () => {
      reject(new Error('Failed to update queue item'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Clears all items from the queue.
 * Use with caution - typically only for testing or user-initiated clear.
 */
export async function clearQueue(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('[OfflineQueue] Queue cleared');
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to clear queue'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets the count of items in the queue.
 */
export async function getQueueCount(): Promise<number> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Failed to get queue count'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Wizard Session Storage with IndexedDB.
 *
 * Persists wizard progress locally so users can resume if they
 * refresh the browser or navigate away mid-wizard.
 *
 * Follows the same pattern as draft-queue.ts for consistency.
 *
 * @see /src/lib/offline/draft-queue.ts
 */

const DB_NAME = 'knearme-offline';
const DB_VERSION = 2; // Increment to add new store
const STORE_NAME = 'wizard-sessions';

export type WizardStep = 'upload' | 'analyzing' | 'interview' | 'generating' | 'review' | 'published';

export interface WizardSession {
  /** The project ID this wizard session belongs to */
  projectId: string;
  /** Current wizard step */
  step: WizardStep;
  /** Uploaded image paths (from Supabase storage) */
  images: Array<{
    id: string;
    url: string;
    filename: string;
    storage_path: string;
    width?: number;
    height?: number;
    image_type?: 'before' | 'after' | 'progress' | 'detail';
  }>;
  /** Interview responses (if collected) */
  interviewResponses?: Array<{
    question_id: string;
    question_text: string;
    answer: string;
  }>;
  /** Generated/edited content (if available) */
  editedContent?: {
    title: string;
    description: string;
    seo_title: string;
    seo_description: string;
    tags: string[];
    materials: string[];
    techniques: string[];
  };
  /** ISO timestamp when last updated */
  updatedAt: string;
  /** ISO timestamp when session started */
  createdAt: string;
}

/**
 * Opens the IndexedDB database, creating object stores if needed.
 * Handles upgrade from version 1 (draft-queue only) to version 2 (+ wizard-sessions).
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
      const oldVersion = event.oldVersion;

      // Create draft-queue store if upgrading from v0 (doesn't exist yet)
      if (oldVersion < 1 && !db.objectStoreNames.contains('draft-queue')) {
        const draftStore = db.createObjectStore('draft-queue', { keyPath: 'id' });
        draftStore.createIndex('projectId', 'projectId', { unique: false });
        draftStore.createIndex('queuedAt', 'queuedAt', { unique: false });
      }

      // Create wizard-sessions store if upgrading from v1 to v2
      if (oldVersion < 2 && !db.objectStoreNames.contains(STORE_NAME)) {
        const wizardStore = db.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
        wizardStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        wizardStore.createIndex('step', 'step', { unique: false });
      }
    };
  });
}

/**
 * Saves or updates a wizard session by projectId.
 *
 * @param session - The wizard session data to persist
 */
export async function saveWizardSession(session: WizardSession): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(session);

    request.onsuccess = () => {
      console.log('[WizardStorage] Session saved:', session.projectId, 'step:', session.step);
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to save wizard session'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets a wizard session for a specific project.
 *
 * @param projectId - The project ID to retrieve
 * @returns The wizard session or null if not found
 */
export async function getWizardSession(projectId: string): Promise<WizardSession | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(projectId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error('Failed to get wizard session'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets the most recent wizard session (for recovery prompt on page load).
 *
 * @returns The most recently updated session or null if none exist
 */
export async function getLatestWizardSession(): Promise<WizardSession | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('updatedAt');

    // Get all sessions ordered by updatedAt descending
    const request = index.openCursor(null, 'prev');

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        // Return the first (most recent) session
        resolve(cursor.value as WizardSession);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      reject(new Error('Failed to get latest wizard session'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Deletes a wizard session for a specific project.
 *
 * @param projectId - The project ID to delete
 */
export async function deleteWizardSession(projectId: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(projectId);

    request.onsuccess = () => {
      console.log('[WizardStorage] Session deleted:', projectId);
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to delete wizard session'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Clears all wizard sessions.
 * Use with caution - typically only for testing or user-initiated clear.
 */
export async function clearAllSessions(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('[WizardStorage] All sessions cleared');
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to clear wizard sessions'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

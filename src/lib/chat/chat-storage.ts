/**
 * Chat Session Storage with IndexedDB.
 *
 * Persists chat wizard progress locally so users can resume if they
 * refresh the browser or navigate away mid-conversation.
 *
 * Follows the same pattern as wizard-storage.ts for consistency.
 * Upgrades DB to version 3 to add chat-sessions store.
 *
 * @see /src/lib/wizard/wizard-storage.ts
 */

import type { ChatSession, ChatMessage, ExtractedProjectData, ChatPhase, UploadedImage, GeneratedContent } from './chat-types';

const DB_NAME = 'knearme-offline';
const DB_VERSION = 3; // Increment to add chat-sessions store
const STORE_NAME = 'chat-sessions';

// Re-export types for convenience
export type { ChatSession, ChatMessage, ExtractedProjectData, ChatPhase };

/**
 * Opens the IndexedDB database, creating object stores if needed.
 * Handles upgrades from previous versions.
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

      // Create draft-queue store if upgrading from v0
      if (oldVersion < 1 && !db.objectStoreNames.contains('draft-queue')) {
        const draftStore = db.createObjectStore('draft-queue', { keyPath: 'id' });
        draftStore.createIndex('projectId', 'projectId', { unique: false });
        draftStore.createIndex('queuedAt', 'queuedAt', { unique: false });
      }

      // Create wizard-sessions store if upgrading from v1 to v2
      if (oldVersion < 2 && !db.objectStoreNames.contains('wizard-sessions')) {
        const wizardStore = db.createObjectStore('wizard-sessions', { keyPath: 'projectId' });
        wizardStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        wizardStore.createIndex('step', 'step', { unique: false });
      }

      // Create chat-sessions store if upgrading from v2 to v3
      if (oldVersion < 3 && !db.objectStoreNames.contains(STORE_NAME)) {
        const chatStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        chatStore.createIndex('projectId', 'projectId', { unique: false });
        chatStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        chatStore.createIndex('phase', 'phase', { unique: false });
      }
    };
  });
}

/**
 * Creates a new chat session.
 *
 * @param projectId - The project ID this session belongs to
 * @returns The new session
 */
export function createChatSession(projectId: string): ChatSession {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    projectId,
    messages: [],
    extractedData: {},
    images: [],
    phase: 'conversation',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Saves or updates a chat session.
 *
 * @param session - The chat session to persist
 */
export async function saveChatSession(session: ChatSession): Promise<void> {
  const db = await openDatabase();

  // Update timestamp
  session.updatedAt = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(session);

    request.onsuccess = () => {
      console.log('[ChatStorage] Session saved:', session.id, 'phase:', session.phase);
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to save chat session'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets a chat session by ID.
 *
 * @param sessionId - The session ID to retrieve
 * @returns The chat session or null if not found
 */
export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(sessionId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error('Failed to get chat session'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets a chat session by project ID.
 *
 * @param projectId - The project ID to search for
 * @returns The chat session or null if not found
 */
export async function getChatSessionByProject(projectId: string): Promise<ChatSession | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('projectId');
    const request = index.get(projectId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error('Failed to get chat session by project'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets the most recent chat session (for recovery prompt on page load).
 *
 * @returns The most recently updated session or null if none exist
 */
export async function getLatestChatSession(): Promise<ChatSession | null> {
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
        resolve(cursor.value as ChatSession);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      reject(new Error('Failed to get latest chat session'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Deletes a chat session.
 *
 * @param sessionId - The session ID to delete
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(sessionId);

    request.onsuccess = () => {
      console.log('[ChatStorage] Session deleted:', sessionId);
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to delete chat session'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Adds a message to a chat session.
 *
 * @param sessionId - The session to update
 * @param message - The message to add
 */
export async function addMessage(sessionId: string, message: ChatMessage): Promise<void> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.messages.push(message);
  await saveChatSession(session);
}

/**
 * Updates extracted data in a chat session.
 *
 * @param sessionId - The session to update
 * @param data - The extracted data to merge
 */
export async function updateExtractedData(
  sessionId: string,
  data: Partial<ExtractedProjectData>
): Promise<void> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.extractedData = { ...session.extractedData, ...data };
  await saveChatSession(session);
}

/**
 * Updates the phase of a chat session.
 *
 * @param sessionId - The session to update
 * @param phase - The new phase
 */
export async function updatePhase(sessionId: string, phase: ChatPhase): Promise<void> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.phase = phase;
  await saveChatSession(session);
}

/**
 * Updates images in a chat session.
 *
 * @param sessionId - The session to update
 * @param images - The images to set
 */
export async function updateImages(sessionId: string, images: UploadedImage[]): Promise<void> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.images = images;
  await saveChatSession(session);
}

/**
 * Updates generated content in a chat session.
 *
 * @param sessionId - The session to update
 * @param content - The generated content
 */
export async function updateGeneratedContent(
  sessionId: string,
  content: GeneratedContent
): Promise<void> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.generatedContent = content;
  await saveChatSession(session);
}

/**
 * Clears all chat sessions.
 * Use with caution - typically only for testing or user-initiated clear.
 */
export async function clearAllChatSessions(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('[ChatStorage] All chat sessions cleared');
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to clear chat sessions'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

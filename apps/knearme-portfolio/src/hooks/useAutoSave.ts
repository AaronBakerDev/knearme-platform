/**
 * Auto-Save Hook with Visual Feedback
 *
 * Provides debounced auto-save functionality with status tracking.
 * Use this for content editing that needs to persist automatically.
 *
 * @example
 * const { saveStatus, triggerSave } = useAutoSave(
 *   editedContent,
 *   async (data) => await saveToServer(data),
 *   { debounceMs: 1000 }
 * );
 *
 * return (
 *   <div>
 *     <SaveIndicator status={saveStatus} />
 *     <textarea onChange={(e) => setContent(e.target.value)} />
 *   </div>
 * );
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseAutoSaveOptions {
  /** Debounce delay in milliseconds (default: 1000) */
  debounceMs?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Callback when save succeeds */
  onSuccess?: () => void;
  /** Callback when save fails */
  onError?: (error: Error) => void;
}

export interface UseAutoSaveReturn {
  /** Current save status */
  saveStatus: SaveStatus;
  /** Manually trigger a save (bypasses debounce) */
  saveNow: () => Promise<void>;
  /** Reset status to idle */
  resetStatus: () => void;
  /** Last error if status is 'error' */
  error: Error | null;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
}

export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const {
    debounceMs = 1000,
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs to track latest values
  const dataRef = useRef<T>(data);
  const saveFnRef = useRef(saveFn);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  // Update refs
  useEffect(() => {
    dataRef.current = data;
    saveFnRef.current = saveFn;
  }, [data, saveFn]);

  // Core save function
  const performSave = useCallback(async () => {
    const currentData = dataRef.current;
    const serialized = JSON.stringify(currentData);

    // Skip if data hasn't changed since last save
    if (serialized === lastSavedRef.current) {
      return;
    }

    setSaveStatus('saving');
    setError(null);

    try {
      await saveFnRef.current(currentData);
      lastSavedRef.current = serialized;
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      onSuccess?.();

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus((current) => current === 'saved' ? 'idle' : current);
      }, 2000);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Save failed');
      setError(error);
      setSaveStatus('error');
      onError?.(error);
    }
  }, [onSuccess, onError]);

  // Track unsaved changes via ref to avoid lint warning
  const hasUnsavedRef = useRef(false);

  // Debounced auto-save effect
  useEffect(() => {
    if (!enabled) return;

    const serialized = JSON.stringify(data);

    // Check if data has actually changed
    if (serialized === lastSavedRef.current) {
      return;
    }

    // Mark as having unsaved changes (via ref + deferred setState)
    hasUnsavedRef.current = true;
    const unsavedTimeout = setTimeout(() => {
      setHasUnsavedChanges(true);
    }, 0);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new debounced save
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      clearTimeout(unsavedTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debounceMs, performSave]);

  // Manual save function (immediate, bypasses debounce)
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await performSave();
  }, [performSave]);

  // Reset status function
  const resetStatus = useCallback(() => {
    setSaveStatus('idle');
    setError(null);
  }, []);

  return {
    saveStatus,
    saveNow,
    resetStatus,
    error,
    hasUnsavedChanges,
  };
}

export default useAutoSave;

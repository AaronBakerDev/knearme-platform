import { useEffect, useRef, useState } from 'react';
import type { UIMessage } from 'ai';
import type { ChatPhase, ExtractedProjectData } from '@/lib/chat/chat-types';
import { useAutoSummarize } from './useAutoSummarize';
import { useSaveQueue } from './useSaveQueue';

interface UsePersistenceParams {
  projectId: string | null;
  isEditMode: boolean;
  status: string;
  messages: UIMessage[];
  phase: ChatPhase;
  extractedData: ExtractedProjectData;
  setExtractedData: React.Dispatch<React.SetStateAction<ExtractedProjectData>>;
  logPreviewEvent: (event: string, details?: Record<string, unknown>) => void;
}

export function usePersistence({
  projectId,
  isEditMode,
  status,
  messages,
  phase,
  extractedData,
  setExtractedData,
  logPreviewEvent,
}: UsePersistenceParams) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Track which messages have been saved to avoid duplicates
  const savedMessageIds = useRef<Set<string>>(new Set());
  const lastMessageCount = useRef<number>(0);
  const processedExtractToolCalls = useRef<Set<string>>(new Set());
  const processedGeneratedToolCalls = useRef<Set<string>>(new Set());
  /**
   * Track side-effect tool calls that were loaded from session history.
   * These should NOT fire their side-effects again (e.g., showPortfolioPreview
   * would auto-open the preview overlay on every page load).
   * @see ArtifactRenderer.tsx - uses this to skip firing side-effects
   */
  const processedSideEffectToolCalls = useRef<Set<string>>(new Set());

  /**
   * Auto-summarize session on end (tab close, inactivity).
   * Only triggers when the conversation exceeds the context budget.
   * Uses Beacon API for reliable delivery even on tab close.
   *
   * @see /src/lib/chat/memory.ts for memory system
   * @see /src/app/api/chat/sessions/[id]/summarize/route.ts
   */
  const { updateMessageCount } = useAutoSummarize({
    sessionId,
    enabled: true,
    minMessages: 3,
  });

  /**
   * Optimistic save queue with retry.
   * Replaces the old debounced save for more reliable persistence.
   *
   * @see /src/components/chat/hooks/useSaveQueue.ts
   */
  const { save: queueSave, status: saveStatus } = useSaveQueue({
    sessionId,
    enabled: true,
  });

  /**
   * Save new messages to database after AI responses complete.
   * Runs when status changes from streaming to ready.
   */
  useEffect(() => {
    // Only save when we have a session and streaming just finished
    if (!sessionId || status !== 'ready') return;
    if (messages.length <= lastMessageCount.current) return;

    async function saveNewMessages() {
      const newMessages = messages.slice(lastMessageCount.current);

      for (const msg of newMessages) {
        // Skip if already saved or is welcome message
        if (savedMessageIds.current.has(msg.id)) continue;
        if (msg.id === 'welcome') continue;

        try {
          const parts = msg.parts;
          // Extract text content from parts
          const textContent =
            parts
              ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
              .map((p) => p.text)
              .join('\n') || '';
          const hasParts = Array.isArray(parts) && parts.length > 0;
          const hasNonTextParts = hasParts && parts.some((p) => p.type !== 'text');

          if (!textContent && !hasNonTextParts) continue;

          const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: msg.role,
              content: textContent,
              parts: hasParts ? parts : undefined, // Store full parts array including tool calls
              metadata: {},
            }),
          });

          if (response.ok) {
            savedMessageIds.current.add(msg.id);
          }
        } catch (err) {
          console.error('[ChatWizard] Failed to save message:', err);
        }
      }

      lastMessageCount.current = messages.length;
    }

    saveNewMessages();
  }, [sessionId, status, messages]);

  /**
   * Update auto-summarize message count on message changes.
   * This resets the inactivity timer and ensures proper summarization.
   */
  useEffect(() => {
    updateMessageCount(messages.length);
  }, [messages.length, updateMessageCount]);

  /**
   * Check for tool results in messages to extract data.
   *
   * In AI SDK v6, tool parts use type `tool-${toolName}` pattern
   * and have `state` and `output` properties.
   */
  useEffect(() => {
    if (messages.length === 0) return;

    const pendingResults: ExtractedProjectData[] = [];

    for (const message of messages) {
      if (message.role !== 'assistant' || !message.parts) continue;

      for (const part of message.parts) {
        if (typeof part !== 'object' || part === null) continue;

        const toolPart = part as {
          type?: string;
          state?: string;
          output?: unknown;
          toolCallId?: string;
        };

        // In v6, tool parts have type 'tool-extractProjectData'
        // and state 'output-available' when result is ready
        if (toolPart.type !== 'tool-extractProjectData') continue;
        if (toolPart.state !== 'output-available') continue;
        if (!toolPart.toolCallId) continue;
        if (processedExtractToolCalls.current.has(toolPart.toolCallId)) continue;

        const result = toolPart.output as ExtractedProjectData;
        if (result && typeof result === 'object') {
          pendingResults.push(result);
          processedExtractToolCalls.current.add(toolPart.toolCallId);
          logPreviewEvent('extractProjectData', {
            toolCallId: toolPart.toolCallId,
            keys: Object.keys(result),
          });
        }
      }
    }

    if (pendingResults.length > 0) {
      setExtractedData((prev) =>
        pendingResults.reduce<ExtractedProjectData>(
          (acc, result) => ({ ...acc, ...result }),
          prev
        )
      );
    }
  }, [messages, logPreviewEvent, setExtractedData]);

  useEffect(() => {
    if (messages.length === 0) {
      processedExtractToolCalls.current.clear();
    }
  }, [messages.length]);

  /**
   * Save extracted data to session when it changes.
   * Uses optimistic save queue with automatic retry.
   */
  useEffect(() => {
    if (!sessionId || Object.keys(extractedData).length === 0) return;

    // Queue save with coalescing (handles rapid updates)
    queueSave({
      extracted_data: extractedData,
      phase,
    });
  }, [sessionId, extractedData, phase, queueSave]);

  /**
   * Sync extracted data to project record.
   */
  const lastSyncedData = useRef<string>('');

  useEffect(() => {
    // Skip if no projectId, no data, or edit mode
    if (!projectId || isEditMode) return;
    if (Object.keys(extractedData).length === 0) return;

    // Check if data has actually changed (avoid unnecessary API calls)
    const dataHash = JSON.stringify(extractedData);
    if (dataHash === lastSyncedData.current) return;

    // Debounce: wait 1 second after last change before syncing
    const syncTimeout = setTimeout(async () => {
      try {
        // Map extracted fields to project API fields
        const projectUpdate: Record<string, unknown> = {};

        if (extractedData.project_type) {
          projectUpdate.project_type = extractedData.project_type;
        }
        if (extractedData.city) {
          projectUpdate.city = extractedData.city;
        }
        if (extractedData.state) {
          projectUpdate.state = extractedData.state;
        }
        if (extractedData.duration) {
          projectUpdate.duration = extractedData.duration;
        }
        if (extractedData.materials_mentioned?.length) {
          projectUpdate.materials = extractedData.materials_mentioned;
        }
        if (extractedData.techniques_mentioned?.length) {
          projectUpdate.techniques = extractedData.techniques_mentioned;
        }
        // Map interview fields to case-study narrative fields
        if (extractedData.customer_problem) {
          projectUpdate.challenge = extractedData.customer_problem;
        }
        if (extractedData.solution_approach) {
          projectUpdate.solution = extractedData.solution_approach;
        }

        // Only sync if we have fields to update
        if (Object.keys(projectUpdate).length === 0) return;

        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectUpdate),
        });

        if (response.ok) {
          lastSyncedData.current = dataHash;
          console.log('[ChatWizard] Synced extracted data to project:', Object.keys(projectUpdate));
        } else {
          console.error('[ChatWizard] Failed to sync extracted data:', response.status);
        }
      } catch (err) {
        console.error('[ChatWizard] Error syncing extracted data:', err);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(syncTimeout);
  }, [projectId, extractedData, isEditMode]);

  return {
    sessionId,
    setSessionId,
    sessionIdRef,
    saveStatus,
    savedMessageIds,
    lastMessageCount,
    processedGeneratedToolCalls,
    processedSideEffectToolCalls,
  };
}

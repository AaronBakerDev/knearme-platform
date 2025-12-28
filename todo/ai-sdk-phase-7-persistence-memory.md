# AI SDK Phase 7 — Persistence & Memory

> Goal: Save progress incrementally and enable multi-session memory.
> Source of truth: `docs/ai-sdk/implementation-roadmap.md`

## Session Recovery
- [x] Implement `useSessionRecovery` IndexedDB checkpoints
- [x] Add recovery prompt UI

## Incremental Save
- [x] Add PATCH endpoint for partial updates
- [x] Update `extractProjectData` tool to save incrementally
- [x] Add save status badge to artifacts
- [x] Implement optimistic save + retry queue

## Memory System
- [x] Add database columns for project memory + session summary
- [x] Implement `summarizeSession` tool
- [x] Build `buildSessionContext` helper
- [x] Auto-summarize on session end

## Deliverables
- [x] No data loss on tab close
- [x] AI remembers key facts across sessions

## References
- `docs/ai-sdk/implementation-roadmap.md`

---

## Implementation Details (Dec 26, 2025)

### Session Recovery System

**Components Created:**
| File | Purpose |
|------|---------|
| `src/components/chat/hooks/useSessionRecovery.ts` | IndexedDB checkpoint hook |
| `src/components/chat/RecoveryPrompt.tsx` | Recovery UI component |

**How It Works:**
1. `useSessionRecovery` hook saves chat state to IndexedDB on changes (1s debounce)
2. On mount, checks for local session newer than server data
3. If found, shows `RecoveryPrompt` with restore/discard options
4. User can restore messages, images, extracted data, and phase

**Key Patterns:**
- Uses existing `chat-storage.ts` IndexedDB library (DB version 3)
- Checkpoints disabled in edit mode (fresh sessions per visit)
- Automatic cleanup of stale sessions (older than server data)

**Integration in ChatWizard:**
```typescript
// Hook usage
const { recoveryState, acceptRecovery, discardRecovery, saveCheckpoint } = useSessionRecovery({
  projectId,
  enableCheckpoints: !isEditMode,
});

// Checkpoint on state change
useEffect(() => {
  if (isEditMode) return;
  if (messages.length <= 1) return;
  saveCheckpoint({ messages, extractedData, images: uploadedImages, phase });
}, [messages, extractedData, uploadedImages, phase]);

// RecoveryPrompt in JSX
<RecoveryPrompt
  recoveryState={recoveryState}
  onAccept={handleAcceptRecovery}
  onDiscard={handleDiscardRecovery}
/>
```

### Auto-Summarize System

**Components Created:**
| File | Purpose |
|------|---------|
| `src/components/chat/hooks/useAutoSummarize.ts` | Auto-summarization hook |
| `src/app/api/chat/sessions/[id]/summarize/route.ts` | Summarization API endpoint |
| `src/lib/chat/memory.ts` | Memory system helpers |

**How It Works:**
1. `useAutoSummarize` hook tracks message count and session activity
2. When session ends (tab close, visibility hidden, inactivity), triggers summarization
3. Uses Beacon API for reliable delivery even on tab close
4. AI generates brief summary and extracts key facts (preferences, corrections, context)
5. Facts stored in session and propagated to project-level memory

**Key Patterns:**
- Beacon API for fire-and-forget summarization on tab close
- Inactivity timeout (30 min default) triggers background summarization
- Minimum message threshold (3) prevents summarizing empty sessions
- Disabled in edit mode (ephemeral sessions)

**Integration in ChatWizard:**
```typescript
// Hook usage
const { updateMessageCount } = useAutoSummarize({
  sessionId,
  enabled: !isEditMode,
  minMessages: 3,
});

// Update count on message changes
useEffect(() => {
  updateMessageCount(messages.length);
}, [messages.length, updateMessageCount]);
```

### Incremental Save System

**Components Created:**
| File | Purpose |
|------|---------|
| `src/components/chat/hooks/useSaveQueue.ts` | Optimistic save queue with retry |
| `src/app/api/chat/sessions/[id]/route.ts` | PATCH endpoint (already existed) |

**How It Works:**
1. `useSaveQueue` hook receives save requests with data
2. Coalesces rapid saves (100ms window) to reduce API calls
3. Processes queue sequentially with automatic retry on failure
4. Uses exponential backoff (1s, 2s, 4s) for retries
5. Beacon API fallback on tab close for pending saves

**Key Patterns:**
- Coalescing: Rapid save calls within 100ms merge into single request
- Retry: Up to 3 attempts with exponential backoff
- Beacon fallback: Best-effort save on beforeunload
- Status tracking: idle/saving/saved/error for UI feedback

**Integration in ChatWizard:**
```typescript
// Hook usage
const { save: queueSave, status: saveStatus } = useSaveQueue({
  sessionId,
  enabled: !isEditMode,
});

// Save on data changes (replaces old debounced save)
useEffect(() => {
  if (!sessionId || Object.keys(extractedData).length === 0) return;
  if (isEditMode) return;
  queueSave({ extracted_data: extractedData, phase });
}, [sessionId, extractedData, phase, isEditMode, queueSave]);

// Save status indicator in UI
{!isEditMode && saveStatus !== 'idle' && (
  <div className="absolute top-3 right-3 z-10">
    <SaveIndicator status={saveStatus} />
  </div>
)}
```

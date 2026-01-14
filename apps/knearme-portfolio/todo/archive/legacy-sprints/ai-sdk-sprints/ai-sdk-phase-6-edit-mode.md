# AI SDK Phase 6 — Unified Edit Mode

> Goal: Replace tab-based edit pages with chat-based editing.
> Source of truth: `docs/ai-sdk/implementation-roadmap.md`

## Chat Mode Support
- [x] Add `mode: 'create' | 'edit'` to `ChatWizard`
- [x] Implement edit-mode initialization (load project + artifacts)
- [x] Fresh-start session per edit visit

## Edit Mode API
- [x] Add `/api/chat/edit` route with edit tools
- [x] Implement `updateField`, `regenerateSection`, `reorderImages`, `validateForPublish`

## Editable Artifacts
- [x] ProjectDataCard inline edits (save/cancel)
- [x] ImageGallery drag/drop + hero selection
- [x] ContentEditor inline editing (already implemented)

## Routing
- [x] Add AI Assistant button to `/projects/[id]/edit` (ChatWizard in sheet)

## Deliverables
- [x] Full edit workflow via chat (core infrastructure complete)
- [x] Reorder + regenerate flows working (tools + UI in place)

## References
- `docs/ai-sdk/implementation-roadmap.md`
- `docs/ai-sdk/chat-artifacts-spec.md`

---

## Handoff from Phase 5

### What Was Built in Phase 5 (Polish)

**New Components:**
| Component | Purpose | Location |
|-----------|---------|----------|
| `ProgressTracker` | In-chat progress artifact with animated ring | `src/components/chat/artifacts/ProgressTracker.tsx` |
| `MilestoneToast` | Celebratory toast for progress milestones | `src/components/chat/MilestoneToast.tsx` |
| `SmartSuggestionPill` | Contextual suggestion hints above input | `src/components/chat/SmartSuggestionPill.tsx` |
| `useKeyboardNavigation` | Keyboard shortcuts and focus management | `src/components/chat/hooks/useKeyboardNavigation.ts` |

**Accessibility:**
- ARIA live regions in ChatMessages
- 44px touch targets on all buttons
- `prefers-reduced-motion` support

---

## Phase 6 Implementation Details

### What Was Built

**ChatWizard Edit Mode:**
| Change | File | Description |
|--------|------|-------------|
| `mode` prop | `ChatWizard.tsx` | `'create' | 'edit'` mode selection |
| Edit initialization | `ChatWizard.tsx` | Loads project + images on mount |
| Fresh sessions | `ChatWizard.tsx` | Creates new session per edit visit |
| Edit opening message | `chat-prompts.ts` | `getEditOpeningMessage()` function |
| Edit system prompt | `chat-prompts.ts` | `EDIT_MODE_SYSTEM_PROMPT` constant |

**Edit Mode API Route:**
| Route | File | Tools |
|-------|------|-------|
| `POST /api/chat/edit` | `src/app/api/chat/edit/route.ts` | `updateField`, `regenerateSection`, `reorderImages`, `validateForPublish`, `showContentEditor`, `promptForImages`, `showPortfolioPreview` |

**Artifact Action Handlers (ChatWizard):**
- `updateField` — Updates single project field via PATCH
- `reorderImages` — Reorders images via PATCH to images API
- `validateForPublish` — Checks publish readiness locally

**Editable Artifacts:**
| Artifact | Edit Features | Action Types |
|----------|---------------|--------------|
| `ProjectDataCard` | Inline editing with save/cancel, editable chips for materials/techniques | `updateProjectData` |
| `ImageGalleryArtifact` | @dnd-kit drag-drop reordering, hero badge on first image | `reorder`, `remove`, `categorize`, `add` |
| `ContentEditor` | Already had full inline editing capability | `updateContent` |

**Edit Page Integration:**
- AI Assistant button in `/projects/[id]/edit` header
- Opens ChatWizard in a Sheet (side drawer)
- Refreshes form data when assistant makes changes

### Key Files to Reference

```
src/components/chat/
├── ChatWizard.tsx              # Added mode prop, edit initialization
├── artifacts/
│   ├── ArtifactRenderer.tsx    # Handles all artifact types
│   ├── ProjectDataCard.tsx     # Inline editing with save/cancel
│   ├── ImageGalleryArtifact.tsx # @dnd-kit drag-drop, hero badge
│   └── ContentEditor.tsx       # Inline editing (already had this)
└── hooks/
    └── index.ts                # Barrel exports

src/app/api/chat/
├── route.ts                    # Create mode chat API
└── edit/
    └── route.ts                # Edit mode chat API (NEW)

src/lib/chat/
└── chat-prompts.ts             # Added edit mode prompts

src/app/(dashboard)/projects/[id]/edit/
└── page.tsx                    # Added AI Assistant button + Sheet
```

### Patterns to Follow

1. **Adding new edit tools:**
   - Add tool schema in `/api/chat/edit/route.ts`
   - Add handler in `ChatWizard.handleArtifactAction`
   - Tool returns action type, ChatWizard executes API call

2. **Edit mode detection:**
   ```typescript
   const isEditMode = mode === 'edit';
   // Use isEditMode to branch behavior
   ```

3. **Fresh session per edit visit:**
   - Edit mode POSTs to `/api/chat/sessions` with `mode: 'edit'`
   - Create mode uses get-or-create via `/api/chat/sessions/by-project/[id]`

4. **Refreshing form after AI edits:**
   - ChatWizard's `onComplete` callback refetches project data
   - Parent form resets with updated values

### Ready for Phase 7

Phase 7 (Persistence & Memory) can now:
- Build on session creation patterns established here
- Store edit history for undo/redo
- Add conversation memory across sessions
- Implement draft autosave

---

## Code Review Findings (Dec 26, 2025 — Updated)

### Resolved Since Initial Review
- ✅ **`mode` stored in sessions** (`/api/chat/sessions` accepts + inserts `mode`)
- ✅ **`chat_sessions.mode` migration exists** (`supabase/migrations/021_add_chat_session_mode.sql`)
- ✅ **Edit page refresh race fixed** (blocking refresh + overlay in edit page)
- ✅ **Error handling with retry** (persistent errors + retry button in ChatWizard)
- ✅ **Publish validation aligned with server** (dry_run param added to `/api/projects/[id]/publish`)
- ✅ **Tool action feedback** (success messages after successful actions)

### Critical Issues (Fix Before Production)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **Edit-mode tool outputs are never dispatched** | `src/app/api/chat/edit/route.ts`, `src/components/chat/ChatWizard.tsx`, `src/components/chat/artifacts/ArtifactRenderer.tsx` | AI "updates" are no-ops; user sees confirmations with no real changes |
| 2 | **Image reorder action type mismatch** | `ImageGalleryArtifact.tsx` → `ChatWizard.tsx` | Drag-drop reorder emits `reorder`, but handler expects `reorderImages` |
| 3 | **ProjectDataCard save is dropped** | `ProjectDataCard.tsx` → `ChatWizard.tsx` | Inline edits never persist (no handler for `updateProjectData`) |
| 4 | **Edit-mode image state can desync** | `ChatWizard.tsx` → `useInlineImages.ts` | Images loaded after mount don’t sync into the hook; categorize/remove can operate on stale state |

### Important Issues ✅ ALL FIXED

| # | Issue | Fix | Status |
|---|-------|-----|--------|
| 5 | **Client publish validation drifts from server rules** | Added `?dry_run=true` param to `/api/projects/[id]/publish` | ✅ Fixed |
| 6 | **Edit tool success is speculative** | Kept deferred pattern, added success messages for user feedback | ✅ Fixed |

---

## Fix Spec — Client-Side Tool Dispatch (Recommended)

**Rationale:** The app is already set up for client-side execution: edit tools return action payloads, and `ChatWizard` performs the real mutations via existing REST endpoints. This keeps auth and UI state in one place and matches create-mode patterns. The missing piece is dispatching tool outputs into `handleArtifactAction`.

### 1) Dispatch tool outputs to actions
Add a small dispatcher in `ChatWizard` that watches assistant tool parts and routes them to `handleArtifactAction`, with dedupe by `toolCallId`.

**Pseudo-code:**
```ts
const handledToolCalls = useRef(new Set<string>());

useEffect(() => {
  const last = messages[messages.length - 1];
  if (!last?.parts) return;

  for (const part of last.parts) {
    if (!part.type.startsWith('tool-')) continue;
    if (part.state !== 'output-available' || part.output == null) continue;
    if (handledToolCalls.current.has(part.toolCallId)) continue;

    const toolName = extractToolName(part.type);
    switch (toolName) {
      case 'updateField':
        handleArtifactAction({ type: 'updateField', payload: part.output });
        break;
      case 'reorderImages':
        handleArtifactAction({ type: 'reorderImages', payload: part.output });
        break;
      case 'regenerateSection':
        handleArtifactAction({ type: 'regenerate', payload: part.output });
        break;
      case 'validateForPublish':
        handleArtifactAction({ type: 'validateForPublish', payload: part.output });
        break;
    }

    handledToolCalls.current.add(part.toolCallId);
  }
}, [messages, handleArtifactAction]);
```

Notes:
- This keeps tool execution client-side and lets us show exact success/failure.
- For better AI feedback, optionally append a follow-up assistant message when the mutation succeeds (not required for Phase 6).

### 2) Normalize action types between artifacts and ChatWizard
Pick one canonical action name and use it everywhere.

**Option A (minimal change):**
- Update `ImageGalleryArtifact` to emit `reorderImages` instead of `reorder`.
- Add `updateProjectData` handler in `ChatWizard`.

**Option B (looser compatibility):**
- Support both `reorder` and `reorderImages` in `ChatWizard`.
- Support `updateProjectData` or map it to `updateField`/batch PATCH.

### 3) Fix ProjectDataCard save behavior
Decide on what ProjectDataCard represents in edit mode:

**Recommended UX:**
- In **edit mode**, save real project fields where a direct mapping exists:
  - `project_type` → `/api/projects/[id]`
  - `materials` → `/api/projects/[id]`
  - `techniques` → `/api/projects/[id]`
- For “interview-only” fields (`duration`, `proud_of`, `customer_problem`, etc.), either:
  - Hide them in edit mode, or
  - Save them into `extracted_data` (session memory) as “AI notes”, clearly labeled.

This aligns with user expectations: edits in the card should persist in the real project.

### 4) Sync edit-mode images into `useInlineImages`
The hook seeds state once. Add a sync effect for `initialImages` so that edit-mode loads hydrate it.

**Example:**
```ts
useEffect(() => {
  setUploadedImages(initialImages);
}, [initialImages]);
```

### 5) Align publish validation with server rules
Replace local-only checks with a server validation call.

**Preferred:** add `?dry_run=true` to `/api/projects/[id]/publish` (no state change), return `missing` list.

---

## Implementation Status (Dec 26, 2025)
- ✅ Client-side tool dispatch wired in `ChatWizard`
- ✅ Action normalization for image reorder (`reorderImages`) + backward compatibility
- ✅ `updateProjectData` handler persists project_type/materials/techniques
- ✅ Inline image sync when edit-mode images load asynchronously

---

## Alternative: Server-Side Tool Execution (Not Recommended for Phase 6)
Pros:
- The AI can return authoritative success/failure from the tool.
Cons:
- Requires auth-safe server mutations, error handling, and UI refreshes after each tool call.
- Duplicates logic already implemented in `ChatWizard` and `/api/projects/*`.

Given current architecture, **client-side dispatch is the lowest-risk fix**.

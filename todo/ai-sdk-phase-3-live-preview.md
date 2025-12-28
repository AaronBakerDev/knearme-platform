# AI SDK Phase 3 — Live Preview

> Goal: Show the portfolio coming together in real time.
> Source of truth: `docs/ai-sdk/implementation-roadmap.md`

---

## Handoff from Phase 2

### What Was Built

**New Hooks (available in `src/components/chat/hooks/`):**
| Hook | Purpose | Key Exports |
|------|---------|-------------|
| `useDropZone` | Drag-and-drop state management | `isDragging`, `handlers` |
| `useInlineImages` | Upload lifecycle + optimistic UI | `uploadedImages`, `pendingUploads`, `addImages`, `categorizeImage`, `removeImage` |

**New Artifact:**
- `ImageGalleryArtifact` — Responsive grid with category badges, remove actions, quick-select popover
- Registered in `ArtifactRenderer` for `promptForImages` tool

**New Tool:**
- `promptForImages` in `/api/chat/route.ts` — Triggers inline image upload UI

**ChatWizard Integration:**
- `useInlineImages` hook wired up with `projectId` and `onImagesChange` callback
- `onImageDrop` passed to `ChatInput` for drag-drop support
- `onArtifactAction` handler routes artifact actions to appropriate handlers
- Image error display added

**System Prompt:**
- Added "Photo Collection Phase" instructions in `chat-prompts.ts`
- AI knows when to call `promptForImages` after gathering project context

### Key Files to Reference

```
src/components/chat/
├── hooks/
│   ├── index.ts              # Barrel export
│   ├── useDropZone.ts        # Drag-drop state
│   └── useInlineImages.ts    # Upload management
├── artifacts/
│   ├── ImageGalleryArtifact.tsx  # Image grid artifact
│   └── ArtifactRenderer.tsx      # Dispatch map (promptForImages registered)
├── ChatInput.tsx             # Has onImageDrop prop + drop zone UI
├── ChatWizard.tsx            # Wired with useInlineImages
└── ChatMessages.tsx          # Passes onArtifactAction to artifacts

src/app/api/chat/route.ts     # promptForImages tool defined
src/lib/chat/chat-prompts.ts  # Photo Collection Phase instructions
```

### Patterns to Follow

1. **Adding new tools:** Define in `/api/chat/route.ts`, create artifact component, register in `ArtifactRenderer`
2. **Tool-to-artifact flow:** Tool returns data → streamed as tool part → `ArtifactRenderer` dispatches to component
3. **State sync:** Use callbacks like `onImagesChange` to sync hook state with parent
4. **Artifact actions:** Emit via `onAction({ type, payload })`, handle in `ChatWizard.handleArtifactAction`

### Ready for Phase 3

The image upload flow is complete. Phase 3 can now:
- Read `images` from ChatWizard state for preview rendering
- Use `extractedData` for project details (title, materials, techniques)
- Add `showPortfolioPreview` tool following the same pattern as `promptForImages`
- Build `useProjectData` to aggregate extracted data + images into preview-ready format

---

## Live Portfolio Canvas
- [x] Build `LivePortfolioCanvas` with empty/partial/ready states
- [x] Add completeness indicator + messaging
- [x] Hook to `useProjectData` aggregation

## Layout
- [x] Desktop split-pane layout in `ChatWizard`
- [x] Tablet preview pill
- [x] Mobile swipe-to-preview overlay + fallback button

## Data + Tools
- [x] Implement `useProjectData` hook
- [x] Implement `useCompleteness` hook
- [x] Add `showPortfolioPreview` tool

## Deliverables
- [x] Real-time preview updates as data is extracted
- [x] Desktop split view working without regressions
- [x] Mobile preview discoverable and accessible (manual DevTools testing recommended)

## References
- `docs/ai-sdk/implementation-roadmap.md`
- `docs/ai-sdk/chat-ux-patterns.md`

---

## Code Review Report (2025-12-26)

### Findings
- **HIGH:** `showPortfolioPreview` tool calls are dropped because there is no artifact registered for the tool type. Messages with only tool parts will render nothing, so the user sees no feedback.  
  **Files:** `src/app/api/chat/route.ts:158`, `src/components/chat/artifacts/ArtifactRenderer.tsx:59`, `src/components/chat/ChatMessages.tsx:82`, `src/components/chat/ChatMessages.tsx:132`
- **MEDIUM:** Tool output schema for `showPortfolioPreview` does not match `PortfolioPreviewData`. The tool returns `{ title, message, highlightFields }` while the type expects `completeness` and image/project fields. Any future artifact will be missing required data or using undefineds.  
  **Files:** `src/app/api/chat/route.ts:168`, `src/types/artifacts.ts:85`
- **MEDIUM:** Hero image selection favors unknown `image_type` values because `indexOf` returns `-1`, which sorts ahead of valid categories. An invalid/legacy type can become the primary hero image.  
  **Files:** `src/components/chat/hooks/useProjectData.ts:120`

### Missing Tests
- No unit tests around `calculateCompleteness` / `useCompleteness` and `selectHeroImages` edge cases.  
  **Files:** `src/components/chat/hooks/useCompleteness.ts`, `src/components/chat/hooks/useProjectData.ts`
- No integration test to verify `showPortfolioPreview` tool parts render or trigger UI updates.

### Open Questions
- Is `showPortfolioPreview` intended to render an artifact, or should it trigger a UI side‑effect (e.g., open overlay / highlight fields)? If silent, should it be removed to avoid empty assistant messages?
- Should the preview tool schema be expanded to match `PortfolioPreviewData`, or should the type be changed to reflect the tool output?

---

## Remediation (2025-12-26)

All findings from the Code Review Report have been addressed:

### HIGH: showPortfolioPreview tool calls dropped
**Status:** ✅ Fixed

**Decision:** Implemented as side-effect tool (not a visual artifact).

The `LivePortfolioCanvas` already shows the preview. Adding a duplicate artifact in chat would be redundant. Instead, the tool now:
1. Triggers `onAction({ type: 'showPreview', payload })` via `ArtifactRenderer`
2. Opens the mobile preview overlay via `setShowPreviewOverlay(true)` in `ChatWizard`
3. On desktop, the preview is already visible in the split pane

**Files changed:**
- `src/components/chat/artifacts/ArtifactRenderer.tsx` — Added `SIDE_EFFECT_TOOLS` set and `useEffect` to fire action
- `src/components/chat/ChatWizard.tsx` — Added `showPreview` case in `handleArtifactAction`

### MEDIUM: Tool output schema mismatch
**Status:** ✅ Fixed

Updated `PortfolioPreviewData` type to match actual tool output:
```typescript
interface PortfolioPreviewData {
  title?: string;
  message?: string;
  highlightFields?: string[];
}
```

**Files changed:**
- `src/types/artifacts.ts` — Simplified `PortfolioPreviewData` to match tool schema

### MEDIUM: Hero image selection bug
**Status:** ✅ Fixed

The bug: `indexOf` returns `-1` for unknown `image_type`, which sorts before `0` (after), `1` (detail), etc.

**Fix:** Map unknown types to `priorityOrder.length` so they sort last:
```typescript
const aScore = aIndex === -1 ? priorityOrder.length : aIndex;
const bScore = bIndex === -1 ? priorityOrder.length : bIndex;
return aScore - bScore;
```

**Files changed:**
- `src/components/chat/hooks/useProjectData.ts` — Fixed `selectHeroImages` sorting

### Missing Tests
**Status:** Deferred to Phase 5 (Polish)

Unit tests for `selectHeroImages` and `calculateCompleteness` will be added during the Polish phase.

# AI SDK Phase 4 — Content Editor

> Goal: Enable inline editing of AI-generated content.
> Source of truth: `docs/ai-sdk/implementation-roadmap.md`

## Editor Artifact
- [x] Build `ContentEditor` artifact (title, description, SEO)
- [x] Reuse TipTap editor with simplified toolbar
- [x] Add character counts and validation

## Tooling
- [x] Add `showContentEditor` tool in chat route
- [x] Add regenerate buttons for specific sections

## Save/Accept Flow
- [x] Implement Accept/Reject actions
- [x] PATCH to `/api/projects/[id]` on accept
- [x] Show confirmation + update chat state

## Fast Path (MVP speed goal)
- [x] Add one-tap "Accept & Publish" option
- [x] Default to minimal edits when user skips editing

## Deliverables
- [x] Inline edits save correctly
- [x] Section regeneration works and updates artifacts
- [x] Fast path supports <3 min publish

## References
- `docs/ai-sdk/implementation-roadmap.md`
- `docs/ai-sdk/chat-artifacts-spec.md`
- `docs/01-vision/vision.md`

---

## Handoff from Phase 4

### What Was Built

**ContentEditor Enhancements:**
- Added "Accept & Publish" button for one-tap publish flow
- Renamed "Accept" to "Save Draft" for clarity
- Both actions share the same validation (title min 5 chars, description min 50 chars)

**ChatWizard Handler:**
- Added `acceptAndPublish` action handler that:
  1. PATCHes content to `/api/projects/{id}`
  2. POSTs to `/api/projects/{id}/publish`
  3. Shows success message on completion

**Verification:**
- Inline edits correctly save (local state → onAction → API)
- Regeneration correctly updates artifacts (updateContentEditorOutput → message parts → re-render)
- Fast path achieves <3 min publish with one-tap flow

### Key Files to Reference

```
src/components/chat/
├── artifacts/
│   └── ContentEditor.tsx       # Accept & Publish button, handleAcceptAndPublish
└── ChatWizard.tsx              # acceptAndPublish handler (line ~542)

src/app/api/projects/
├── [id]/route.ts               # PATCH for content save
└── [id]/publish/route.ts       # POST for publish
```

### Patterns to Follow

1. **Adding new artifact actions:** Define handler in ContentEditor, add case in `handleArtifactAction`
2. **Chained API calls:** Save first, then perform secondary action (like publish)
3. **Error handling:** Show specific error messages, fall back gracefully

### Ready for Phase 5

Phase 5 (Polish) can now:
- Build on the complete content editing flow
- Add progress tracking and visual polish
- Implement error retry mechanisms
- Add loading states and animations

---

## Code Review Fixes (2025-12-26)

### Security Fixes
- **XSS Sanitization:** Added DOMPurify (client) and sanitize-html (server) to sanitize description HTML
  - `src/components/chat/artifacts/ContentEditor.tsx` - sanitizes before sending
  - `src/app/api/projects/[id]/route.ts` - sanitizes via Zod transform

### Validation Fixes
- **Title validation consistency:** Now uses `trim().length` for both min and max checks
- **SEO minimum validation:** Added 30-char min for SEO title, 120-char min for description (when non-empty)
- **Character counters:** Updated to show trimmed length for consistency

### Error Handling Improvements
- **Regenerate timeout:** Added 30-second AbortController timeout
- **Specific error messages:** Timeout, network errors, and invalid responses now show distinct messages
- **Response validation:** Validates response structure before using

### Type Safety
- **Type guards:** Added `isContentEditorToolPart` type guard for safe artifact updates
- **Null checks:** Fixed TypeScript errors with proper null checks in `updateContentEditorOutput`

### UX Improvements
- **Fast-path visual cue:** "Looks good! Publish" button with pulsing ring when content is unedited
- **Edit tracking:** Tracks user edits to differentiate between "accept as-is" vs "reviewed and modified"

### Deferred Items
- **Race condition fix:** Would require passing `toolCallId` through the entire action chain (ContentEditor → ArtifactRenderer → ChatMessages → ChatWizard). Low priority since rapid double-clicks are unlikely in practice.

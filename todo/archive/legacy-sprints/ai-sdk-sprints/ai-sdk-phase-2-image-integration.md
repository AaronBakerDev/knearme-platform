# AI SDK Phase 2 — Image Integration

> Goal: Make images feel native in the chat experience.
> Source of truth: `docs/ai-sdk/implementation-roadmap.md`

## Inline Image Artifacts
- [x] Create `ImageGalleryArtifact` with responsive grid
- [x] Add category badges (before/after/progress/detail)
- [x] Add remove action per image

## Chat Input + Upload UX
- [x] Add drag-and-drop zone to chat input
- [x] Implement `useInlineImages` hook (optimistic UI + pending state)
- [x] Add quick category selector (popover/menu)

## Tooling
- [x] Add `promptForImages` tool in `src/app/api/chat/route.ts`
- [x] Ensure tool results render as artifacts

## Deliverables
- [x] Drag-drop upload works across desktop/mobile
- [x] Inline gallery artifact appears in chat
- [x] Categories applied via quick-select

## References
- `docs/ai-sdk/implementation-roadmap.md`
- `docs/ai-sdk/chat-ux-patterns.md`
- `docs/ai-sdk/chat-artifacts-spec.md`

## Code Review Report (2025-12-26)

### Findings
- ~~HIGH: `ChatPhotoSheet` uploads use `FormData` and set `image_type` to `process`, but the API expects JSON metadata and only allows `progress`; uploads from the sheet will fail validation.~~ **FIXED (2025-12-26)**: Now uses JSON + signed URL flow matching `useInlineImages`.
- ~~HIGH: `ChatPhotoSheet` deletes against `/api/projects/${projectId}/images/${imageId}`, but the only DELETE route is `/api/projects/[id]/images` with a JSON body; deletes from the sheet will 404/no-op and leave orphaned records.~~ **FIXED (2025-12-26)**: Now uses JSON body `{ image_id }`.
- ~~MEDIUM: `ImageGalleryArtifact` never receives actual image data because the renderer only passes tool output; the artifact defaults to `images = []`, so the inline gallery can't show/categorize uploaded images.~~ **FIXED (2025-12-26)**: Images now passed through `ChatWizard` → `ChatMessages` → `ArtifactRenderer` → `ImageGalleryArtifact`.
- ~~MEDIUM: Two upload flows are active (inline hook vs. photo sheet) with different contracts and no shared source of truth.~~ **FIXED (2025-12-26)**: Both now use same JSON + signed URL contract.

### Missing Tests
- No tests cover the `/api/projects/[id]/images` contract (JSON payload, allowed `image_type` values), so the `FormData`/`process` mismatch is uncaught.
- No UI test verifies that the inline artifact renders uploaded images and that category/remove actions succeed.

### Open Questions
- ~~Should `ChatPhotoSheet` be retired in favor of the inline artifact + `useInlineImages`, or should both converge on the signed-upload JSON flow?~~ **Resolved**: Both now use same signed-upload JSON flow.
- Should tool output be augmented with the current image list so the inline gallery can render real uploads?

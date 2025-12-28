# AI SDK Phase 1 — Foundation

> Goal: Establish artifact rendering + core AI SDK alignment without breaking existing flows.
> Source of truth: `docs/ai-sdk/implementation-roadmap.md`

## Preflight (SDK + provider alignment)
- [x] Verify AI SDK 6 APIs used in code (tool part states, transport, message format)
- [x] Confirm Google provider model IDs; update `src/lib/ai/providers.ts` and docs if mismatched
- [x] Decide on RSC usage; if used, add `@ai-sdk/rsc` dependency and update imports
- [x] Define transcription constraints (max size, accepted types) and enforce on client/server
- [x] Add tool part state handling in UI (`input-streaming`, `input-available`, `output-available`, `output-error`)

## Artifact System (Roadmap Phase 1)
- [x] Create artifact directory structure (`src/components/chat/artifacts/*`)
- [x] Implement `ArtifactRenderer` dispatcher
- [x] Create `ArtifactSkeleton` loading states
- [x] Add initial artifact: `ProjectDataCard`
- [x] Update `ChatMessage`/`ChatMessages` to render tool parts via artifacts
- [x] Add `types/artifacts.ts` definitions

## Voice-First MVP Alignment (from product goals)
- [x] Define voice interview UX states (idle, recording, processing, error, retry)
- [x] Add mic permissions + error messaging
- [x] Wire transcription to chat input with graceful fallback to text

## Deliverables
- [x] Tool parts render as inline artifacts (no regression)
- [x] Skeletons show during tool execution
- [x] Voice interview flow accessible on mobile

## References
- `docs/ai-sdk/implementation-roadmap.md`
- `docs/ai-sdk/chat-ux-patterns.md`
- `docs/ai-sdk/vercel-ai-sdk-reference.md`
- `docs/01-vision/vision.md`

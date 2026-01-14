# Project Chat Unification Proposal

> Status: Implemented (Phase 1)  
> Date: December 28, 2025  
> Owners: Product + Eng

Update (Dec 28, 2025):
- `ChatWizard` now powers both create and edit modes.
- The side panel is standardized via `CanvasPanel` + `PreviewOverlay` with optional `formContent`.
- `ChatWizardEdit` and `ChatFirstEditLayout` are no longer used in the app.
- Quick action chips restored across create/edit (heuristic suggestions).
- Quick action chips now accept agent-driven suggestions via `suggestQuickActions`.
- Milestone chat notifications wired into `ChatWizard` (first photo, type, materials, ready, generated, published).
- `/api/chat` now uses a unified system prompt and exposes edit tools (updateField, reorderImages, regenerateSection, validateForPublish).
- Edit sessions now persist extracted_data to `chat_sessions` (same as create).

Progress log (Dec 28, 2025):
- Added milestone toast notifications to the unified chat UI.
- Publish flow now triggers the "published" milestone toast.
- Browser check: `/projects/new` loads; milestone toasts require user actions (photo/chat) to appear.
- Unified chat route handles create + edit; edit mode no longer depends on `/api/chat/edit`.
- `/api/chat/edit` now forwards to `/api/chat` (legacy compatibility).
- Browser check: `/projects/new` still loads after unified chat prompt/tool changes.
- Edit action tools now behave as side-effects (no debug tool-call blocks in chat).
- Browser check: `/projects/new` loads after legacy edit route forwarding.
- Edit sessions now persist extracted_data to chat_sessions.
- Added agent-driven quick action chips via `suggestQuickActions` tool (merged with heuristics).
- Reintroduced orchestrator/story-extractor modules and wired into chat tools.
- Browser check: `/projects/new` loads after quick-action + agent cleanup changes.
- `checkPublishReady` now receives `city`, `state`, and `projectTypeSlug` from shared state for accurate readiness checks.

Decisions (Dec 28, 2025):
- **Single session per project** (no mode separation). All agents share state.
- **Auto-summarize by context length** across all sessions; affects context injection only (no UI change).
- **Quick action chips** appear across create/edit and should be agent‑driven over time.

## Summary

We previously maintained two separate chat experiences for project creation and editing. The unification consolidates them into a single chat workspace and cleans up duplicated or unused code paths.

The result is one consistent UI, one persistence model, and one tool-call history story for both create and edit flows.

## Goals

- One shared chat workspace for create and edit modes.
- One session lifecycle and message persistence pipeline.
- Tool-call history and tool-only messages load consistently in both modes.
- Consistent layout, loader, error UI, and quick actions.
- Single session per project (no mode separation).

## Non-goals

- Changing the underlying LLM provider or model selection.
- Redesigning the entire portfolio canvas UI.
- Rewriting the agent system from scratch.

## Current State Deep Dive

### Create flow (chat-first)

- Entry: `src/app/(dashboard)/projects/new/page.tsx`
- Layout: `src/app/(dashboard)/projects/new/layout.tsx`
- Main component: `src/components/chat/ChatWizard.tsx`

Key behaviors:
- Eager project creation on first message (`ensureProject`).
- Phased wizard: conversation -> images -> generate -> review -> publish.
- Generate action uses the unified chat tools and stays in the same workspace (no redirect on generate).
- Uses `useSaveQueue` and `useAutoSummarize` for persistence and memory.
- Loads history via `/api/chat/sessions/[id]/context?projectId=...&mode=ui` (includes tool parts, capped for UI).
- Renders `LivePortfolioCanvas` directly and a mobile overlay.

### Edit flow (chat-first edit)

- Entry: `src/app/(dashboard)/projects/[id]/edit/page.tsx`
- Layout: `ChatWizard` + `CanvasPanel` (form optional)
- Main component: `src/components/chat/ChatWizard.tsx` (mode="edit")

Key behaviors:
- Uses `/api/chat/sessions/by-project/:id` to find the shared session.
- Loads messages via `/api/chat/sessions/[id]/context?projectId=...&mode=ui` (tool parts included, capped for UI).
- Unified message persistence via `/api/chat/sessions/:id/messages`.
- Optional form integration via `formContent`.
- Auto-summarize runs when the context length exceeds the budget (no UI impact).

### Agents and prompts

- Prompts: `src/lib/chat/chat-prompts.ts` (create + edit).
- Multi-agent system: `src/lib/agents/*` (story extractor, content generator, quality checker, orchestrator).
- Story extractor + orchestrator are wired into tool execution; the runtime remains tool‑driven.
- Chat routes orchestrate generation and publish readiness via the Orchestrator.

### Tool-call persistence and history

- Message parts are stored in `chat_messages.metadata.parts` via
  `POST /api/chat/sessions/[id]/messages`.
- Context loader (`src/lib/chat/context-loader.ts`) reconstructs parts.
- Create + edit modes use context loader.
- `GET /api/chat/sessions/[id]` does not include message parts in a form the UI can render.
- `/api/chat/sessions/by-project/:id` is metadata-only by default; use `/context` for messages (or `includeMessages=true` if needed for admin tools).

### UI parity notes

- Create + edit now share the same chat interface and artifact rendering.
- Side panel is standardized via `CanvasPanel` + `PreviewOverlay`.

## Remaining Gaps

✅ **All items resolved (Dec 28, 2025)**

1. **Session persistence for extracted data**  
   Edit flow now persists extracted_data updates to the session via `useSaveQueue`.

2. **Multi-agent system integration**  
   Orchestrator + Story Extractor are wired into tool execution; the runtime remains tool‑driven
   while enforcing shared readiness rules and state alignment.

3. **Quick action intelligence**  
   Agent‑driven quick actions are now supported via `suggestQuickActions` tool (merged with heuristics).

## Implemented Approach

### 1) Unified chat workspace

`ChatWizard` renders the same core chat UI for all entry points. Mode still
influences prompts/tools **but not session scope**:

- Conversation starts in `conversation` for new projects and `review` for
  existing projects.
- The unified tool set guides start‑to‑publish in a single session.

### 2) Shared session + persistence (implemented inline)

Session bootstrap and persistence live in `ChatWizard` (no separate
`useProjectChatSession` hook):

- Fetch session via `/api/chat/sessions/by-project/:id`
- Load messages via `/api/chat/sessions/[id]/context?projectId=...&mode=ui`
- Use a stable `useChat` id (one per mount).
- Rehydrate `message.parts` from `metadata.parts` for tool history.
- Use `/api/chat/sessions/:id/messages` for all messages; use `useSaveQueue`
  for `extracted_data` updates.
- Enable `useAutoSummarize` based on context length (no UI change).

### 3) Consistent layout and canvas behavior

`CanvasPanel` and `PreviewOverlay` are used inside `ChatWizard` as the shared
layout for both create and edit. In create mode, the "Form" tab is hidden
when no `formContent` is provided.

### 4) Shared artifact handling

Tool and artifact handlers are shared with mode-specific capabilities:

- Create mode: accept, accept-and-publish, generate, validate.
- Edit mode: updateField, updateDescriptionBlocks, reorderImages, regenerate.

### 5) Tooling convergence

The unified tool set in `/api/chat` guides the project from start to publish
in one continuous session, regardless of entry point.

Auto-summarize and memory updates run for both create and edit sessions.

## Cleanup Status

### Removed or consolidated

- `src/components/chat/ChatWizardEdit.tsx` (removed after unification).
- `src/components/chat/ChatPhotoPanel.tsx` (removed; superseded by ChatPhotoSheet).
- Duplicate `dbMessageToUIMessage` helpers (removed from ChatWizard).

### Retained

- `ChatWizard` edit mode branch (single component with mode-specific behavior).
- Resume behavior is handled by the shared context loader and summaries.

### Agents and prompts

Decision: Orchestrator + story-extractor are wired into the tool‑driven flow.

## Implementation Plan (Phased)

1. **Session unification (low risk)**
   - Implemented inline in `ChatWizard` (no separate `useProjectChatSession` hook required).
   - Update edit flow to use `/context` and load parts.
   - Ensure tool-only messages round-trip.

2. **UI consolidation**
   - Implemented via `ChatWizard` + `CanvasPanel` + `PreviewOverlay` (no separate `ProjectChatWorkspace`).
   - Align loaders, error toasts, and quick actions.

3. **Cleanup and docs**
   - Remove dead components and unused logic.
   - Update docs in `docs/09-agent` and any user-journey docs.

Status (Dec 28, 2025):
- Session unification complete (single session, shared context loader).
- UI consolidation complete (ChatWizard + CanvasPanel + PreviewOverlay).
- Cleanup complete (legacy edit route forwarded; agent modules wired and documented).

## Risks and Mitigations

- **Regression in message history**: Add a migration strategy to handle older
  messages without parts (fallback to text-only).
- **useChat resets**: Keep a stable chat id to prevent message loss on re-render.
- **Large refactor**: Phase the changes and test create/edit flows after each step.

## Decisions (Resolved)

- Single session per project (no mode separation).
- Auto-summarize on context length across all sessions.
- Quick action chips appear across create/edit and should become agent‑driven.

## Success Criteria

Status: Met (Dec 28, 2025).

- Create and edit flows use the same workspace component.
- Reloading edit mode shows tool artifacts and tool-only messages.
- Both modes persist message parts and restore them via context loader.
- UI, loaders, and error handling feel identical across modes.

## References

- https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message
- https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
- https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-with-tool-calling
- https://vercel.com/blog/ai-sdk-5

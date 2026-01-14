# Phase 15 — Agent-First Alignment Cleanup

> **Priority:** Low
> **Status:** Deferred

## Goal
Remove dead or legacy code paths that no longer align with the agent-first onboarding and conversation flow, while preserving any still-used flows until explicitly confirmed for removal.

## Scope
### In-scope (confirmed dead)
- Remove unused conversation/form state transfer helpers.
- Remove unused interview UI components.

### In-scope (likely legacy; confirm first)
- Retire interview session pipeline (Q&A-based flow) if no longer used.
- Remove unused chat session list/create endpoints if no external clients rely on them.

### Out-of-scope
- Any customer-facing behavior changes not explicitly reviewed/approved.
- DB schema changes outside the onboarding/conversation domain.

## Proposed Work Items
1) Dead code removal (confirmed)
- Delete `src/lib/chat/state-transfer.ts` (no references found).
- Delete `src/components/interview/InterviewFlow.tsx` and `src/components/interview/VoiceRecorder.tsx` (no imports found).

2) Legacy interview pipeline (confirm before removal)
- Potentially remove or refactor:
  - `/api/ai/analyze-images`
  - `/api/ai/generate-content` actions: `questions`, `responses`, `content`
  - `interview_sessions` persistence in `/api/ai/transcribe`
  - `src/lib/ai/content-generation.ts` interview helpers
  - `src/lib/ai/schemas.ts` interview schemas
  - `src/lib/ai/prompts.ts` interview prompts
- If kept, document as “legacy support” with explicit ownership.

3) Unused chat session endpoints (confirm before removal)
- `/api/chat/sessions` list/create endpoints appear unused by UI.
- `/api/chat/sessions/[id]` GET appears unused by UI.

4) Documentation updates
- Add a short note in `docs/09-agent/` describing the removal/deprecation decision.
- Update any “interview” references if those flows are removed.

## Caveats / Confirm With User
- Confirm whether the interview Q&A flow is officially deprecated or still needed for any internal or future UX.
- Confirm if any external clients rely on `/api/chat/sessions` list/create or `/api/chat/sessions/[id]` GET.
- Confirm whether `interview_sessions` table should be retained (for analytics or legacy data) even if endpoints are removed.

## Acceptance Criteria
- No unused files remain in the codebase for confirmed-dead items.
- All removed endpoints and helpers have no remaining imports or route references.
- Build and lint pass (`npm run build`, `npm run lint`).
- If legacy interview pipeline is removed, no UI paths or tests reference it.

## Risks
- Removing endpoints that are still used by internal tools or hidden routes.
- Removing interview pipeline while some projects still depend on stored `interview_sessions` data.

## QA Plan
- Run unit tests (`npm run test:unit`).
- Smoke-test onboarding conversation and project creation flows.
- Verify no runtime 404s on API routes after removal.

# Agents Multi-Agent System Review (2025-12-27)

## Scope
- Multi-agent architecture and agent tooling (story extraction, content generation, quality checks)
- Chat UX (create + edit flows), prompts, tool artifacts, loaders
- Contractor dashboard and portfolio management flows

## Environment & Method
- Local app served at `http://localhost:3000` (existing Next dev server)
- Test contractor created via `/signup`, profile completed via `/profile/setup`
- Manual UI walkthrough + targeted code review
- Screenshots captured (if needed) in `/Users/aaronbaker/.codex/skills/dev-browser/tmp/`

## Key Findings (Prioritized)

### 1) **CRITICAL** — Project creation fails in chat create flow (blocks onboarding)
- **Where:** `src/app/(contractor)/projects/new/page.tsx`, `src/components/chat/ChatWizard.tsx`, `src/app/api/projects/route.ts`
- **What happens:** Sending the first message on `/projects/new` triggers `POST /api/projects` and returns `500 INTERNAL_ERROR`. UI falls back to the error screen with the message `"[object Object]"` and a “Back to Projects” button.
- **Impact:** Contractors cannot create projects through the chat-based wizard; all create-mode flows are blocked.
- **Repro:**
  1. Log in as a contractor and open `/projects/new`.
  2. Send a first message in chat.
  3. Observe error screen; no project created.
- **Notes:** The client error message is unhelpful because the API error body is an object that is coerced into `[object Object]`.

### 2) **CRITICAL** — Hero image detection is broken in agent tool state loader
- **Where:** `src/app/api/chat/route.ts` (`loadProjectState`), `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/010_case_study_fields.sql`
- **What happens:** `loadProjectState` looks for `project_images.is_hero`, but the `project_images` table does **not** have `is_hero`. Hero image is stored in `projects.hero_image_id`.
- **Impact:** `heroImageId` becomes `undefined`, causing `readyForContent` to be false and `checkPublishReady` to always claim missing hero image even when one is set.
- **Fix direction:** Derive hero from `projects.hero_image_id` (and/or add `is_hero` column + keep it in sync).

### 3) **HIGH** — Multi-agent orchestrator is defined but not wired into chat runtime
- **Where:** `src/lib/agents/orchestrator.ts`, `src/lib/agents/index.ts`, `src/app/api/chat/route.ts`
- **What happens:** The architecture doc and exports define an Account Manager orchestrator, but the chat route never calls `orchestrate`. Instead it uses direct tool calling. There’s a TODO-style comment “wire into chat route.”
- **Impact:** The “multi-agent system” described in docs isn’t actually running in production paths.

### 4) **HIGH** — Review phase logic is empty in orchestrator
- **Where:** `src/lib/agents/orchestrator.ts` (`handleReviewPhase`)
- **What happens:** `handleReviewPhase` returns `{ state, actions: [] }` without any behavior.
- **Impact:** Even if the orchestrator is wired in later, review changes and approvals won’t be processed.

### 5) **MEDIUM** — Edit chat sessions reset on refresh, making “resume” logic ineffective
- **Where:** `src/app/(contractor)/projects/[id]/edit/page.tsx`, `src/components/chat/ChatWizardEdit.tsx`
- **What happens:** Edit page always creates a new session on mount. After reload, prior messages are gone (only the welcome message appears).
- **Impact:** Users cannot resume edit chats; `session-resume` logic never has prior messages to load.

### 6) **MEDIUM** — Tool-only chat artifacts can be lost on reload
- **Where:** `src/components/chat/ChatWizard.tsx`, `src/components/chat/ChatWizardEdit.tsx`
- **What happens:** Messages are only saved if `textContent` exists. Tool-only messages (e.g., `promptForImages`, `showContentEditor`) are skipped, so tool artifacts won’t persist.
- **Impact:** On reload, inline artifacts (image prompts, content editors, progress cards) can disappear.

### 7) **MEDIUM** — “Archived” status is exposed in UI but cannot be set
- **Where:** `src/app/(contractor)/projects/page.tsx`, `src/app/api/projects/[id]/publish/route.ts`
- **What happens:** The Projects list includes an “Archived” tab, but there is no archive action in the UI or API (only publish/unpublish).
- **Impact:** Incomplete workflow vs. requirements (archive/restore not implemented).

### 8) **MEDIUM** — Project card requirements not fully met (missing date)
- **Where:** `src/app/(contractor)/projects/page.tsx`
- **What happens:** Project cards omit the date even though the requirements specify “thumbnail, title, status, date.”
- **Impact:** Requirement gap and less context for users scanning projects.

### 9) **MEDIUM** — Dashboard quick action copy doesn’t reflect profile completeness
- **Where:** `src/app/(contractor)/dashboard/page.tsx`
- **What happens:** The quick action card always says “Complete Your Profile” even when the profile is already complete.
- **Impact:** Confusing CTA and wasted space; should adapt to “Edit Profile” or hide.

### 10) **MEDIUM** — Dashboard loader layout mismatches live layout
- **Where:** `src/app/(contractor)/dashboard/loading.tsx`
- **What happens:** Loader shows three stat cards, but the dashboard uses a single compact stats strip. This causes visible layout shift after load.
- **Impact:** UX polish issue; avoidable CLS.

### 11) **LOW** — Icon-only buttons lack accessible labels
- **Where:** `src/app/(contractor)/projects/page.tsx` (project card menu button), plus various icon-only buttons in chat
- **What happens:** Some icon-only buttons render without `aria-label`, so screen readers will announce them as “button” with no purpose.
- **Impact:** Accessibility regression (WCAG 4.1.2 / 2.4.6).

### 12) **LOW / FUTURE RISK** — Story extractor readiness doesn’t require location
- **Where:** `src/lib/agents/story-extractor.ts` (`checkReadyForImages`)
- **What happens:** `checkReadyForImages` ignores city/state requirements, while the chat prompt requires location.
- **Impact:** If orchestrator is wired in, it could prompt for images before location is captured.

### 13) **LOW / FUTURE RISK** — Create mode may reset chat on projectId change
- **Where:** `src/components/chat/ChatWizard.tsx`
- **What happens:** `useChat` uses id `chat-${projectId || 'new'}`, which changes after project creation. That can reset chat state and lose early messages.
- **Impact:** Potential data loss in first-message flow (not fully testable due to create failure).

## Loader & UX Notes
- **Dashboard loader mismatch** is the largest loader issue. Others generally match the underlying forms.
- **Chat edit flow** works for updating description/materials once a project exists, but lacks session persistence across refreshes.

## Incomplete Items (from code + requirements)
- Orchestrator not connected to chat route (multi-agent incomplete).
- Review phase unimplemented in orchestrator.
- Archive/restore workflow missing (UI tab exists, no action).
- Project list card missing date requirement.
- Analytics feedback TODO in `ChatWizardEdit` (commented TODO at ~line 512).

## Documentation Updates Needed (Refactor Alignment)
- **Multi-agent reality vs. docs:** Orchestrator exists but is not wired; chat uses tool-calling with Account Manager persona + server-side agents for generation/quality. Docs should state this current behavior and avoid implying orchestration is active in runtime.
- **Full chat history + tool calls:** Runtime persists `parts` (tool calls + tool results) in `chat_messages.metadata.parts` and uses context loader + summaries. Docs should explicitly describe this and note the current limitation where tool-only messages aren’t persisted (no text content).
- **Edit session behavior:** Doc expectations should match the current “fresh session each edit visit” behavior, or the code should be changed to reuse sessions if the intention is to resume.

## Dead Code / Legacy Artifacts
- `src/lib/ai/openai.ts.bak` — legacy OpenAI helper (unused).
- `src/app/(contractor)/projects/new/page.wizard.tsx.bak` — old create wizard.
- `src/app/sitemap.ts.backup` — old sitemap backup.

These appear to be leftovers from refactors and can be removed or archived outside `src/` if no longer needed.

## Agent Quality Evaluation (Observed)
- **Strengths:** Edit-mode agent responds quickly, accepts requests, and updates preview content (materials + description) on confirmation.
- **Weaknesses / Risks:** The generated copy introduced new details not in the user’s request (e.g., “historic aesthetic”), which can feel like hallucination. This undermines trust and violates “only use stated facts” expectations.
- **Tone consistency:** Some responses appear lower-cased or unpolished (“what would you like to change - title, description, photos, or seo?”), which can read as sloppy rather than casual.
- **Clarification behavior:** Clarification tool exists but wasn’t triggered in observed edit flow. When facts are missing, the agent should ask clarifying questions rather than inventing context.

## Supporting Artifacts
Screenshots saved (optional for reference):
- `/Users/aaronbaker/.codex/skills/dev-browser/tmp/dashboard.png`
- `/Users/aaronbaker/.codex/skills/dev-browser/tmp/chat-after-message.png`
- `/Users/aaronbaker/.codex/skills/dev-browser/tmp/edit-chat-after-confirm.png`
- `/Users/aaronbaker/.codex/skills/dev-browser/tmp/edit-tab.png`
- `/Users/aaronbaker/.codex/skills/dev-browser/tmp/edit-images-tab.png`
- `/Users/aaronbaker/.codex/skills/dev-browser/tmp/edit-seo-tab.png`
- `/Users/aaronbaker/.codex/skills/dev-browser/tmp/profile-edit.png`
- `/Users/aaronbaker/.codex/skills/dev-browser/tmp/settings.png`

## Suggested Next Steps
1. Fix `/api/projects` 500 and improve client error messaging.
2. Correct hero image resolution in `loadProjectState`.
3. Decide whether edit sessions should persist; align implementation with resume logic.
4. Wire orchestrator into chat route or update docs to match reality.
5. Close requirement gaps (archive action, project date, adaptive profile CTA, loader parity).

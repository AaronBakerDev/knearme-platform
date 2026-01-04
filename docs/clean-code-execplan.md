# Clean Code Remediation Plan for knearme-portfolio

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan must be maintained in accordance with `PLANS.md` at the repository root.

## Purpose / Big Picture

The goal is to reduce maintenance risk and speed up iteration by shrinking the remaining large, high-complexity files, removing or documenting lint and TypeScript suppressions, and eliminating high-risk duplication. After completing this plan, the app should behave exactly the same for contractors and admins, but the codebase should be easier to reason about, faster to change, and safer to refactor. Success is visible by clean lint/build runs, updated clean-code tracking docs, and key pages (chat, auth, public services) rendering correctly in local dev.

## Progress

- [x] (2026-01-04 20:15Z) Created initial ExecPlan and recorded baseline discrepancies.
- [ ] (2026-01-04 20:15Z) Rebaseline file sizes, suppressions, TODOs, and console logs, then update `docs/clean-code-findings.md` and `docs/clean-code-progress.md` with current metrics and exceptions.
- [ ] Reduce remaining large-file monoliths and finalize Wave 6 extractions.
- [ ] Simplify public pages and auth forms to remove major duplication (Wave 7).
- [ ] Remove or document remaining lint/TS suppressions, explicit `any`, TODOs, and production console logs.
- [ ] Lower branch density and deep nesting in the highest-risk functions and add tests for new helpers.

## Surprises & Discoveries

- Observation: `src/lib/constants/service-content.ts` is already split and only 78 lines, so the Wave 6 target in `docs/clean-code-progress.md` is stale.
  Evidence: `wc -l src/lib/constants/service-content.ts` reports 78.
- Observation: `src/components/chat/hooks/live-voice-state.ts` already contains a reducer-based state machine, so the "extract state machine" task for `useLiveVoiceSession.ts` is partially complete.
  Evidence: `useLiveVoiceSession.ts` imports `liveVoiceConnectionReducer` and `initialLiveVoiceConnectionState`.

## Decision Log

- Decision: Store this ExecPlan in `docs/clean-code-execplan.md` within `knearme-portfolio` so it lives next to the clean-code findings and progress docs.
  Rationale: Keeps all clean-code tracking artifacts co-located for easy navigation.
  Date/Author: 2026-01-04 / Codex
- Decision: Rebaseline the clean-code metrics before additional refactors, since at least one listed large file has already been resolved.
  Rationale: Avoids working from stale data and prevents wasted refactors.
  Date/Author: 2026-01-04 / Codex
- Decision: Treat consolidated schema and type files as eligible exceptions if they are large but low complexity, while documenting them explicitly in the findings.
  Rationale: These files are intentionally centralized to reduce duplication and provide type safety, and splitting them can reduce clarity.
  Date/Author: 2026-01-04 / Codex

## Outcomes & Retrospective

Pending. Update after each major milestone with what changed, what remains, and lessons learned.

## Context and Orientation

This plan applies to the `knearme-portfolio` Next.js app located at `/Users/aaronbaker/knearme-workspace/knearme-portfolio`. Clean-code tracking lives in `docs/clean-code-findings.md` (heuristic scan results) and `docs/clean-code-progress.md` (wave-based refactor progress). The scan flags large files, heavy lint or TypeScript suppressions, repeated TODOs, and complexity heuristics like deep nesting and branch density.

Definitions used in this plan:
- Large file means 700+ lines of TypeScript or TSX unless explicitly documented as a data or schema consolidation.
- Lint or TypeScript suppression refers to `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` comments that bypass tooling checks.
- Duplication refers to repeated blocks of code across files (often in forms or page templates) that can be replaced by shared components or helpers.
- Deep nesting is high brace depth in a function, which makes the logic harder to follow and test.
- Branch density is a high number of conditional or logical branches per 100 lines, usually indicating logic that should be split into smaller pure helpers.

Key files and modules called out by the findings:
- Chat UX and tooling: `src/components/chat/ChatWizard.tsx`, `src/components/chat/hooks/useLiveVoiceSession.ts`, `src/lib/chat/tools-runtime.ts`, `src/lib/chat/tool-schemas.ts`, `src/lib/mcp/tools.ts`.
- Agents and orchestration: `src/lib/agents/story-extractor.ts`, `src/lib/agents/discovery.ts`, `src/lib/agents/orchestrator.ts`.
- Public page routes: `src/app/(public)/services/[type]/page.tsx`, `src/app/(public)/[city]/masonry/[type]/[slug]/page.tsx`, `src/app/(public)/[city]/masonry/[type]/page.tsx`.
- Auth flows: `src/app/(auth)/signup/page.tsx`, `src/app/(auth)/login/page.tsx`.
- API routes with suppressions: `src/app/api/onboarding/route.ts`, `src/app/api/chat/route.ts`, and the remaining API routes listed in the findings doc.

## Plan of Work

### Milestone 1: Rebaseline and reconcile the clean-code docs

Start by re-scanning the repository for file sizes, suppressions, TODOs, console logs, and explicit `any` usage. Update `docs/clean-code-findings.md` to reflect the current state and include an "Exceptions" subsection that lists intentional large files (for example, `src/lib/supabase/typed-queries.ts`, `src/lib/chat/tool-schemas.ts`, and `src/types/database.ts`) with a short justification. Update `docs/clean-code-progress.md` to correct stale wave targets (notably `service-content.ts`) and to list the actual remaining large files with current line counts. This milestone is complete when the findings and progress docs match the repository and the exceptions list is explicit.

### Milestone 2: Finish Wave 6 large-file extractions and shrink remaining monoliths

Focus on the largest remaining files that are tied to runtime behavior, not data or schemas. The goal is to move domain-specific logic into smaller modules with clear, named exports while keeping behavior identical.

In `src/components/chat/hooks/useLiveVoiceSession.ts`, extract cohesive responsibilities into helper modules under `src/components/chat/hooks/voice/` (for example, audio playback queue handling, transcript buffering, and session lifecycle). Keep `useLiveVoiceSession` as the orchestrator and ensure the reducer in `live-voice-state.ts` stays the source of truth for connection state. Add targeted unit tests for any pure helper functions added in this extraction.

In `src/components/portfolio/DynamicPortfolioRenderer.tsx`, split the block renderers into individual files under a new `src/components/portfolio/blocks/` directory and keep `DynamicPortfolioRenderer` as a small router that maps block types to the extracted renderers. Preserve the existing visual output and class mappings from `tokensToClasses`.

In the agent layer, split `src/lib/agents/story-extractor.ts`, `src/lib/agents/discovery.ts`, and `src/lib/agents/orchestrator.ts` into domain-focused modules (for example, prompt construction, parsing, and decision logic). Each extracted module should export clearly named pure functions so the core agent files become readable orchestration shells. When you extract pure logic, add or extend tests under `src/lib/agents/__tests__/`.

For `src/lib/mcp/tools.ts`, separate tool metadata and tool handler implementations. The file should expose a small `toolDefinitions` array and handler registry while pushing tool-specific logic into `src/lib/mcp/tools/` submodules. Any unavoidable type mismatches (such as `zod-to-json-schema` typing) should be isolated in a single helper and documented in the exceptions list if they still require a suppression.

Reduce `src/components/chat/ChatWizard.tsx` further by extracting UI sections or logic that still sits inline after Waves 1-3. The goal is to move it closer to 1,400 lines while keeping the same props and behavior.

### Milestone 3: Simplify public pages and auth forms (Wave 7)

Refactor the public page routes to remove duplicated template logic. Extract shared layout, metadata construction, and structured data generation into components and helpers in `src/components/seo/` and `src/lib/seo/` so `src/app/(public)/services/[type]/page.tsx` and the city masonry pages become mostly data assembly and component wiring. Ensure the `generateMetadata` functions remain accurate and the JSON-LD output matches the existing schema generators.

Reduce duplication across the auth forms by extracting shared field groups and layout into `src/components/auth/` (for example, a shared `AuthFormCard`, `AuthEmailField`, and `AuthPasswordFields` component). Keep all messaging consistent with the existing copy guidelines and keep Supabase auth calls in the page components.

Complete the remaining ToolWidgetBase adoption in the deferred widgets (`ServiceAreaWidget`, `PublishReadinessWidget`, `DuplicationCheckWidget`) to reduce repeated markup and styling logic.

### Milestone 4: Remove suppressions, explicit any, TODOs, and production console logs

Work through the remaining suppressions listed in `docs/clean-code-findings.md`. Replace explicit `any` types with proper inferred or declared types, preferably by using the typed Supabase query helpers in `src/lib/supabase/typed-queries.ts` and existing type definitions in `src/types/`. If a suppression is still required due to third-party type mismatches, isolate it in a wrapper function and document it in the exceptions list.

Resolve TODOs by either completing the migration they describe or converting them into tracked tasks in the progress doc with a clear owner and rationale. For production console logs, remove them or guard them behind `process.env.NODE_ENV !== 'production'` checks, or replace them with structured logging where an existing logger makes sense.

### Milestone 5: Reduce complexity hot spots and add tests

Address the highest branch density and deep nesting files by extracting pure helper functions and adding focused tests. Prioritize the files listed in the findings for branch density (for example, `src/lib/projects/compose-description.ts`, `src/lib/chat/state-transfer.ts`, `src/components/chat/VoiceLiveControls.tsx`, and high-branch `src/lib/tools/*.ts` utilities). The goal is to make each high-branch function small enough to test in isolation and to keep the main orchestration functions readable.

Where extraction introduces new helpers, add tests near the module (for example, `src/lib/tools/__tests__/` or `src/lib/chat/__tests__/`) so behavior is locked down. Update the progress doc to reflect these test additions and the reduced complexity metrics.

## Concrete Steps

Run these commands from `/Users/aaronbaker/knearme-workspace/knearme-portfolio` and capture results in the findings/progress docs as you go:

    rg --files -g "*.ts" -g "*.tsx" | xargs wc -l | sort -nr | head -n 40
    rg -n "eslint-disable|@ts-ignore|@ts-expect-error|@ts-nocheck" src
    rg -n "TODO|FIXME" src
    rg -n "console\\.(log|warn|error)" src
    rg -n "\\bany\\b" src

Update findings/progress docs after each milestone so the plan stays accurate.

## Validation and Acceptance

For each milestone, run `npm run lint` and `npm run build` in `/Users/aaronbaker/knearme-workspace/knearme-portfolio` and resolve any regressions introduced by refactors. For behavioral validation, run the dev server and verify the following flows still work:
- Chat wizard renders, can send a message, and can open voice mode.
- Auth pages still sign up and log in with Supabase (smoke test only).
- Public service pages render and include structured data scripts in the HTML.

Final acceptance for the full plan is:
- `docs/clean-code-findings.md` and `docs/clean-code-progress.md` reflect the current codebase.
- ChatWizard reduced toward ~1,400 lines or an explicit exception recorded.
- Remaining large files are either refactored below 700 lines or documented as intentional consolidations.
- All lint/TS suppressions and explicit `any` types are removed or explicitly documented exceptions.
- No production console logs remain without dev guards.
- Lint and build pass with no new errors.

## Idempotence and Recovery

All refactors are additive and can be retried safely. If a refactor breaks behavior, revert only the files touched in that refactor and re-run lint/build to confirm recovery. Update the progress doc to note any rollback and why it happened so the next pass avoids the same issue.

## Artifacts and Notes

Capture short evidence snippets in the docs after each milestone, such as:

    wc -l src/components/chat/ChatWizard.tsx
    wc -l src/components/chat/hooks/useLiveVoiceSession.ts
    rg -n "eslint-disable" src/app/api

Keep these snippets concise and limited to what demonstrates progress.

## Interfaces and Dependencies

Do not add new external dependencies. Use existing utilities and types:
- Use `@/lib/voice` helpers (audio, telemetry, usage tracking) rather than re-implementing voice logic.
- Use `@/lib/supabase/typed-queries.ts` for typed data access in API routes.
- Use the UI barrel export from `@/components/ui` for shared UI pieces.

When extracting helpers, standardize exports to named functions in new modules, and ensure they are imported only from `src/components/chat/hooks/voice/`, `src/components/portfolio/blocks/`, or `src/lib/agents/*` as appropriate. Any new helper should have a clearly named function signature that makes it obvious what it returns, for example:

    export function buildStoryExtractionPrompt(input: StoryInput): string
    export function parseStoryExtractionResponse(raw: string): StoryExtraction
    export function enqueueAudioChunk(base64: string, mimeType?: string): void

These signatures should be adjusted to match the existing types in the codebase.

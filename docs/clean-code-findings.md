# Clean Code Findings (Heuristic Scan)

Date: 2026-01-03
Last targeted update: 2026-01-04 (contractor profile refactor + service-type page extraction)
Scope: `src/**/*.{ts,tsx,js,jsx}`

This is a heuristic scan for likely clean-code risks. Items below are based on:
- Large files (likely violating Single Responsibility / readability)
- Lint/TypeScript suppressions (`eslint-disable`, `@ts-ignore`, etc.)
- TODO/FIXME markers
- Approximate nesting depth, branch density, and duplication (see notes)

If you want stricter criteria (e.g., max lines per file or max suppressions), tell me and I will re-run with those thresholds.

## Refactor Status (2026-01-04)
Status: Active - 600-699 bucket shrinking.

- Core monolith remains: `src/components/chat/ChatWizard.tsx` is still 2800+ lines with deep state/prop drilling.
- Large-file hotspots are still concentrated in chat, agents, and public page routes (see size outliers).
- Suppressions remain heavy in API routes and chat context tools, increasing hidden defect risk.
- Duplication hotspots persist in auth forms and service/masonry page templates.
- Large content-only files (for example `src/lib/constants/service-content.ts`) are low-risk and can be deprioritized.
- Contractor profile page refactor: UI sections extracted to `src/components/portfolio/ContractorProfileSections.tsx`; page now ~341 lines.
- City service-type page: service descriptions moved to `src/lib/seo/service-type-descriptions.ts`; page now ~585 lines.
- Learning Center article page: removed hooks suppression by switching to `getMDXComponents`.
- Learning Center article page: extracted layout sections to `src/components/content/ArticleSections.tsx` (page now ~382 lines).
- Structured data: `schemaToString` now escapes HTML-sensitive characters to prevent JSON-LD script injection.
- Semantic blocks split into schema + utilities (`semantic-blocks.schema.ts`, `semantic-blocks.utils.ts`) to keep the public barrel small.
- Test cleanup: `src/lib/api/auth.test.ts` now uses shared Supabase mocks; `src/lib/data/services.test.ts` now uses shared query-chain helpers.
- Publish checklist tests: consolidated renders and word fixtures (`src/components/publish/PublishChecklist.test.tsx`).
- Structured data split into modules under `src/lib/seo/structured-data/` to keep the barrel small and avoid 600+ line files.

Note: Lists below reflect the 2026-01-03 heuristic scan unless explicitly updated above.

## Manual Investigation Findings (2026-01-03)

### Validated Risks
- **Monolithic Component**: `src/components/chat/ChatWizard.tsx` (2800+ lines). Violates SRP, has complex state, inline business logic, and extensive prop drilling to `ChatSurface`, `ChatInput`, etc.
- **Duplication**: `src/app/(auth)/signup/page.tsx` contains significant form field boilerplate (Input/Label/Error patterns).

### Explicit `any` Usage
- `src/app/api/businesses/me/route.ts` (supabase client)
- `src/lib/chat/context-loader.ts` (supabase client)
- `src/lib/data/projects.ts` (supabase client)
- `src/lib/agents/subagents/spawn.ts` (return type casting)

### Console Logs (Production Risks)
- `src/app/(public)/[city]/masonry/[type]/page.tsx` (and similar dynamic routes): debug/skipping logic.
- `src/app/api/projects/route.ts`: auth success logging.
- `src/app/api/projects/[id]/publish/route.ts`: warning logging.

### Low Risk / Data Files
- `src/lib/constants/service-content.ts`: Large file (1300+ lines) but contains content definitions, not code complexity.

## High-risk size outliers (700+ lines)
- `src/components/chat/ChatWizard.tsx` (2878) - **CONFIRMED MONOLITH**
- `src/lib/mcp/tools.ts` (1006)
- `src/components/chat/hooks/useLiveVoiceSession.ts` (947)
- `src/components/portfolio/DynamicPortfolioRenderer.tsx` (928)
- `src/lib/agents/story-extractor.ts` (888)
- `src/lib/chat/tools-runtime.ts` (871)
- `src/app/(public)/services/[type]/page.tsx` (788)
- `src/app/(public)/[city]/masonry/[type]/[slug]/page.tsx` (788)
- `src/lib/chat/tool-schemas.ts` (751)
- `src/types/database.ts` (724)
- `src/lib/agents/orchestrator.ts` (711)
- `src/app/api/chat/route.ts` (704)

## Large files (600-699 lines)
- `src/app/(public)/contractors/[city]/[slug]/page.tsx` (668)
- `src/app/(public)/[city]/masonry/[type]/page.tsx` (665)
- `src/lib/agents/discovery.ts` (656)
- `src/lib/api/auth.test.ts` (652)
- `src/lib/data/services.test.ts` (623)
- `src/app/api/onboarding/route.ts` (616)
- `src/app/(public)/learn/[slug]/page.tsx` (612)
- `src/components/publish/PublishChecklist.test.tsx` (611)
- `src/lib/design/semantic-blocks.ts` (608)
- `src/lib/seo/structured-data.ts` (605)

## Large files (500-599 lines)
- `src/lib/tools/business-discovery/client.ts` (588)
- `src/components/upload/ImageUploader.test.tsx` (581)
- `src/components/chat/artifacts/ProjectEditFormArtifact.tsx` (578)
- `src/components/chat/hooks/useInlineImages.ts` (569)
- `src/lib/testing/supabase-mock.ts` (553)
- `src/hooks/useVoiceRecording.ts` (550)
- `src/components/chat/ChatInput.tsx` (548)
- `src/lib/agents/subagents/spawn.ts` (537)
- `src/app/api/ai/generate-content/route.ts` (523)
- `src/lib/agents/__tests__/quality-checker.test.ts` (511)
- `src/components/chat/artifacts/ImageGalleryArtifact.tsx` (505)
- `src/lib/agents/ui-composer.ts` (504)

## Large files (400-499 lines)
- `src/lib/design/tokens.ts` (478)
- `src/lib/data/demo-projects.ts` (478)
- `src/app/api/projects/[id]/images/route.ts` (476)
- `src/lib/api/auth.ts` (471)
- `src/lib/voice/voice-telemetry.ts` (465)
- `src/lib/observability/agent-logger.ts` (463)
- `src/components/chat/LivePortfolioCanvas.tsx` (461)
- `src/app/(public)/[city]/masonry/page.tsx` (458)
- `src/lib/chat/chat-prompts.ts` (454)
- `src/lib/content/mdx.ts` (453)
- `src/components/chat/ChatMessages.tsx` (453)
- `src/lib/chat/context-loader.ts` (450)
- `src/lib/observability/tracing.ts` (442)
- `src/components/edit/BlockEditor.tsx` (439)
- `src/app/(dashboard)/profile/edit/page.tsx` (438)
- `src/lib/chat/state-transfer.ts` (437)
- `src/app/(dashboard)/projects/page.tsx` (434)
- `src/components/upload/ImageUploader.tsx` (431)
- `src/components/marketing/SiteHeaderClient.tsx` (426)
- `src/app/(public)/services/page.tsx` (422)
- `src/components/chat/artifacts/ContentEditor.tsx` (419)
- `src/components/edit/SortableImageGrid.test.tsx` (414)
- `src/components/interview/VoiceRecorder.tsx` (413)
- `src/lib/agents/content-generator.ts` (411)
- `src/lib/data/services.ts` (408)
- `src/app/(auth)/login/page.tsx` (403)
- `src/app/(dashboard)/projects/[id]/page.tsx` (400)

## Lint/TypeScript suppressions (>= 3 occurrences)
These are likely masking typing or rule violations and can hide bugs.

- `src/app/api/onboarding/route.ts` (13)
- `src/app/api/projects/[id]/images/route.ts` (12)
- `src/app/api/ai/generate-content/route.ts` (11)
- `src/lib/chat/context-loader.ts` (6)
- `src/app/api/businesses/me/route.ts` (6)
- `src/lib/chat/tools-runtime.ts` (5)
- `src/lib/chat/memory.ts` (5)
- `src/app/api/projects/[id]/route.ts` (5)
- `src/app/api/projects/[id]/publish/route.ts` (5)
- `src/app/api/ai/analyze-images/route.ts` (5)
- `src/lib/voice/usage-tracking.ts` (4)
- `src/lib/data/services.ts` (4)
- `src/lib/api/auth.ts` (4)
- `src/app/api/projects/[id]/images/from-url/route.ts` (4)
- `src/app/api/chat/sessions/[id]/route.ts` (4)
- `src/app/api/chat/sessions/[id]/messages/route.ts` (4)
- `src/app/api/businesses/[slug]/route.ts` (4)
- `src/lib/oauth/auth-code-store.ts` (3)
- `src/lib/content/mdx.ts` (3)
- `src/lib/chat/prompt-context.ts` (3)
- `src/lib/chat/context-compactor.ts` (3)
- `src/app/sitemap-main.xml/route.ts` (3)
- `src/app/api/projects/[id]/images/validate/route.ts` (3)
- `src/app/api/chat/sessions/by-project/[projectId]/route.ts` (3)
- `src/app/api/ai/transcribe/route.ts` (3)
- `src/app/api/ai/summarize-conversation/route.ts` (3)

## TODOs (cleanup indicators)
Note: TODOs 1-2 were resolved on 2026-01-04; remaining TODOs are tracking legitimate ongoing work.

- `src/lib/chat/tool-executors.ts` (line 223) - // TODO: Phase 10 migration - currently calls both Design Agent and legacy composer.
  - Status: Keep - Design Agent produces different block format than legacy composer; migration requires UI updates
- `src/lib/chat/tool-executors.ts` (line 323) - // TODO: Remove this once all callers use Quality Agent format
  - Status: Keep - Quality Agent schema differs from CheckPublishReadyOutput; consumers depend on legacy format
- `src/lib/mcp/tools.ts` (line 544) - // TODO: Replace hardcoded '/masonry/' with dynamic trade segment when routes are restructured
  - Status: Keep - Requires trade_slug column in projects schema and route restructuring

## Deep nesting (top 15 by max brace depth)
- `src/lib/tools/business-discovery/client.ts` (depth 9)
- `src/components/chat/ChatWizard.tsx` (depth 9)
- `src/components/chat/ChatMessages.tsx` (depth 9)
- `src/lib/chat/tools-runtime.ts` (depth 8)
- `src/lib/api/auth.test.ts` (depth 8)
- `src/components/edit/BlockEditor.tsx` (depth 8)
- `src/components/chat/hooks/useLiveVoiceSession.ts` (depth 8)
- `src/lib/mcp/tools.ts` (depth 7)
- `src/lib/agents/discovery.ts` (depth 7)
- `src/hooks/useVoiceRecording.ts` (depth 7)
- `src/components/portfolio/DescriptionBlocksClient.tsx` (depth 7)
- `src/components/portfolio/DescriptionBlocks.tsx` (depth 7)
- `src/components/interview/InterviewFlow.tsx` (depth 7)
- `src/app/api/onboarding/route.ts` (depth 7)
- `src/app/(dashboard)/profile/edit/page.tsx` (depth 7)

## Branch density (top 15 by branch points per 100 lines)
- `src/lib/projects/compose-description.ts` (21.9 per 100 lines, 7 points over 32 lines)
- `src/lib/chat/state-transfer.ts` (18.1 per 100 lines, 79 points over 437 lines)
- `src/components/chat/VoiceLiveControls.tsx` (17.5 per 100 lines, 64 points over 366 lines)
- `src/lib/content/description-blocks.client.ts` (16.8 per 100 lines, 21 points over 125 lines)
- `src/lib/tools/repoint-vs-replace.ts` (16.8 per 100 lines, 28 points over 167 lines)
- `src/lib/agents/quality-checker.ts` (16.2 per 100 lines, 41 points over 253 lines)
- `src/lib/tools/outdoor-drainage.ts` (16.1 per 100 lines, 14 points over 87 lines)
- `src/lib/images/mergeImagesById.ts` (16.0 per 100 lines, 4 points over 25 lines)
- `src/lib/tools/waterproofing-risk.ts` (15.3 per 100 lines, 31 points over 202 lines)
- `src/lib/tools/basement-leak-triage.ts` (14.9 per 100 lines, 37 points over 249 lines)
- `src/lib/tools/business-discovery/client.ts` (14.8 per 100 lines, 87 points over 588 lines)
- `src/lib/chat/context-shared.ts` (14.5 per 100 lines, 38 points over 262 lines)
- `src/app/api/oauth/authorize/route.ts` (14.0 per 100 lines, 23 points over 164 lines)
- `src/lib/mcp/token-validator.ts` (14.0 per 100 lines, 19 points over 136 lines)
- `src/lib/tools/efflorescence.ts` (13.8 per 100 lines, 22 points over 159 lines)

## Duplication hotspots (top 15 by duplicated lines across files)
- `src/lib/constants/service-content.ts` (217 lines in repeated 6-line blocks)
- `src/app/(auth)/signup/page.tsx` (211 lines in repeated 6-line blocks)
- `src/app/(public)/services/[type]/page.tsx` (204 lines in repeated 6-line blocks)
- `src/app/(public)/[city]/masonry/[type]/page.tsx` (192 lines in repeated 6-line blocks)
- `src/app/(public)/[city]/masonry/page.tsx` (187 lines in repeated 6-line blocks)
- `src/components/tools/BasementLeakTriageWidget.tsx` (146 lines in repeated 6-line blocks)
- `src/app/(auth)/login/page.tsx` (145 lines in repeated 6-line blocks)
- `src/app/(public)/[city]/masonry/[type]/[slug]/page.tsx` (138 lines in repeated 6-line blocks)
- `src/components/tools/FoundationCrackCheckerWidget.tsx` (135 lines in repeated 6-line blocks)
- `src/components/tools/ChimneyWaterIntrusionRiskWidget.tsx` (134 lines in repeated 6-line blocks)
- `src/components/tools/EfflorescenceTreatmentWidget.tsx` (125 lines in repeated 6-line blocks)
- `src/components/tools/WaterproofingRiskChecklistWidget.tsx` (118 lines in repeated 6-line blocks)
- `src/components/edit/ChipEditor.tsx` (112 lines in repeated 6-line blocks)
- `src/components/tools/ConcreteSlabSettlingDiagnosticWidget.tsx` (111 lines in repeated 6-line blocks)
- `src/components/edit/TagEditor.tsx` (111 lines in repeated 6-line blocks)

## Most repeated 6-line blocks (top 10)
- 222 occurrences across 25 files: `src/app/(public)/about/page.tsx`, `src/app/(public)/learn/page.tsx`, `src/app/(public)/services/page.tsx`, `src/app/api/ai/transcribe/route.ts`, `src/components/chat/ChatWizard.tsx`, `src/components/chat/EmptyProjectState.tsx` ...
- 53 occurrences across 1 files: `src/lib/constants/services.ts`
- 52 occurrences across 1 files: `src/lib/constants/service-content.ts`
- 43 occurrences across 6 files: `src/components/edit/ChipEditor.tsx`, `src/components/edit/TagEditor.tsx`, `src/components/marketing/Pricing.tsx`, `src/lib/constants/service-content.ts`, `src/lib/data/demo-projects.ts`, `src/lib/trades/config.ts`
- 40 occurrences across 1 files: `src/lib/constants/service-content.ts`
- 40 occurrences across 1 files: `src/lib/constants/service-content.ts`
- 39 occurrences across 1 files: `src/lib/constants/service-content.ts`
- 37 occurrences across 16 files: `src/components/ui/accordion.tsx`, `src/components/ui/alert-dialog.tsx`, `src/components/ui/alert.tsx`, `src/components/ui/avatar.tsx`, `src/components/ui/card.tsx`, `src/components/ui/checkbox.tsx` ...
- 34 occurrences across 7 files: `src/components/chat/hooks/useQuickActions.ts`, `src/lib/agents/circuit-breaker.ts`, `src/lib/api/errors.ts`, `src/lib/observability/agent-logger.ts`, `src/lib/tools/chimney-urgency.ts`, `src/types/artifacts.ts` ...
- 32 occurrences across 13 files: `src/components/ui/alert-dialog.tsx`, `src/components/ui/alert.tsx`, `src/components/ui/avatar.tsx`, `src/components/ui/card.tsx`, `src/components/ui/command.tsx`, `src/components/ui/dialog.tsx` ...

## Notes
- Nesting depth is based on brace depth after stripping comments/strings; it is a proxy, not a full AST parse.
- Branch density counts control-flow keywords and logical operators; it is a heuristic for complexity.
- Duplication is based on normalized 6-line windows; it may miss semantic duplicates or flag templated code.

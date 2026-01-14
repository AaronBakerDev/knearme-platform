# Clean Code Findings (Heuristic Scan)

Date: 2026-01-05
Last targeted update: 2026-01-05 04:43Z (ExecPlan complete)
Scope: `src/**/*.{ts,tsx}`

This is a heuristic scan for likely clean-code risks. Items below are based on:
- Large files (likely violating Single Responsibility / readability)
- Lint/TypeScript suppressions (`eslint-disable`, `@ts-ignore`, etc.)
- TODO/FIXME markers
- Console logs (production risk)
- Explicit `any` usage

If you want stricter criteria (e.g., max lines per file or max suppressions), tell me and I will re-run with those thresholds.

## Refactor Status (2026-01-05 04:43Z rebaseline)
Status: Complete - Milestone 5 done, ExecPlan complete.

- Largest monolith remains `src/components/chat/ChatWizard.tsx` (1,383 lines).
- 9 files are >=700 lines under `src` (see size outliers).
- Suppressions: 0 occurrences across 0 files.
- Explicit `any`: 32 occurrences across 32 files (text/copy mentions).
- TODO/FIXME markers: 0; console.* occurrences: 28 across 18 files (comment/doc examples + logging sink).
- City masonry hubs and auth pages now sit below 500 lines after shared helpers/components.
- State-transfer mapping logic now uses extracted helpers with tests to reduce branch density.

## Exceptions (intentional consolidations)
- `src/lib/supabase/typed-queries.ts` (1,091) — centralized typed Supabase query wrappers.
- `src/lib/chat/tool-schemas.ts` (873) — consolidated tool schema definitions.
- `src/types/database.ts` (724) — generated database types.
- `src/lib/constants/service-content/repair.ts` (638) — content-only catalog (low logic density).

## High-risk size outliers (700+ lines)
- `src/components/chat/ChatWizard.tsx` (1,383)
- `src/lib/supabase/typed-queries.ts` (1,091) — exception
- `src/lib/chat/tool-schemas.ts` (873) — exception
- `src/app/api/onboarding/route.ts` (794)
- `src/app/(portfolio)/[city]/masonry/[type]/[slug]/page.tsx` (786)
- `src/app/(marketing)/services/[type]/page.tsx` (769)
- `src/components/chat/hooks/useLiveVoiceSession.ts` (766)
- `src/types/database.ts` (724) — exception
- `src/app/api/chat/route.ts` (704)

## Large files (600-699 lines)
- `src/lib/constants/service-content/repair.ts` (638)
- `src/lib/chat/tool-executors.ts` (624)

## Large files (500-599 lines)
- `src/lib/tools/business-discovery/client.ts` (596)
- `src/components/upload/ImageUploader.test.tsx` (581)
- `src/components/chat/artifacts/ProjectEditFormArtifact.tsx` (570)
- `src/components/chat/hooks/useInlineImages.ts` (569)
- `src/lib/api/auth.test.ts` (563)
- `src/lib/testing/supabase-mock.ts` (557)
- `src/hooks/useVoiceRecording.ts` (550)
- `src/components/chat/ChatInput.tsx` (548)
- `src/lib/agents/subagents/spawn.ts` (533)
- `src/lib/chat/context-loader.ts` (521)
- `src/components/tools/ToolWidgetBase.tsx` (518)
- `src/lib/data/services.test.ts` (513)
- `src/lib/agents/__tests__/quality-checker.test.ts` (511)
- `src/components/chat/artifacts/ImageGalleryArtifact.tsx` (505)
- `src/lib/agents/ui-composer.ts` (504)
- `src/components/chat/ChatMessages.tsx` (503)

## Large files (400-499 lines)
- `src/app/(portfolio)/[city]/masonry/[type]/page.tsx` (488)
- `src/lib/design/tokens.ts` (478)
- `src/lib/data/demo-projects.ts` (478)
- `src/app/api/ai/generate-content/route.ts` (478)
- `src/components/edit/SortableImageGrid.test.tsx` (470)
- `src/lib/content/mdx.ts` (469)
- `src/lib/api/auth.ts` (468)
- `src/lib/voice/voice-telemetry.ts` (465)
- `src/lib/observability/agent-logger.ts` (463)
- `src/components/chat/LivePortfolioCanvas.tsx` (462)
- `src/lib/chat/chat-prompts.ts` (454)
- `src/components/onboarding/OnboardingChat.tsx` (453)
- `src/lib/observability/tracing.ts` (442)
- `src/app/(dashboard)/profile/edit/page.tsx` (440)
- `src/lib/chat/state-transfer.ts` (437)
- `src/components/edit/BlockEditor.tsx` (433)
- `src/components/upload/ImageUploader.tsx` (431)
- `src/components/chat/handlers/useContentActions.ts` (431)
- `src/components/publish/PublishChecklist.test.tsx` (426)
- `src/app/api/projects/[id]/images/route.ts` (426)
- `src/components/portfolio/ContractorProfileSections.tsx` (425)
- `src/lib/chat/memory.ts` (423)
- `src/components/marketing/SiteHeaderClient.tsx` (423)
- `src/app/(dashboard)/projects/page.tsx` (420)
- `src/components/chat/artifacts/ContentEditor.tsx` (417)
- `src/components/interview/VoiceRecorder.tsx` (413)
- `src/lib/constants/service-content/construction.ts` (411)
- `src/lib/agents/content-generator.ts` (411)
- `src/app/(marketing)/services/page.tsx` (409)
- `src/lib/data/services.ts` (405)

## Lint/TypeScript suppressions
Total: 0 occurrences across 0 files.

## Explicit `any` usage
Total: 32 occurrences across 32 files.

Files with >= 6 occurrences:
None. Remaining references are in copy/comments with a max count of 1 per file.

## TODOs (cleanup indicators)
None. Remaining follow-ups are tracked in `docs/clean-code-progress.md`.

## Console logs (production risks)
Total: 28 occurrences across 18 files.

Top files by count:
- `src/lib/observability/agent-logger.ts` (7)
- `src/app/api/tools/export-pdf/README.md` (2)
- `src/lib/agents/content-generator.ts` (2)
- `src/lib/agents/quality-checker.ts` (2)
- `src/lib/ai/transcription.ts` (2)
- `src/components/chat/hooks/useDropZone.ts` (1)
- `src/components/chat/hooks/useKeyboardNavigation.ts` (1)
- `src/components/portfolio/DynamicPortfolioRenderer.tsx` (1)
- `src/components/tools/ToolPDF/EmailCaptureDialog.tsx` (1)
- `src/components/tools/ToolPDF/INTEGRATION_EXAMPLE.md` (1)

Exception note: remaining console references are comment/doc examples plus the logging sink in `src/lib/observability/agent-logger.ts`.

## Legacy heuristic scans (2026-01-03 snapshot)
The sections below (deep nesting, branch density, duplication) were not rebaselined in Milestone 1.

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
- `src/app/(marketing)/services/[type]/page.tsx` (204 lines in repeated 6-line blocks)
- `src/app/(portfolio)/[city]/masonry/[type]/page.tsx` (192 lines in repeated 6-line blocks)
- `src/app/(portfolio)/[city]/masonry/page.tsx` (187 lines in repeated 6-line blocks)
- `src/components/tools/BasementLeakTriageWidget.tsx` (146 lines in repeated 6-line blocks)
- `src/app/(auth)/login/page.tsx` (145 lines in repeated 6-line blocks)
- `src/app/(portfolio)/[city]/masonry/[type]/[slug]/page.tsx` (138 lines in repeated 6-line blocks)
- `src/components/tools/FoundationCrackCheckerWidget.tsx` (135 lines in repeated 6-line blocks)
- `src/components/tools/ChimneyWaterIntrusionRiskWidget.tsx` (134 lines in repeated 6-line blocks)
- `src/components/tools/EfflorescenceTreatmentWidget.tsx` (125 lines in repeated 6-line blocks)
- `src/components/tools/WaterproofingRiskChecklistWidget.tsx` (118 lines in repeated 6-line blocks)
- `src/components/edit/ChipEditor.tsx` (112 lines in repeated 6-line blocks)
- `src/components/tools/ConcreteSlabSettlingDiagnosticWidget.tsx` (111 lines in repeated 6-line blocks)
- `src/components/edit/TagEditor.tsx` (111 lines in repeated 6-line blocks)

## Most repeated 6-line blocks (top 10)
- 222 occurrences across 25 files: `src/app/(marketing)/about/page.tsx`, `src/app/(marketing)/learn/page.tsx`, `src/app/(marketing)/services/page.tsx`, `src/app/api/ai/transcribe/route.ts`, `src/components/chat/ChatWizard.tsx`, `src/components/chat/EmptyProjectState.tsx` ...
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

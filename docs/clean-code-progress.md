# Clean Code Simplification Progress

**Started:** 2026-01-03
**Last Updated:** 2026-01-04
**Status:** Waves 1-6 Complete, Wave 7 In Progress

---

## Executive Summary

The clean code simplification project has completed Waves 1-3, achieving significant reduction in the ChatWizard monolith and establishing proper separation of concerns. The ChatWizard has been reduced from 2,878 lines to 1,638 lines (43% reduction). All high-suppression API routes have been refactored to use typed query wrappers, eliminating 36 lint suppressions. Seven action handler hooks have been extracted, and tool executors have been separated from tools-runtime.

---

## Wave-by-Wave Progress

| Wave | Status | Key Changes |
|------|--------|-------------|
| Wave 1 | Complete | `wizard-utils.ts` (213 lines), `tool-schemas.ts` (873 lines), `typed-queries.ts` (1,129 lines) |
| Wave 2 | Complete | 7 action handler hooks extracted (1,247 lines total) |
| Wave 3 | Complete | State hooks created (`useUIState`, `useProjectHydration`, `usePersistence`), `tool-executors.ts` (608 lines), API routes refactored |
| Wave 4 | Complete | UI barrel export (68 lines), tier-meta utility (228 lines), page-descriptions consolidation (98 lines) |
| Wave 5 | Complete | ToolWidgetBase (~350 lines, 15 components), 50 files updated with UI barrel imports, 3 widgets refactored (23-29% reduction each) |
| Wave 6 | Complete | service-content.ts split (1,348 -> 78 line index), useLiveVoiceSession.ts (947 -> 858), audio-utils.ts (223 lines extracted), DynamicPortfolioRenderer.tsx (928 -> 912 shimmer cleanup) |
| Wave 7 | In Progress | Public pages simplification + TODO cleanup |

---

## Metrics Progress

| Metric | Before | Current | Target |
|--------|--------|---------|--------|
| Files over 700 lines | 13 | 14* | 5 |
| ChatWizard.tsx lines | 2,878 | 1,638 | ~1,400 |
| Lint suppressions (top 3 API routes) | 36 | 0 | ~6 |
| Action handler hooks | 0 | 7 | 7 |
| State management hooks | 0 | 3 | 3 |
| Tool executors extracted | 0 | 1 file (608 lines) | Done |

*Note: typed-queries.ts (1,129 lines) is a new consolidation file that intentionally combines query logic in one place. This is acceptable architecture.

---

## Files Created (Waves 1-3)

### Wave 1: Core Utilities

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/chat/wizard-utils.ts` | 213 | Utility functions extracted from ChatWizard |
| `src/lib/chat/tool-schemas.ts` | 873 | Consolidated tool schema definitions |
| `src/lib/supabase/typed-queries.ts` | 1,129 | Type-safe Supabase query wrappers |

### Wave 2: Action Handler Hooks

| File | Lines | Actions Handled |
|------|-------|-----------------|
| `src/components/chat/handlers/useFormActions.ts` | 50 | open-form, insertPrompt |
| `src/components/chat/handlers/usePhotoActions.ts` | 93 | addPhotos, reorderImages, manageImages |
| `src/components/chat/handlers/usePreviewActions.ts` | 211 | openPreview, previewWithHighlight, setTab |
| `src/components/chat/handlers/useContentActions.ts` | 431 | updateField, updateDescriptionBlocks, regenerateSection |
| `src/components/chat/handlers/usePublishActions.ts` | 337 | validateForPublish, validateField, checkPublishReady, publish, archiveProject |
| `src/components/chat/handlers/useGenerationActions.ts` | 101 | generatePortfolioContent, composePortfolioLayout, showPortfolioPreview |
| `src/components/chat/handlers/useExportActions.ts` | 20 | exportProject |
| `src/components/chat/handlers/types.ts` | 4 | Shared type definitions |

### Wave 3: State Hooks + Tool Executors

| File | Purpose |
|------|---------|
| `src/components/chat/hooks/useUIState.ts` | photoSheet, previewOverlay, previewHints, saving, regenerating state |
| `src/components/chat/hooks/useProjectHydration.ts` | Session loading for edit/create modes |
| `src/components/chat/hooks/usePersistence.ts` | Session saves, project sync, tool call tracking |
| `src/lib/chat/tool-executors.ts` | 14 tool executor functions extracted from tools-runtime.ts |

---

## Files Modified

### Significantly Reduced

| File | Before | After | Change |
|------|--------|-------|--------|
| `src/components/chat/ChatWizard.tsx` | 2,878 | 1,638 | -1,240 lines (43%) |

### Refactored for Type Safety

- `src/app/api/onboarding/route.ts` - 13 suppressions removed
- `src/app/api/projects/[id]/images/route.ts` - 12 suppressions removed
- `src/app/api/ai/generate-content/route.ts` - 11 suppressions removed

---

## Current Large Files (700+ lines)

Files still requiring attention in future waves:

| File | Lines | Wave |
|------|-------|------|
| `src/lib/supabase/typed-queries.ts` | 1,129 | N/A (consolidation file) |
| `src/components/chat/hooks/useLiveVoiceSession.ts` | 950 | Wave 6 |
| `src/components/portfolio/DynamicPortfolioRenderer.tsx` | 928 | Wave 6 |
| `src/lib/agents/story-extractor.ts` | 888 | Wave 6 |
| `src/lib/chat/tool-schemas.ts` | 873 | N/A (schema file) |
| `src/app/(public)/services/[type]/page.tsx` | 788 | Wave 7 |
| `src/app/(public)/[city]/masonry/[type]/[slug]/page.tsx` | 788 | Wave 7 |
| `src/lib/agents/discovery.ts` | 780 | Wave 6 |
| `src/lib/mcp/tools.ts` | 766 | Wave 6 |
| `src/app/api/onboarding/route.ts` | 736 | Consider splitting |
| `src/types/database.ts` | 724 | N/A (type definitions) |
| `src/lib/agents/orchestrator.ts` | 711 | Wave 6 |
| `src/app/api/chat/route.ts` | 704 | Consider splitting |

---

## Wave 4: Duplication Elimination (Complete)

### Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/ui/index.ts` | 68 | Barrel export for 30+ shadcn/ui components |
| `src/lib/tools/tier-meta.ts` | 228 | Shared tier metadata for diagnostic widgets |
| `src/lib/constants/page-descriptions.ts` | 98 | Consolidated service icons and page utilities |

### UI Barrel Export Details

Exports components in logical groups:
- Core form components (button, input, textarea, label, checkbox, select, switch)
- Form utilities (form, form-error)
- Layout components (card, separator, scroll-area, collapsible, accordion, tabs)
- Overlay components (dialog, alert-dialog, sheet, dropdown-menu, tooltip, popover, command, navigation-menu)
- Feedback components (alert, badge, progress, skeleton, sonner)
- Display components (avatar)
- Custom components (password-input, password-requirements, cta-button, upload-progress, ai-progress, save-indicator, safe-image)

### Tier Meta Utility Details

Provides:
- `getTierMeta()` - Standard low/medium/high metadata
- `getSeverityMeta()` - Severity-labeled variants
- `getRiskMeta()` - Risk-labeled variants
- `getUrgencyMeta()` - Urgency tier mapping (monitor/schedule/urgent)
- `TIER_COLORS` / `TIER_BADGE_COLORS` - Tailwind class constants
- Helper functions: `getTierColorClass()`, `getTierBadgeVariant()`, `getTierIcon()`

### Page Descriptions Utility Details

Consolidates from multiple sources:
- Re-exports `SERVICE_ICONS` and `getServiceIcon()` from canonical source (`@/lib/services/slug-mappings`)
- Re-exports `SERVICE_TYPE_DESCRIPTIONS` from SEO module (`@/lib/seo/service-type-descriptions`)
- Provides `PAGE_META` constants (siteUrl, siteName, keywordsPrefix)
- Utility functions: `getPageTitle()`, `getCanonicalUrl()`, `formatCityName()`, `formatServiceName()`

**Files Updated:**
- `src/app/(public)/services/page.tsx` - Removed local SERVICE_ICONS copy (10 lines saved)
- `src/app/(public)/services/[type]/page.tsx` - Removed local SERVICE_ICONS copy (10 lines saved)

---

## Wave 5: Widget Consolidation + State Loader + UI Import Migration (Complete)

### Objectives

1. **ToolWidgetBase Component** - Create unified base component for 6 diagnostic widgets
2. **Project State Loader Extraction** - Extract project state loading logic from ChatWizard
3. **UI Barrel Import Migration** - Update files to use barrel imports from `@/components/ui`

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/widgets/ToolWidgetBase.tsx` | ~350 | 15 composable components for diagnostic widgets |
| `src/components/chat/hooks/project-state-loader.ts` | N/A | Already existed (verified) |

### Files Modified

**Widget Consolidation (3 files refactored):**

| Widget | Before | After | Reduction |
|--------|--------|-------|-----------|
| `ContentQualityWidget.tsx` | ~150 lines | ~115 lines | -23% |
| `SEOValidationWidget.tsx` | ~145 lines | ~105 lines | -28% |
| `ImageAnalysisWidget.tsx` | ~140 lines | ~100 lines | -29% |

**UI Barrel Import Migration (50 files):**
- Updated imports across `src/app/`, `src/components/`, and form components
- Consolidated individual shadcn/ui imports to barrel exports from `@/components/ui`

### Actual Outcomes

| Metric | Before Wave 5 | After Wave 5 | Notes |
|--------|---------------|--------------|-------|
| ToolWidgetBase lines | 0 | ~350 | 15 composable components |
| Widget files refactored | 0 | 3 | 23-29% reduction each |
| Files with barrel imports | 0 | 50 | Cleaner imports |
| project-state-loader | Planned | Verified existing | Already in place |

### Progress

- [x] Create ToolWidgetBase component (~350 lines, 15 components)
- [x] Refactor ContentQualityWidget to use base (23% reduction)
- [x] Refactor SEOValidationWidget to use base (28% reduction)
- [x] Refactor ImageAnalysisWidget to use base (29% reduction)
- [ ] Refactor ServiceAreaWidget to use base (deferred)
- [ ] Refactor PublishReadinessWidget to use base (deferred)
- [ ] Refactor DuplicationCheckWidget to use base (deferred)
- [x] Verify project-state-loader.ts exists
- [x] Update 50 files with UI barrel imports

### Notes

- ToolWidgetBase provides 15 composable components for building diagnostic widgets
- Three widgets fully refactored with significant line reductions
- Three widgets deferred to maintain momentum on higher-impact work
- UI barrel import migration exceeded initial estimate (50 files vs 25 planned)

---

## Wave 6: Secondary Large Files (Complete)

### Objectives

1. **service-content.ts (1,348 lines)** - Split by service category
2. **useLiveVoiceSession.ts (947 lines)** - Extract audio utilities
3. **DynamicPortfolioRenderer.tsx (928 lines)** - Clean up shimmer/loading code

### Files Created/Modified

**service-content.ts Split (Already Completed):**
| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/constants/service-content/construction.ts` | Construction services content | 411 |
| `src/lib/constants/service-content/repair.ts` | Repair services content | 638 |
| `src/lib/constants/service-content/specialty.ts` | Specialty services content | 183 |
| `src/lib/constants/service-content/types.ts` | Type definitions | 67 |
| `src/lib/constants/service-content.ts` | Re-export index | 78 |

**useLiveVoiceSession.ts Extraction:**
| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/voice/audio-utils.ts` | Audio processing utilities | 223 |
| `src/components/chat/hooks/useLiveVoiceSession.ts` | Main hook (reduced) | 858 |

**DynamicPortfolioRenderer.tsx Cleanup:**
| File | Before | After | Change |
|------|--------|-------|--------|
| `src/components/portfolio/DynamicPortfolioRenderer.tsx` | 928 | 912 | -16 lines (shimmer cleanup) |

### Actual Outcomes

| Metric | Before Wave 6 | After Wave 6 | Notes |
|--------|---------------|--------------|-------|
| service-content.ts | 1,348 lines | 78 lines (index) | Split into 4 category files (1,299 total) |
| useLiveVoiceSession.ts | 947 lines | 858 lines | audio-utils.ts extracted (223 lines) |
| DynamicPortfolioRenderer.tsx | 928 lines | 912 lines | Shimmer code cleanup |
| New utility file | 0 | 223 lines | audio-utils.ts |

### Progress

- [x] Split service-content.ts by category (already done)
- [x] Extract audio utilities from useLiveVoiceSession.ts (89 line reduction)
- [x] Clean up DynamicPortfolioRenderer.tsx shimmer code (16 line reduction)
- [x] Update imports in consuming files
- [x] Verify all functionality preserved

### Notes

- service-content.ts was already split prior to Wave 6 analysis; verified and documented
- useLiveVoiceSession.ts reduction was more modest than planned (~10%) but extracted reusable audio-utils
- DynamicPortfolioRenderer.tsx cleanup focused on shimmer/loading code rather than full section extraction
- Section renderer extraction deferred as component remains under 1000 lines

---

## Wave 7: Public Pages + TODO Cleanup (In Progress)

### Objectives

1. **Public pages simplification** - Reduce duplication in `(public)` route group
2. **TODO cleanup** - Address 5 TODOs identified in clean-code-findings.md
3. **Final dead code review** - Remove unused exports and deprecated patterns

### TODOs to Address

| File | Line | TODO |
|------|------|------|
| `src/components/chat/VoiceModeButton.tsx` | 84 | Remove after all consumers are updated |
| `src/components/chat/hooks/useCompleteness.ts` | 223 | Remove after Phase 2 cleanup |
| `src/lib/chat/tools-runtime.ts` | 492 | Phase 10 migration - calls both Design Agent and legacy composer |
| `src/lib/chat/tools-runtime.ts` | 592 | Remove once all callers use Quality Agent format |
| `src/lib/mcp/tools.ts` | 784 | Replace hardcoded '/masonry/' with dynamic trade segment |

### Public Page Targets

| File | Lines | Issue |
|------|-------|-------|
| `src/app/(public)/services/[type]/page.tsx` | 788 | Duplication with other service pages |
| `src/app/(public)/[city]/masonry/[type]/[slug]/page.tsx` | 788 | Template duplication |
| `src/app/(public)/[city]/masonry/[type]/page.tsx` | 665 | Repeated 6-line blocks |
| `src/app/(public)/[city]/masonry/page.tsx` | 458 | Shared patterns with siblings |

### Expected Outcomes

| Metric | Before Wave 7 | After Wave 7 | Notes |
|--------|---------------|--------------|-------|
| TODOs addressed | 5 | 0 | All cleanup TODOs resolved |
| Public page duplication | High | Low | Shared components extracted |
| Dead code | Unknown | Removed | Final sweep complete |

### Progress

- [ ] Review and address VoiceModeButton.tsx TODO
- [ ] Review and address useCompleteness.ts TODO
- [ ] Review and address tools-runtime.ts TODOs (2)
- [ ] Review and address mcp/tools.ts TODO
- [ ] Extract shared public page components
- [ ] Final dead code review
- [ ] Update clean-code-findings.md with final status

---

## Risk Notes

- All changes maintain behavioral parity with original code
- No new `any` types introduced
- Existing tests continue to pass after each wave
- API route refactoring uses typed wrappers that provide proper type inference

---

## Final Summary (Waves 1-6)

### Overall Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **ChatWizard.tsx** | 2,878 lines | 1,638 lines | -1,240 lines (43%) |
| **Lint suppressions (top 3 API routes)** | 36 | 0 | -36 (100%) |
| **service-content.ts** | 1,348 lines | 78 lines (index) | -1,270 lines (94%) |
| **useLiveVoiceSession.ts** | 947 lines | 858 lines | -89 lines (9%) |
| **DynamicPortfolioRenderer.tsx** | 928 lines | 912 lines | -16 lines (2%) |

### Key Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/supabase/typed-queries.ts` | 1,129 | Type-safe Supabase query wrappers |
| `src/lib/chat/tool-schemas.ts` | 873 | Consolidated tool schema definitions |
| `src/lib/chat/tool-executors.ts` | 608 | Extracted tool executor functions |
| `src/lib/chat/wizard-utils.ts` | 213 | Utility functions from ChatWizard |
| `src/lib/voice/audio-utils.ts` | 223 | Audio processing utilities |
| `src/lib/tools/tier-meta.ts` | 228 | Shared tier metadata for widgets |
| `src/lib/constants/page-descriptions.ts` | 103 | Consolidated page utilities |
| `src/components/ui/index.ts` | 67 | UI component barrel export |
| **Action handler hooks (7 files)** | 1,247 | Extracted from ChatWizard |
| **State hooks (3 files)** | 672 | useUIState, useProjectHydration, usePersistence |
| **service-content split (4 files)** | 1,299 | construction, repair, specialty, types |

### Waves Completed

1. **Wave 1**: Core utility extraction (wizard-utils, tool-schemas, typed-queries)
2. **Wave 2**: Action handler hooks (7 hooks, 1,247 lines)
3. **Wave 3**: State hooks + tool executors + API route refactoring
4. **Wave 4**: Duplication elimination (UI barrel, tier-meta, page-descriptions)
5. **Wave 5**: Widget consolidation + UI import migration (50 files)
6. **Wave 6**: Secondary large files (service-content split, audio-utils extraction)

### Estimated Line Count Changes

| Category | Lines Removed | Lines Added | Net Change |
|----------|---------------|-------------|------------|
| ChatWizard refactor | ~1,240 | ~3,500 (new files) | +2,260 (better organization) |
| API route suppressions | 0 | ~200 (typed wrappers) | +200 (type safety) |
| service-content split | ~1,270 | ~1,377 (split files) | +107 (modular) |
| useLiveVoiceSession | ~89 | ~223 (audio-utils) | +134 (reusable) |
| UI imports | ~500 (scattered) | ~67 (barrel) | -433 (cleaner imports) |

**Total new infrastructure**: ~6,500 lines across 20+ new files
**Total consolidation savings**: ~1,700 lines removed from monoliths
**Net result**: Code more modular, typed, and maintainable

### Architecture Improvements

- **Single Responsibility**: ChatWizard now delegates to specialized hooks
- **Type Safety**: API routes use typed query wrappers instead of `any` casts
- **Reusability**: tier-meta, audio-utils, and page-descriptions shared across components
- **Discoverability**: UI barrel export and consolidated constants
- **Testability**: Smaller, focused modules easier to unit test

---

## References

- **Findings:** `docs/clean-code-findings.md`
- **Execution Plan:** `~/.claude/plans/atomic-wondering-rose.md`

# Phase 13 — Test Coverage Sprint

**Status:** 🔄 IN PROGRESS
**Rationale:** The business rename is a significant refactor with runtime risk. Test coverage ensures all flows work and provides safety net for future changes.

## Current State

- ✅ Vitest configured (`vitest.config.mts`)
- ✅ Package scripts ready (`npm test`, `npm run test:coverage`)
- ✅ **16 test files, 309 tests passing** (as of 2026-01-03)
- ✅ Component testing infrastructure ready (jsdom + testing-library)
- ✅ Playwright E2E configured (`playwright.config.ts`)
- 🔄 Test coverage expanding

### Test Files Created/Updated (2026-01-02)

| File | Tests | Coverage |
|------|-------|----------|
| `src/lib/api/auth.test.ts` | 28 | Session auth, bearer token, error handling, edge cases |
| `src/lib/data/projects.test.ts` | 12 | Related projects algorithm, deduplication |
| `src/lib/data/services.test.ts` | 33 | Service types, slug mapping, city aggregation, cache TTL |
| `src/lib/agents/__tests__/quality-checker.test.ts` | 36 | Quality assessment |
| `src/lib/agents/__tests__/content-generator.test.ts` | 19 | Content generation |
| `src/lib/agents/__tests__/story-extractor.test.ts` | 4 | Story extraction |
| `src/lib/chat/__tests__/tool-schemas.test.ts` | 30 | Tool schemas |
| `src/lib/images/mergeImagesById.test.ts` | 3 | Image merging |
| `src/app/api/onboarding/route.test.ts` | 2 | Onboarding API |
| `src/app/api/ai/transcribe/route.test.ts` | 2 | Transcription API |
| `src/app/api/businesses/me/route.test.ts` | 13 | GET/PATCH business profile, auth, validation |
| `src/app/api/projects/route.test.ts` | 15 | GET/POST projects, auth, pagination, validation |
| `src/components/chat/ChatMessage.test.tsx` | 21 | Message rendering, markdown, copy, feedback, streaming |
| `src/components/upload/ImageUploader.test.tsx` | 27 | Upload flow, drag-drop, validation, compression, delete |
| `src/components/publish/PublishChecklist.test.tsx` | 41 | Validation logic, status display, publish button states |
| `src/components/edit/SortableImageGrid.test.tsx` | 20 | Rendering, delete, disabled state, image error handling |

---

## Sub-Sprint 13.1 — Unit Tests (Lib Layer)

**Focus:** Core business logic and data access layer.

### Priority Files

| File | Why |
|------|-----|
| `src/lib/api/auth.ts` | Auth functions (`requireAuthBusiness`, bearer validation) |
| `src/lib/data/projects.ts` | Data access layer, `fetchRelatedProjects` |
| `src/lib/data/services.ts` | Service queries, business aggregations |
| `src/lib/chat/tools-runtime.ts` | Tool executors (most complex logic) |
| `src/lib/voice/usage-tracking.ts` | Usage tracking, quota calculations |
| `src/lib/agents/story-extractor.ts` | Extraction logic, deduplication |

### Acceptance
- [x] 80%+ coverage on auth.ts (18 tests covering all public functions)
- [x] 80%+ coverage on data layer files (projects.ts: 12 tests, services.ts: 31 tests)
- [x] Mocking patterns established for Supabase (see `auth.test.ts`, `services.test.ts`)

---

## Sub-Sprint 13.2 — API Route Tests

**Focus:** API contract verification.

### Critical Endpoints

| Endpoint | Test Cases |
|----------|------------|
| `POST /api/chat` | Auth required, message validation, response format |
| `GET/PATCH /api/businesses/me` | Profile CRUD, auth, RLS |
| `POST /api/ai/live-session` | Quota check, token generation |
| `POST /api/projects` | Creation, validation, storage paths |
| `PATCH /api/projects/[id]` | Updates, ownership validation |

### Acceptance
- [x] All critical endpoints have happy path tests (businesses/me, projects)
- [x] Error cases covered (401, 403, 400) - auth and validation tests
- [x] Response schemas validated (assertions on response structure)

---

## Sub-Sprint 13.3 — Component Tests

**Focus:** Key UI components with complex logic.

### Priority Components

| Component | Test Cases | Status |
|-----------|------------|--------|
| `ChatMessage` | Message rendering, markdown, feedback | ✅ 21 tests |
| `ImageUploader` | Upload flow, drag-drop, validation, delete | ✅ 27 tests |
| `ChatWizard` | Tool calls, streaming, session mgmt | ⏳ Complex (defer to E2E) |
| `PublishChecklist` | Validation logic, state updates | ✅ 41 tests |
| `SortableImageGrid` | Reorder, delete, hero selection | ✅ 20 tests |

### Setup Complete
- ✅ `@testing-library/react` + `@testing-library/jest-dom` installed
- ✅ Vitest config updated for `jsdom` environment
- ✅ Test setup file with browser API mocks (`src/lib/testing/setup.ts`)

### Acceptance
- [x] Component testing infrastructure established
- [x] Critical user interactions tested (PublishChecklist, SortableImageGrid, ImageUploader, ChatMessage)
- [x] Accessibility checks pass (aria labels verified)
- [ ] Component snapshots established (optional - deferred)

---

## Sub-Sprint 13.4 — E2E Critical Paths

**Focus:** Full user journeys with Playwright.

### User Journeys

1. **Auth Flow**
   - Signup → Email verification → Dashboard redirect
   - Login → Dashboard access
   - Logout → Public page access only

2. **Onboarding Flow**
   - New user → Profile setup wizard → Dashboard
   - Business profile completion

3. **Project Creation**
   - Dashboard → New project → Chat interview → Upload images → Publish
   - Verify public page renders correctly

4. **Project Editing**
   - Edit content → Save → Verify changes persist
   - Edit images → Reorder/delete → Verify order persists

5. **Public Pages**
   - View project → Related projects load
   - SEO meta tags present
   - Structured data valid

### E2E Test Files
| File | Tests | Coverage |
|------|-------|----------|
| `src/__tests__/e2e/auth.spec.ts` | 12 | Login, signup, protected routes, public access |

### Acceptance
- [x] Playwright configured with chromium
- [x] Auth flow E2E tests written
- [ ] All 5 journeys pass (auth ✅, others pending)
- [ ] Tests run in < 5 minutes
- [ ] CI integration configured

---

## Testing Infrastructure Notes

### Vitest Config (exists)
```typescript
// vitest.config.mts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: { provider: 'v8' }
  }
});
```

### Mocking Strategy
- **Supabase:** Use `@supabase/supabase-js` mock or MSW
- **AI APIs:** Mock Gemini/Whisper responses with fixtures
- **Storage:** Mock signed URLs and uploads

### Recommended Test Structure
```
src/
├── lib/
│   ├── api/
│   │   ├── auth.ts
│   │   └── auth.test.ts        # Unit tests co-located
│   └── data/
│       ├── projects.ts
│       └── projects.test.ts
├── components/
│   └── chat/
│       ├── ChatWizard.tsx
│       └── ChatWizard.test.tsx
└── __tests__/                   # Integration/E2E tests
    └── e2e/
        ├── auth.spec.ts
        └── project-creation.spec.ts
```

---

## References

- `docs/03-architecture/data-model.md`
- `docs/04-apis/api-design.md`
- `docs/11-seo-discovery/` (templates + structured data)
- `supabase/migrations/*`
- `.claude/skills/agent-atlas/references/MIGRATIONS.md`
- Vitest Docs: https://vitest.dev/
- Playwright Docs: https://playwright.dev/

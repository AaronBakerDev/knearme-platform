# Phase 13 — Test Coverage Sprint

**Status:** 🔜 PLANNED
**Rationale:** The business rename is a significant refactor with runtime risk. Test coverage ensures all flows work and provides safety net for future changes.

## Current State

- ✅ Vitest configured (`vitest.config.mts`)
- ✅ Package scripts ready (`npm test`, `npm run test:coverage`)
- ❌ **0 test files exist** in `src/`
- ❌ No Playwright/E2E tests
- ❌ **0% test coverage**

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
- [ ] 80%+ coverage on auth.ts
- [ ] 80%+ coverage on data layer files
- [ ] Mocking patterns established for Supabase

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
- [ ] All critical endpoints have happy path tests
- [ ] Error cases covered (401, 403, 400)
- [ ] Response schemas validated

---

## Sub-Sprint 13.3 — Component Tests

**Focus:** Key UI components with complex logic.

### Priority Components

| Component | Test Cases |
|-----------|------------|
| `ChatWizard` | Message rendering, tool calls, streaming |
| `ImageUploader` | Upload flow, compression, error handling |
| `PublishChecklist` | Validation logic, state updates |
| `SortableImageGrid` | Reorder, delete, hero selection |
| `BlockEditor` | Rich text editing, block manipulation |

### Acceptance
- [ ] Critical user interactions tested
- [ ] Accessibility checks pass
- [ ] Component snapshots established

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

### Acceptance
- [ ] All 5 journeys pass
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

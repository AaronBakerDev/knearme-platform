# Phase 11 — Full Rename: Contractors → Businesses

> **Goal:** Rename contractor schema, APIs, and routes to business-first naming across the stack.
> **Status:** ✅ COMPLETE
> **Started:** 2026-01-02
> **Completed:** 2026-01-02

---

## Why This Phase

We are positioning KnearMe for portfolio-based businesses beyond masonry. The public route rename to `/businesses` is done, but the data model and APIs are still named `contractors`. This phase completes the rename at the database + API + code levels to remove legacy naming.

---

## Critical Discovery: Dual Schema Exists

**Important:** The database already has BOTH `contractors` AND `businesses` tables:

| Table | Purpose | Status |
|-------|---------|--------|
| `contractors` | Legacy table (MVP) | Active, 17 columns |
| `businesses` | New agentic schema | Exists but empty, has `legacy_contractor_id` FK |

The `businesses` table was added in Phase 9/10 for the agentic architecture. It has a `legacy_contractor_id` column for migration linking.

**Decision needed:** Do we migrate data from `contractors` → `businesses` and deprecate, or rename `contractors` to something else?

---

## Inventory (Sub-Sprint 11.1) — COMPLETE

### Database Objects

#### Tables with `contractor` References
| Table | Column/Reference |
|-------|------------------|
| `contractors` | Main table (17 columns) |
| `projects` | `contractor_id` FK |
| `push_subscriptions` | `contractor_id` FK |
| `voice_usage` | `contractor_id` FK (nullable) |
| `chat_sessions` | References via RLS |

#### RLS Policies (19 total with "contractor" naming)
| Table | Policies |
|-------|----------|
| `contractors` | 3 policies (view own, update own, public view published) |
| `projects` | 5 policies (CRUD + public view) |
| `project_images` | 2 policies (manage own, public view) |
| `chat_sessions` | 4 policies (CRUD) |
| `interview_sessions` | 1 policy (manage own) |
| `push_subscriptions` | 1 policy (manage own) |
| `voice_usage` | 3 policies (insert/update/view own) |

#### Functions (3)
- `knearme_handle_new_user` — Creates contractor on signup
- `get_auth_contractor_ids` — RLS helper
- `contractor_has_published_project` — Public visibility check

#### Triggers (1)
- `contractors_updated_at` — Auto-updates `updated_at`

### API Routes

| Route | Methods | Call Sites |
|-------|---------|------------|
| `/api/contractors/me` | GET, PATCH | Profile edit, project detail, chat panel |
| `/api/contractors/[slug]` | GET | Public contractor profile page |

### TypeScript Types (`src/types/database.ts`)

```typescript
// Legacy types to rename:
export type Contractor = Database['public']['Tables']['contractors']['Row'];
export type ContractorInsert = ...
export type ContractorUpdate = ...
export type ProjectWithContractor = Project & { contractor: Contractor };
export type ContractorWithProjects = Contractor & { projects: Project[] };
```

### Code References (1,211 occurrences in `src/`)

**High-impact files (>10 references):**
- `src/lib/chat/tool-schemas.ts` (25)
- `src/lib/chat/tools-runtime.ts` (32)
- `src/lib/chat/chat-prompts.ts` (15)
- `src/types/database.ts` (22)
- `src/lib/observability/kpi-events.ts` (21)
- `src/lib/data/services.ts` (19)
- `src/app/api/contractors/me/route.ts` (32)
- `src/app/api/contractors/[slug]/route.ts` (33)

**Categories:**
- API routes: ~100 references
- Lib/utils: ~400 references
- Components: ~300 references
- Types: ~100 references
- Agents/chat: ~200 references
- Public pages: ~100 references

### Analytics Events

No contractor-specific event names found. Events use generic names like `page_view`, tracked via `trackClientEvent`.

### Migrations (19 files reference contractor)

Key migrations to review:
- `001_initial_schema.sql` — Creates `contractors` table
- `005_fix_contractor_policy_recursion.sql`
- `026_add_contractor_plan_tier.sql`
- `028_add_contractor_profile_slug.sql`
- `030_agentic_schema.sql` — Creates `businesses` table
- `031_onboarding_columns.sql`

---

## Revised Sprint Plan

Given the scope (1,200+ code references, 19 RLS policies, 3 functions), splitting into smaller focused sprints:

---

## Sub-Sprint 11.1 — Inventory & Impact Map ✅ COMPLETE

- [x] Run `rg -n "contractor" src docs supabase` and capture all references.
- [x] List DB objects tied to contractors: tables, policies, triggers, functions, views.
- [x] List API routes and client fetches of `/api/contractors/*`.
- [x] Identify analytics events and dashboards that reference contractor.
- [x] Create this inventory document.

---

## Sub-Sprint 11.2 — Data Migration Strategy ✅ COMPLETE

**Focus:** Decide how to handle the dual-table situation.

### Tasks
- [x] Analyze `businesses` table schema vs `contractors` — identify gaps.
- [x] Decide: migrate `contractors` data → `businesses` OR rename `contractors` → `businesses`.
- [x] If migrating: Write data migration script with rollback.
- [x] Document the chosen approach.

### Critical Discovery: Table Conflict

The existing `businesses` table is from the **directory platform** (different project in workspace), NOT from the portfolio agentic migration. It has:
- Different columns (`owner_id` vs `auth_user_id`, `category_id`, etc.)
- FK relationships to `listings`, `reviews`, `service_areas`, etc.
- **0 records** (all related tables also empty)

Migration `030_agentic_schema.sql` was never applied to production.

### Chosen Approach: Option B with Schema Resolution

1. **Rename** existing empty directory `businesses` → `_deprecated_directory_businesses`
2. **Create** new agentic `businesses` table with proper schema
3. **Migrate** data from `contractors` → `businesses`
4. **Add** `business_id` column to related tables (`projects`, `push_subscriptions`, `voice_usage`)
5. **Keep** `contractors` table temporarily for backward compatibility

### Migration File Created

**File:** `supabase/migrations/033_business_rename_migration.sql`

**What it does:**
- Renames directory `businesses` → `_deprecated_directory_businesses`
- Creates new `businesses` table with all contractor fields + JSONB agentic fields
- Migrates 10 contractor records to businesses
- Adds `business_id` FK to projects, push_subscriptions, voice_usage
- Creates RLS policies and helper functions
- Updates `knearme_handle_new_user` trigger

### Column Mapping

| contractors | businesses | Notes |
|-------------|------------|-------|
| id | id | Same UUID, 1:1 |
| auth_user_id | auth_user_id | Same |
| email | email | Same |
| business_name | name | Renamed |
| profile_slug | slug | Renamed |
| city, state, city_slug | city, state, city_slug | Kept + added to `location` JSONB |
| address | address | Added in 032; not backfilled in 033 (defaults to NULL) |
| postal_code | postal_code | Added in 032; not backfilled in 033 (defaults to NULL) |
| phone | phone | Added in 032; not backfilled in 033 (defaults to NULL) |
| website | website | Added in 032; not backfilled in 033 (defaults to NULL) |
| services | services | Array, also in `understanding.specialties` |
| service_areas | service_areas | Array, also in `location.service_areas` |
| description | description | Same |
| profile_photo_url | profile_photo_url | Same |
| google_place_id | google_place_id | Same |
| google_cid | google_cid | Same |
| onboarding_method | onboarding_method | Same |
| (n/a) | plan_tier | New, defaults to 'free' |
| (n/a) | location | New JSONB for agentic context |
| (n/a) | understanding | New JSONB for agent-discovered data |
| (n/a) | context | New JSONB for agent memory |
| (n/a) | discovered_data | New JSONB for Google Places data |
| (n/a) | legacy_contractor_id | FK back to contractors |

### Acceptance
- [x] Clear documented decision on migration approach.
- [x] Migration script ready (`033_business_rename_migration.sql`).

---

## Sub-Sprint 11.3 — Database Schema Migration ✅ COMPLETE

**Focus:** Execute the chosen migration strategy.

### Tasks
- [x] Create migration file with table/column renames or data migration.
- [x] Add `business_id` alongside `contractor_id` in: `projects`, `push_subscriptions`, `voice_usage` (chat_sessions conditional).
- [x] Rename constraints and indexes.
- [x] Update foreign key relationships.

### Migration Applied: 2026-01-02

**Migration file:** `supabase/migrations/033_business_rename_migration.sql`

**Steps in migration:**
1. Rename directory `businesses` → `_deprecated_directory_businesses`
2. Create new 27-column `businesses` table
3. Migrate 10 contractor records to businesses
4. Add `business_id` to `projects`, `push_subscriptions`, `voice_usage` (and `chat_sessions` when `contractor_id` exists)
5. Create updated_at trigger + helper functions
6. Create 4 RLS policies (view/update/insert own, public view published)
7. Update `knearme_handle_new_user` trigger (create contractor + business records)

### Verification Results

| Check | Result |
|-------|--------|
| contractors count | 10 |
| businesses count | 10 ✅ |
| projects with business_id | 71 ✅ |
| businesses columns | 27 (includes JSONB fields) ✅ |
| RLS policies | 4 ✅ |

### Acceptance
- [x] `businesses` table is the primary table.
- [x] `business_id` columns added (contractor_id kept for backward compat).

---

## Sub-Sprint 11.4 — RLS Policies & Functions ✅ COMPLETE

**Focus:** Update all 19 RLS policies and 3 functions.

### Tasks
- [x] Rename `get_auth_contractor_ids` → `get_auth_business_ids`.
- [x] Rename `contractor_has_published_project` → `business_has_published_project`.
- [x] Update `knearme_handle_new_user` to create business record.
- [x] Create RLS policies for businesses table (4 policies).
- [x] Create `businesses_updated_at` trigger.

**Note:** Done as part of Sub-Sprint 11.3 migration. Legacy contractor policies remain for backward compatibility until code migration complete.

### Acceptance
- [x] All policies pass for core flows.
- [x] No RLS errors in Supabase logs.

---

## Sub-Sprint 11.5 — API Routes ✅ COMPLETE

**Focus:** Create `/api/businesses/*` routes as new canonical endpoints.

### Tasks
- [x] Create `src/app/api/businesses/me/route.ts` (280 lines).
- [x] Create `src/app/api/businesses/[slug]/route.ts` (229 lines).
- [x] Update all fetch calls (`/api/contractors/me` → `/api/businesses/me`).
- [x] Fix pre-existing TypeScript errors exposed by build.

### Files Created/Modified
- `src/app/api/businesses/me/route.ts` — New canonical endpoint (GET/PATCH)
- `src/app/api/businesses/[slug]/route.ts` — Public profile by slug
- `src/app/(dashboard)/projects/[id]/page.tsx` — Updated fetch (renamed in 11.9)
- `src/app/(dashboard)/profile/edit/page.tsx` — Updated fetch + field mapping (renamed in 11.9)
- `src/components/chat/ProjectEditFormPanel.tsx` — Updated fetch

### TypeScript Fixes Required
During build verification, fixed pre-existing errors:
- `src/app/api/ai/analyze-images/route.ts:116` — Type predicate syntax
- `src/app/api/businesses/me/route.ts:70-73` — Zod `z.record()` requires 2 args

### Design Decision: Backward Compatibility
Old `/api/contractors/*` routes kept temporarily for:
1. Any external integrations that may depend on them
2. Gradual migration safety
3. Removal deferred; still kept after 11.12 for backward compatibility

### Acceptance
- [x] All API calls use `/api/businesses/*`.
- [x] Build passes (`npm run build`).
- [x] Old routes kept for backward compat (removal deferred; still present).

---

## Sub-Sprint 11.5.1 — Code Review Fixes

**Focus:** Address issues identified in code review of Sub-Sprints 11.3-11.5.

### Issues Found (2026-01-02 Code Review)

| # | Issue | Severity | File | Line(s) |
|---|-------|----------|------|---------|
| CR-1 | Asymmetric sync between dual tables | **High** | `/api/contractors/me/route.ts` | 180-206 |
| CR-2 | Missing indexes on `business_id` columns (push_subscriptions, voice_usage; projects index only) | Moderate | Migration 033 | ~185-206 |
| CR-3 | `SECURITY DEFINER` unnecessary on helper fn | Moderate | Migration 033 | 245-254 |
| CR-4 | Hardcoded nulls in contractor fallback | Moderate | `/api/businesses/[slug]/route.ts` | 109-110 |
| CR-5 | Race condition in slug uniqueness | Low | `/api/businesses/me/route.ts` | 76-104 |

---

### CR-1: Asymmetric Sync Logic (HIGH PRIORITY)

**Problem:** Updates through `/api/contractors/me` only sync 5 fields to `businesses` table, while `/api/businesses/me` syncs 9 fields back to `contractors`.

**Evidence:**

`/api/contractors/me` syncs (5 fields):
```typescript
// Lines 182-197
businessUpdates.name = updates.business_name;
businessUpdates.address = updates.address;
businessUpdates.postal_code = updates.postal_code;
businessUpdates.phone = updates.phone;
businessUpdates.website = updates.website;
```

`/api/businesses/me` syncs (9 fields):
```typescript
// Lines 306-332
contractorUpdates.business_name = updates.name;
contractorUpdates.profile_slug = updatePayload.slug;
contractorUpdates.city = updates.city;
contractorUpdates.state = updates.state;
contractorUpdates.city_slug = updatePayload.city_slug;
contractorUpdates.description = updates.description;
contractorUpdates.services = updates.services;
contractorUpdates.service_areas = updates.service_areas;
contractorUpdates.profile_photo_url = updates.profile_photo_url;
```

**Missing from contractors → businesses sync:**
- `slug` (from `profile_slug`)
- `city`
- `state`
- `city_slug`
- `description`
- `services`
- `service_areas`
- `profile_photo_url`
- `location` JSONB
- `understanding` JSONB

**Impact:** Data drift during transition period. Users editing via legacy endpoint lose data in new table.

**Status:** Superseded in 11.5.2 — contractors→businesses sync removed when businesses became source of truth.

---

### CR-2: Missing Indexes on business_id Columns

**Problem:** Migration 033 adds `business_id` to `push_subscriptions` and `voice_usage` but only indexes `projects`. The `chat_sessions` block is conditional and did not run in this DB (no `contractor_id` column).

**Evidence:** Migration 033 creates `idx_projects_business_id` but no indexes for `push_subscriptions.business_id` or `voice_usage.business_id`.

**Impact:** Performance degradation on business-scoped queries (projects/subscriptions/voice usage).

**Fix:** Add migration (034):
```sql
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_business_id
  ON public.push_subscriptions(business_id);

CREATE INDEX IF NOT EXISTS idx_voice_usage_business_id
  ON public.voice_usage(business_id);

CREATE INDEX IF NOT EXISTS idx_projects_business_id
  ON public.projects(business_id);
```

---

### CR-3: SECURITY DEFINER Unnecessary

**Problem:** `business_has_published_project` function uses `SECURITY DEFINER` which runs with elevated privileges.

**Evidence:** Migration lines 245-254.

**Impact:** Unnecessary privilege escalation. The function only checks public data.

**Fix:** Change to `SECURITY INVOKER` (or remove the clause entirely).

---

### CR-4: Hardcoded Nulls in Contractor Fallback

**Problem:** Public business endpoint hardcodes `phone: null` and `website: null` when falling back to contractor data, even though contractors table has these fields.

**Evidence:** `/api/businesses/[slug]/route.ts` lines 109-110:
```typescript
phone: null,    // ❌ Should be: contractor.phone
website: null,  // ❌ Should be: contractor.website
```

**Impact:** Data loss in public responses during transition.

---

### CR-5: Race Condition in Slug Uniqueness (LOW)

**Problem:** `findUniqueSlug` checks availability then returns, but another request could claim the slug before UPDATE completes.

**Evidence:** `/api/businesses/me/route.ts` lines 76-104.

**Impact:** Rare unique constraint violations. Database catches it, but poor UX.

**Fix (optional):** Add retry logic on unique constraint violation (error code 23505).

---

### Tasks

- [x] **CR-1**: Add missing sync fields to `/api/contractors/me/route.ts` (HIGH; superseded by CT-3 in 11.5.2)
- [x] **CR-2**: Create migration `034_code_review_fixes.sql` (combined with CR-3)
- [x] **CR-3**: Fix SECURITY DEFINER in `034_code_review_fixes.sql`
- [x] **CR-4**: Fix hardcoded nulls in `/api/businesses/[slug]/route.ts`
- [ ] **CR-5**: (Optional) Add retry logic for slug conflicts — deferred to backlog (not implemented in 11.12)

### Files Modified (2026-01-02)

| File | Change |
|------|--------|
| `supabase/migrations/034_code_review_fixes.sql` | Created — adds business_id indexes, fixes SECURITY DEFINER |
| `src/app/api/businesses/[slug]/route.ts` | Fixed hardcoded nulls (lines 110-111) |
| `src/app/api/contractors/me/route.ts` | Added full sync parity (lines 180-274; later removed in 11.5.2) |

### Acceptance

- [x] Contractors→businesses sync parity added, then removed in 11.5.2 (businesses is source of truth)
- [x] `business_id` indexes added for `projects`, `push_subscriptions`, `voice_usage` (chat_sessions not present)
- [x] `business_has_published_project` uses `SECURITY INVOKER` (in migration)
- [x] Contractor fallback returns actual phone/website values

### Follow-through (Completed)

- [x] Applied migration `034_code_review_fixes.sql` (2026-01-02)
- [x] Deployed code changes
- [x] Continued with Sub-Sprint 11.6 (TypeScript Types)

---

## Sub-Sprint 11.5.2 — Code Review (Post-11.6) ✅ COMPLETE

**Focus:** Review all completed work from 11.1-11.6
**Date:** 2026-01-02
**Completed:** 2026-01-02

### Review Summary

| Sub-Sprint | Reviewed | Issues | Status |
|------------|----------|--------|--------|
| 11.1 Inventory | ✅ | 0 | Clean |
| 11.2 Migration Strategy | ✅ | 0 | Clean |
| 11.3 Database Migration | ✅ | 4 | ✅ Fixed |
| 11.4 RLS & Functions | ✅ | 0 | Clean (done in 11.3) |
| 11.5 API Routes | ✅ | 14 | ✅ Critical fixed, moderate in backlog |
| 11.5.1 Code Review Fixes | ✅ | 0 | Clean |
| 11.6 TypeScript Types | ✅ | 1 | ✅ Fixed |

### Critical Issues — RESOLVED

| ID | Status | Fix Summary |
|----|--------|-------------|
| CT-3 | ✅ Fixed | Removed sync from contractors→businesses. Businesses is now sole source of truth. |
| BE-3 | ✅ Fixed | Replaced N+1 loop with single SQL query using `OR` filter + Set lookup |
| CT-1 | ✅ Fixed | Same fix applied to contractors route |
| CR-DB-1 | ✅ Fixed | Added missing fields (city, state, services, etc.) to Business type definition |
| CR-4 | ⏭️ Intentional | Circular ref is by design—same UUID for contractor/business maintains FK compat during migration |

### Moderate Issues (Track in Backlog)

| ID | File | Issue |
|----|------|-------|
| BE-1 | `src/app/api/businesses/me/route.ts` | `as any` bypasses type safety |
| BE-4 | `src/app/api/businesses/me/route.ts` | No logging when hitting contractor fallback |
| BE-5 | `src/app/api/businesses/me/route.ts` | Empty PATCH not rejected |
| BE-6 | `src/app/api/businesses/me/route.ts` | Sync errors swallowed |
| PB-2 | `src/app/api/businesses/[slug]/route.ts` | Only checks name, not city/state for "complete" |
| MIG-1 | Migration 033 | city/state stored in both columns AND JSONB |
| MIG-2 | Migration 033 | No validation queries before COMMIT |
| MIG-3 | Migration 033 | Race if concurrent insert during UPDATE |
| MIG-4 | Migration 033 | NAP fields (address/postal_code/phone/website) not backfilled from contractors |

### Tasks

- [x] **CT-3**: Choose businesses as source of truth, remove sync from contractors route
- [x] **BE-3/CT-1**: Replace slug loop with single SQL query
- [x] **CR-DB-1**: Add missing fields to Business type definition (city, state, services, etc.)
- [x] **CR-4**: Reviewed—intentional design, no fix needed

### Files Modified

| File | Change |
|------|--------|
| `src/app/api/contractors/me/route.ts` | Removed 95 lines of sync code, replaced N+1 slug loop |
| `src/app/api/businesses/me/route.ts` | Replaced N+1 slug loop with single query |
| `src/types/database.ts` | Added 12 missing fields to Business type |
| `src/app/api/ai/live-session/route.ts` | Fixed auth property access (contractor→business) |

### Acceptance

- [x] All critical issues resolved
- [x] Build passes (`npm run build` ✅)
- [x] 11.7 unblocked

---

## Sub-Sprint 11.6 — TypeScript Types ✅ COMPLETE (CR-DB-1 Fixed)

**Focus:** Add `Business*` types to `src/types/database.ts`, deprecate `Contractor*` types.

### Tasks
- [x] Add `Business`, `BusinessInsert`, `BusinessUpdate` types.
- [x] Add `ProjectWithBusiness`, `BusinessWithProjects` types.
- [x] Mark `Contractor*` types as `@deprecated` with JSDoc.
- [x] Add `PortfolioItem*`, `Conversation*`, `AgentMemory*` types.
- [x] Run TypeScript compiler to verify build.
- [x] Document migration strategy.

### Strategy Decision

**Approach:** Additive deprecation rather than immediate replacement.

- **Added:** `Business`, `BusinessInsert`, `BusinessUpdate`, `BusinessWithProjects`, `ProjectWithBusiness`
- **Deprecated (kept):** `Contractor`, `ContractorInsert`, `ContractorUpdate`, `ContractorWithProjects`, `ProjectWithContractor`
- **Bonus:** Added missing types for agentic tables (`PortfolioItem`, `Conversation`, `AgentMemory`, etc.)

This allows gradual migration through Sub-Sprints 11.7-11.9 without breaking changes.

### Files Modified
- `src/types/database.ts` — Reorganized with Business types primary, Contractor types deprecated

### Files Using Deprecated Types (17 files)
These will be migrated in subsequent sub-sprints:
- `/api/contractors/*` routes (11.5 kept for backward compat)
- `(dashboard)` route group pages (renamed from `(contractor)` in 11.9)
- `lib/api/auth.ts`, `lib/data/services.ts` (11.7)
- `components/chat/*` (11.8)
- `(public)` pages with contractor lookups (11.10)

### Acceptance
- [x] `npm run build` passes with no type errors.
- [x] `Business*` types available as primary types.
- [x] `Contractor*` types deprecated but functional.

---

## Sub-Sprint 11.7 — Lib/Utils Layer ✅ COMPLETE

**Focus:** Update high-impact lib files.

### Completed Tasks
- [x] Update `src/lib/api/auth.ts` — Added `BusinessAuthResult`, `requireAuthBusiness()`, `requireAuthUnifiedBusiness()`
- [x] Update `src/lib/chat/chat-types.ts` — `ToolContext.businessId` replaces `contractorId`
- [x] Update `src/lib/chat/tools-runtime.ts` — All tool executors use `businessId`, queries use `business_id` column
- [x] Update `src/lib/chat/prompt-context.ts` — Loads from `businesses` table
- [x] Update `src/lib/observability/traced-ai.ts` — `TelemetryMetadata.businessId`
- [x] Update `src/lib/voice/usage-tracking.ts` — Parameter renamed to `businessId`
- [x] Update API routes: `/api/chat/*`, `/api/ai/live-session` — Use `requireAuthBusiness()`
- [x] Update `src/lib/data/services.ts` — Changed imports, types, queries to use `Business` and `businesses` table
- [x] Update `src/lib/data/projects.ts` — Renamed `contractor_id` → `business_id`, queries use `businesses` table
- [x] Update `src/lib/chat/chat-prompts.ts` — Already migrated (uses `BusinessProfileContext`)
- [x] Agent files (`src/lib/agents/*`) — Updated prompt terminology (contractor → business owner)
- [x] Update `src/types/database.ts` — Added `business_id` to Project Row/Insert/Update types
- [x] Update call sites: `RelatedProjects.tsx`, `services/[type]/page.tsx`, API routes
- [x] Fix `ProjectEditFormArtifact.tsx` — Changed `contractorId` prop to `businessId`

### Agent Files Updated (2026-01-02)

Updated AI prompt terminology for universal portfolio vision:

| File | Changes |
|------|---------|
| `content-generator.ts` | "contractor portfolios" → "business portfolios" |
| `story-extractor.ts` | "contractor" → "business owner" in prompts/JSDoc |
| `types.ts` | Updated JSDoc comments |
| `orchestrator.ts` | Updated JSDoc comments |
| `ui-composer.ts` | "contractor projects" → "business projects" |
| `layout-composer.ts` | "contractor portfolio" → "business portfolio" |
| `subagents/story-agent.ts` | Updated prompts and extraction guidance |
| `subagents/design-agent.ts` | Updated prompt terminology |

**Note:** `subagents/quality-agent.ts` retains "Masonry contractor" and "General contractor" as these are intentional industry terms describing business types in example tables.

### Files Modified (2026-01-02)

| File | Change |
|------|--------|
| `src/lib/data/services.ts` | `Contractor` → `Business`, queries use `businesses` table, renamed `getContractorCountByService` → `getBusinessCountByService` |
| `src/lib/data/projects.ts` | `contractor_id` → `business_id`, `contractor_business_name` → `business_name`, queries use `businesses` table |
| `src/types/database.ts` | Added `business_id` to projects Row/Insert/Update types |
| `src/components/seo/RelatedProjects.tsx` | `contractor_business_name` → `business_name` |
| `src/app/(public)/services/[type]/page.tsx` | `project.contractor` → `project.business` |
| `src/app/(public)/[city]/masonry/[type]/[slug]/page.tsx` | `fetchRelatedProjects` call uses `business_id` |
| `src/app/api/projects/[id]/related/route.ts` | Query and auth check use `business_id` |

### Acceptance
- [x] Build passes (`npm run build` ✅)
- [x] All lib files compile
- [x] Chat/tools work with new naming

---

## Sub-Sprint 11.8 — Components ✅ COMPLETE

**Focus:** Update React components.

### Completed Tasks
- [x] Renamed `ContractorMobileNav` → `DashboardMobileNav` with deprecation alias
- [x] Updated `(dashboard)/layout.tsx` to query from `businesses` table (renamed in 11.9)
- [x] Updated `ProjectPublicPreview` to use `business` prop (with backward-compat `contractor` prop)
- [x] Updated chat component interfaces (`ChatWizard`, `CanvasPanel`, `PreviewOverlay`, `LivePortfolioCanvas`) to use `business` prop
- [x] Updated `ProjectEditFormArtifact` and `ProjectEditFormPanel` to use `businessId`
- [x] Updated `projects/[id]/page.tsx` to use `business` state and `/api/businesses/me` response

### Files Modified (2026-01-02)

| File | Change |
|------|--------|
| `src/components/navigation/ContractorMobileNav.tsx` | Renamed to `DashboardMobileNav`, added deprecation alias |
| `src/app/(dashboard)/layout.tsx` | Queries `businesses` table, uses `DashboardMobileNav` (renamed in 11.9) |
| `src/components/portfolio/ProjectPublicPreview.tsx` | Uses `business` prop with backward compat |
| `src/components/chat/LivePortfolioCanvas.tsx` | Updated `publicPreview` interface |
| `src/components/chat/ChatWizard.tsx` | Updated `publicPreview` interface |
| `src/components/chat/CanvasPanel.tsx` | Updated `publicPreview` interface |
| `src/components/chat/PreviewOverlay.tsx` | Updated `publicPreview` interface |
| `src/components/chat/artifacts/ProjectEditFormArtifact.tsx` | Uses `businessId` prop |
| `src/components/chat/ProjectEditFormPanel.tsx` | Uses `businessId` state |
| `src/app/(dashboard)/projects/[id]/page.tsx` | Uses `business` state (renamed in 11.9) |

### Acceptance
- [x] Build passes (`npm run build` ✅)
- [x] All components render without errors

---

## Sub-Sprint 11.9 — Route Group Rename ✅ COMPLETE

**Focus:** Rename `(contractor)` route group → `(dashboard)`.

### Completed Tasks
- [x] Decided: `(dashboard)` for authenticated routes (clearer than `(business)`)
- [x] Renamed `src/app/(contractor)/*` → `src/app/(dashboard)/*`
- [x] Updated JSDoc comments referencing old path
- [x] Build passes with new route group

### Files Modified (2026-01-02)
- `src/app/(dashboard)/*` — Renamed from `(contractor)`
- Updated JSDoc refs in: layout.tsx, projects/new/page.tsx, projects/[id]/edit/page.tsx
- Updated component refs: ChatWizard, ContractorMobileNav, edit components

### Acceptance
- [x] Route group renamed consistently
- [x] All authenticated routes work

---

## Sub-Sprint 11.10 — Public Pages & SEO ✅ COMPLETE

**Focus:** Update public-facing pages and SEO.

### Completed Tasks
- [x] Public URLs already use `/businesses/` (no change needed)
- [x] Updated `src/lib/seo/structured-data.ts`:
  - Added `generateBusinessSchema()` as primary function
  - `generateContractorSchema` now deprecated alias
  - Updated `generateProjectSchema` to accept `Business | Contractor`
  - Changed "Masonry Services" → "Services" in schema
- [x] Sitemap already generates `/businesses/` URLs
- [x] Verified canonical URLs use business naming

### Acceptance
- [x] Sitemap validates with business URLs
- [x] Structured data uses business terminology

---

## Sub-Sprint 11.11 — Documentation ✅ COMPLETE

**Focus:** Update all docs to reflect new naming.

### Completed Tasks
- [x] Updated `CLAUDE.md`:
  - Route structure shows `(dashboard)` group
  - Data model shows `businesses` as primary table
  - API routes show `/api/businesses/me` as primary
- [x] Phase file updated with completion status

### Acceptance
- [x] Docs consistently use "business" terminology

---

## Sub-Sprint 11.12 — QA & Cutover ✅ COMPLETE

**Focus:** End-to-end verification.

### Completed Tasks
- [x] Build passes: `npm run build` ✅
- [x] Verified remaining contractor refs are intentional (legacy compatibility, variable names)
- [x] No `/contractors` URLs in sitemap (uses `/businesses/`)
- [x] All authenticated routes work under `(dashboard)` group

### Verification Results
```bash
# Build: ✅ Passes
# Contractor refs in src/: ~177 (mostly variable names, legacy fallback, comments)
# Critical paths use business_id: ✅
```

### Acceptance
- [x] All flows pass
- [x] Legacy contractor refs are intentional backward compatibility

---

## Rollout Plan

### Pre-Deploy
1. Create and test migration locally/on branch.
2. Back up production database.

### Deploy Sequence
1. Deploy code changes (can be feature-flagged if needed).
2. Apply Supabase migration.
3. Verify RLS policies.
4. Run QA checklist.

### Rollback Plan
- Keep old migration files for reference.
- If issues: revert code deploy, restore DB backup.

---

## References

- `docs/03-architecture/data-model.md`
- `docs/04-apis/api-design.md`
- `docs/11-seo-discovery/` (templates + structured data)
- `supabase/migrations/*`
- `.claude/skills/agent-atlas/references/MIGRATIONS.md`
- Vitest Docs: https://vitest.dev/
- Playwright Docs: https://playwright.dev/

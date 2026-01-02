# Ralph Wiggum Prompt: Sprint 11 Completion

> **Goal:** Review Sprint 11 (Business Rename), add bugs to bug-log, update documentation, and complete the sprint.
> **Completion Promise:** Output `<promise>SPRINT 11 COMPLETE</promise>` when ALL tasks are done.

---

## Phase 1: Sprint 11 Review & QA (Sub-Sprints 11.1-11.8)

### 1.1 Verify Completed Sub-Sprints

Check that all completed sub-sprints actually work:

```bash
# Build the project to verify no type errors
npm run build

# Check for any remaining "contractor" references in key areas
rg -n "contractor" src/app/api/businesses/ --type ts
rg -n "contractor_id" src/lib/data/ --type ts
```

**For each sub-sprint (11.1-11.8), verify:**
- [ ] 11.3 Database: Query `businesses` table, confirm 10+ records with all fields populated
- [ ] 11.4 RLS: Test auth flows - can user only see their own business?
- [ ] 11.5 API Routes: Test `/api/businesses/me` GET and PATCH
- [ ] 11.6 Types: `Business` type has all 27 fields from database
- [ ] 11.7 Lib/Utils: `tools-runtime.ts` uses `business_id`, not `contractor_id`
- [ ] 11.8 Components: `DashboardMobileNav` renders correctly

### 1.2 Identify Bugs

Run through these test flows and log any bugs found:

**Flow 1: Dashboard Access**
1. Sign in with test account (`hi+fmb@aaronbaker.co` / `Test1234!`)
2. Navigate to `/dashboard`
3. Check: Does it load without errors?
4. Check: Does it show business name (not contractor)?

**Flow 2: Profile Edit**
1. Navigate to `/profile/edit`
2. Check: Are all fields populated from `businesses` table?
3. Try editing a field and saving
4. Check: Does PATCH work? Does data persist?

**Flow 3: Projects List**
1. Navigate to `/projects`
2. Check: Do projects load with `business_id` FK?
3. Check: No "contractor" references in UI?

**Flow 4: Project Detail**
1. Click into a project
2. Check: Does business data load correctly?
3. Check: Can you access the chat/edit interface?

**Flow 5: Public Pages**
1. Navigate to a published project's public URL
2. Check: Does structured data use "business" naming?
3. Check: No "contractor" in meta tags or visible text?

### 1.3 Log Bugs to qa/bug-log.md

For each bug found, add an entry using this format:

```markdown
- BUG-YYYYMMDD-XX
  - Title: [Descriptive title]
  - Detected on: [date] (local/staging/prod)
  - Area/Route: [affected route]
  - Severity: blocker / high / medium / low
  - Steps to Reproduce:
    1) [step]
    2) [step]
  - Expected: [what should happen]
  - Actual: [what actually happens]
  - Related Test: Sprint 11 review
  - Status: open
  - Owner: unset
```

---

## Phase 2: Complete Remaining Sub-Sprints

### 2.1 Sub-Sprint 11.9 — Route Group Rename

**Decision:** Use `(dashboard)` for authenticated routes (clearer than `(business)`).

**Tasks:**
1. Rename `src/app/(contractor)/*` → `src/app/(dashboard)/*`
2. Update any imports/references to the old route group
3. Update `layout.tsx` and `error.tsx` if they have hardcoded paths
4. Verify build passes

```bash
# Check for hardcoded (contractor) references
rg -n "\(contractor\)" src/ --type ts --type tsx
```

### 2.2 Sub-Sprint 11.10 — Public Pages & SEO

**Tasks:**
1. Check if `/contractors/` routes exist and need rename
2. Update `src/lib/seo/structured-data.ts`:
   - Replace "Contractor" with "LocalBusiness" or "Organization"
   - Ensure no "contractor" in schema.org output
3. Update `src/app/sitemap.ts`:
   - Use `/businesses/` URLs if applicable
4. Search for "contractor" in public-facing text:
   ```bash
   rg -n "contractor" src/app/\(public\)/ --type ts
   ```
5. Update any meta descriptions

### 2.3 Sub-Sprint 11.11 — Documentation

**Update these files:**
1. `CLAUDE.md` (project root):
   - Replace "contractors" table references with "businesses"
   - Update route structure diagram
   - Update example queries

2. `docs/03-architecture/data-model.md`:
   - Update entity diagram
   - Replace `contractors` with `businesses`
   - Document JSONB fields (location, understanding, context)

3. `docs/04-apis/api-design.md`:
   - Update API routes section
   - Replace `/api/contractors/*` with `/api/businesses/*`

4. `todo/phase-11-business-rename.md`:
   - Mark all sub-sprints as complete with checkboxes
   - Add completion date

5. `todo/README.md`:
   - Update status to show Phase 11 complete
   - Move to Completed Phases section

6. `.claude/skills/agent-atlas/references/`:
   - Update ARCHITECTURE.md if it mentions contractors
   - Update MIGRATIONS.md with the 033/034 migration details

### 2.4 Sub-Sprint 11.12 — QA & Cutover

**Final verification:**
1. Run full build:
   ```bash
   npm run build
   ```

2. Search for remaining "contractor" references:
   ```bash
   # Should be minimal (only legacy compatibility code)
   rg -n "contractor" src/ --type ts | wc -l

   # Check specifically for problematic patterns
   rg -n "contractor_id" src/lib/ --type ts
   rg -n "/api/contractors" src/ --type ts
   ```

3. Manual smoke test:
   - Login → Dashboard → Profile Edit → Save → Projects → View Project → Public Page

4. Check Supabase logs for any RLS errors (if accessible)

---

## Phase 3: Sprint Completion

### 3.1 Mark Sprint Complete

Update `todo/phase-11-business-rename.md`:
- All sub-sprint checkboxes marked `[x]`
- Add "Completed: 2026-01-02" to header

Update `todo/README.md`:
- Move Phase 11 to Completed Phases table with ✅
- Update "Current Phase" to Phase 12 or "None (maintenance)"

### 3.2 Create Handoff Entry

Add handoff section to `todo/phase-12-service-catalog-migration.md`:

```markdown
## Handoff from Phase 11

### What Was Built
- Full rename from `contractors` → `businesses` across stack
- Database migration (033, 034) with JSONB agentic fields
- `/api/businesses/me` and `/api/businesses/[slug]` endpoints
- `Business*` TypeScript types with deprecated `Contractor*` aliases
- Updated all lib/data, chat/tools, and components

### Key Files to Reference
- `src/types/database.ts` — Business types
- `src/app/api/businesses/me/route.ts` — Primary API
- `src/lib/data/services.ts` — Business queries
- `supabase/migrations/033_*.sql` — Schema migration

### Patterns to Follow
- Use `business_id` for all new FKs
- Query `businesses` table, not `contractors`
- Use `Business` type, not deprecated `Contractor`

### Ready for Phase 12
- Universal business support established
- JSONB fields ready for agentic context
- Service catalog can now be business-agnostic
```

### 3.3 Commit Changes

```bash
git add -A
git commit -m "Complete Sprint 11: contractors → businesses rename

- Sub-sprints 11.9-11.12 completed
- Route group renamed (contractor) → (dashboard)
- Public pages updated for business terminology
- Documentation updated across CLAUDE.md and docs/
- QA verified, bugs logged

Closes Sprint 11"
```

---

## Completion Criteria

Before outputting the completion promise, verify:

- [ ] Build passes (`npm run build`)
- [ ] All sub-sprints 11.1-11.12 marked complete in phase file
- [ ] Bugs logged to `qa/bug-log.md`
- [ ] `todo/README.md` shows Phase 11 ✅ Complete
- [ ] Documentation updated (CLAUDE.md, data-model.md)
- [ ] Handoff created in Phase 12 file
- [ ] Changes committed to git

When ALL criteria are met:

<promise>SPRINT 11 COMPLETE</promise>

---

## Notes for Ralph Loop

- If build fails, fix the errors before proceeding
- If a sub-sprint is already complete, skip it and move to the next
- If you encounter blockers, document them in the phase file and continue with other tasks
- Prioritize: Build → QA → Docs → Completion
- Each iteration should make measurable progress toward completion

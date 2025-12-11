# QA Bug Log

Purpose: capture defects discovered during manual or Playwright MCP runs with enough detail to reproduce and prioritize.

Template
- ID: BUG-YYYYMMDD-XX
- Title:
- Detected on: (date, env: local/staging/prod)
- Area/Route:
- Severity: blocker / high / medium / low
- Steps to Reproduce:
  1)
  2)
  3)
- Expected:
- Actual:
- Logs/Screenshots: (paths or notes)
- Related Test: (link to scenario ID, e.g., SC-01)
- Status: open / in-progress / fixed / deferred
- Owner:

Open Items
- BUG-20251210-01
  - Title: Signed-in redirect to /dashboard crashes with `navigation.usePathname is not a function`
  - Detected on: 2025-12-10 (local dev)
  - Area/Route: /dashboard (also observed at /profile/setup after redirect from /signup)
  - Severity: high (blocks signed-in experience)
  - Steps to Reproduce:
    1) Have an active Supabase auth session cookie (after a successful signup/login).
    2) Navigate to `/signup` (user is redirected to `/dashboard` or `/profile/setup`).
    3) Observe error boundary rendering with the TypeError.
  - Expected: Authenticated user lands on dashboard/setup without runtime errors.
  - Actual: Error boundary shows “navigation.usePathname is not a function” (error ID digest example: 448528607).
  - Logs/Screenshots: Playwright console showed the TypeError and error boundary; HMR connected; no screenshot captured.
  - Related Test: SC-01 (signup happy path) follow-on redirect coverage.
  - Status: fixed (2025-12-10) — replaced `next-nprogress-bar` CJS import with custom client `AppProgressBar` using `nprogress-v2` and `usePathname` directly.
  - Owner: unset (needs validation with an authenticated session)

- BUG-20251210-02
  - Title: Infinite recursion in contractors RLS policy causes 503 on profile edit
  - Detected on: 2025-12-10 (prod)
  - Area/Route: /profile/edit and /api/contractors/me
  - Severity: blocker
  - Steps to Reproduce:
    1) Complete profile setup (PATCH contractors returns 204).
    2) Navigate to /profile/edit.
    3) Observe 503 error or "infinite recursion detected in policy" error.
  - Expected: User can access profile edit page.
  - Actual: Infinite recursion in RLS policy for `contractors` table due to circular dependency with `projects` table.
  - Root Cause: Migration `005` (fix for recursion) was not applied to the production database.
  - Status: fixed (2025-12-10) — Applied migration `007` effectively reapplying the fix (using `SECURITY DEFINER` function to break the loop).
  - Owner: Antigravity

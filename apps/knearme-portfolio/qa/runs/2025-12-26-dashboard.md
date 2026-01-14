# Dashboard QA – 2025-12-26

- Context: local dev at `http://localhost:3000` with existing Supabase session; Playwright via dev-browser; viewport 1280×800.
- Test account: `hi+fmb@aaronbaker.co` / `Test1234!` (per `qa/testing-guide.md`, no profile edits saved).

## Scenarios Run

1) **Login → Dashboard**
   - Steps: navigate to `/login`, submit credentials, verify redirect.
   - Result: PASS. Redirected to `/dashboard`.

2) **Dashboard Overview (US-004-09)**
   - Checks: welcome header, stats strip, recent projects list, quick actions (Create Project / Edit Profile), View All.
   - Result: PASS. Recent projects list populated (5 items); quick actions and View All present.

3) **Recent Project → Edit Page**
   - Steps: open first project from dashboard list.
   - Result: PASS. Project edit page loads; Preview tab visible.

4) **Projects List**
   - Steps: open `/projects`, confirm header + tabs, verify list.
   - Result: PASS. Tabs (All/Drafts/Published/Archived) switch without errors; list populated.

5) **Profile Edit**
   - Steps: open `/profile/edit`, confirm core fields.
   - Result: PASS. “Edit Profile” view loads; Business Name field present.

6) **Settings + Logout**
   - Steps: open `/settings`, confirm notifications section; log out.
   - Result: PASS. Settings content loads; logout redirects to `/login`.

## Screenshots
- `qa/runs/2025-12-26-dashboard/dashboard-desktop.png`
- `qa/runs/2025-12-26-dashboard/projects-list.png`
- `qa/runs/2025-12-26-dashboard/project-edit.png`
- `qa/runs/2025-12-26-dashboard/profile-edit.png`
- `qa/runs/2025-12-26-dashboard/settings.png`

## Issues Found
- None during this run (no console errors observed).

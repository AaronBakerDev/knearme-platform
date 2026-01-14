# Harden Payload CMS integration (preview auth, safe rendering, scheduling, analytics)

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan must be maintained in accordance with `/Users/aaronbaker/knearme-workspace/PLANS.md`.

## Purpose / Big Picture

After this change, draft preview links in Payload work reliably, public pages are protected against HTML/script injection from CMS content, scheduled posts show up when their publish time passes, and analytics/popular-article widgets return real data while admin analytics are access-controlled. A reviewer can verify this by creating a draft article in the CMS, opening its preview link, observing safe rendering of special characters in rich text, seeing scheduled posts appear after their publish time, and viewing populated analytics widgets while unauthenticated requests to the analytics API return 401.

## Progress

- [x] (2026-01-14 18:16Z) Drafted the ExecPlan with current code context and risks captured.
- [x] (2026-01-14 18:22Z) Implement preview-token authentication and draft preview access fixes.
- [x] (2026-01-14 18:22Z) Replace unsafe rich-text rendering paths with escaped or React-rendered output.
- [x] (2026-01-14 18:22Z) Align scheduled article visibility across access rules and list pages.
- [x] (2026-01-14 18:22Z) Restore analytics/popular-article data flow with proper access control.
- [ ] (2026-01-14 18:28Z) Add/adjust tests and run lint/targeted checks (completed: added `src/lib/utils/html.test.ts`; remaining: lint + Playwright run; blocked by Node 18.15 and npm install ENOTDIR on `node_modules/date-fns`).

## Surprises & Discoveries

- Observation: Payload exposes local auth and request helpers via `payload.auth` and `createLocalReq`, which can be used to validate CMS sessions in Next.js route handlers.
  Evidence: `node_modules/payload/dist/index.js` exports `authLocal` and `createLocalReq`.

- Observation: Tooling expects Node >=22.12.0 but the current environment uses Node 18.15.0, and `npm install` fails with ENOTDIR on `node_modules/date-fns`.
  Evidence: `npm WARN EBADENGINE required: { node: '>=22.12.0' } current: v18.15.0` and `npm ERR! ENOTDIR: not a directory, rename ... node_modules/date-fns`.

## Decision Log

- Decision: Use Payload’s `auth` + `createLocalReq` to authenticate CMS users in custom Next.js route handlers and to attach `req.user` for access checks.
  Rationale: Aligns with Payload’s built-in auth strategies and respects existing access rules for collections.
  Date/Author: 2026-01-14 (Codex)

- Decision: Remove `dangerouslySetInnerHTML` for blog inline text formatting and escape CMS-provided text before rendering HTML in service descriptions.
  Rationale: Prevents script/HTML injection while preserving formatting without adding new dependencies.
  Date/Author: 2026-01-14 (Codex)

- Decision: Use the same “visible articles” logic (published or scheduled with past `publishedAt`) across access rules and blog listing.
  Rationale: Ensures scheduled publishing behavior is consistent in public and CMS contexts.
  Date/Author: 2026-01-14 (Codex)

- Decision: Introduce a shared HTML utility (`escapeHtml` and `sanitizeHref`) and cover it with small unit tests.
  Rationale: Keeps sanitization logic consistent across CMS renderers and verifiable with lightweight tests.
  Date/Author: 2026-01-14 (Codex)

## Outcomes & Retrospective

To be completed after implementation.

## Context and Orientation

The Payload CMS integration lives under `src/payload` and is accessed from Next.js App Router pages and API routes under `src/app`. Public blog pages are in `src/app/(public)/blog`, service pages in `src/app/(public)/services`, and CMS helpers in `src/lib/payload/client.ts`. Payload uses its own CMS users collection (`src/payload/payload.config.ts` defines `users`). The `Articles` collection defines a `status` field with values draft/scheduled/published/archived in `src/payload/collections/Articles.ts`, and page view analytics are stored in `src/payload/collections/PageViews.ts` with read access limited to authenticated CMS users.

Preview links for drafts live at `/blog/preview/[token]` (`src/app/(public)/blog/preview/[token]/page.tsx`), and preview tokens are regenerated via `/api/articles/preview-token` (`src/app/api/articles/preview-token/route.ts`). Analytics are surfaced via `/api/analytics/stats` (`src/app/api/analytics/stats/route.ts`) and consumed in a custom Payload admin view (`src/payload/views/AnalyticsDashboard.tsx`). Popular articles are rendered on the public site via `src/components/blog/PopularArticles.tsx` which calls `getPopularArticles` from `src/lib/payload/client.ts`.

The current risks are: draft previews fail due to access rules, preview-token API lacks explicit CMS auth, rich-text rendering injects unescaped HTML, scheduled visibility is inconsistent between listing/access, and analytics reads return empty due to access gating.

## Plan of Work

First, fix preview authentication and access. Update `src/app/api/articles/preview-token/route.ts` to authenticate the CMS session with `payload.auth` using request headers, return 401 when no CMS user is present, and use `createLocalReq` with the authenticated user so access rules are enforced. In `src/app/(public)/blog/preview/[token]/page.tsx`, pass `overrideAccess: true` to the local `payload.find` call so draft tokens resolve even for public users, while still validating the token and expiration.

Second, remove unsafe HTML injection from rich-text rendering. In `src/app/(public)/blog/[slug]/page.tsx`, replace the `dangerouslySetInnerHTML` path in the `text` node renderer with React element wrapping for bold/italic/underline/code so CMS text is escaped. Add a small `sanitizeHref` helper in the same file to reject `javascript:` and other unsafe protocols for link nodes. In `src/lib/services/catalog.ts`, escape Lexical text before embedding it into generated HTML (`escapeHtml`) so `service.longDescription` is safe for `dangerouslySetInnerHTML` in `src/app/(public)/services/[type]/page.tsx`.

Third, align scheduled visibility rules. In `src/app/(public)/blog/page.tsx`, replace the hardcoded published-only filter with `buildVisibleArticlesWhere()` from `src/lib/payload/client.ts`. In `src/payload/collections/Articles.ts`, adjust the public read access rule to allow scheduled articles whose `publishedAt` is in the past (same logic as `buildVisibleArticlesWhere`). Document in code comments that scheduled visibility depends on `publishedAt`.

Fourth, restore analytics and popular articles. In `src/app/api/analytics/stats/route.ts`, require CMS authentication via `payload.auth` and return 401 if not logged in. Use `createLocalReq` with the authenticated user for the `payload.find` call so access rules are enforced. In `src/lib/payload/client.ts`, add `overrideAccess: true` to the `page-views` aggregation query inside `getPageViewStats` so public-facing `getPopularArticles` returns data without leaking raw view records. Optionally, enrich analytics output by looking up article titles for top slugs and render those titles in `src/payload/views/AnalyticsDashboard.tsx`.

Finally, add targeted tests or adjustments. Extend `src/__tests__/e2e/payload-cms.spec.ts` with a preview-token test stub or add a unit test for the new sanitization helper (in `src/lib/services/catalog.ts` or a small util module). Run lint and at least one focused test (Playwright blog suite or unit tests) to verify no regressions.

## Concrete Steps

All commands should be run from `/Users/aaronbaker/knearme-workspace/apps/knearme-portfolio`.

1) Update preview-token route and preview page queries.
2) Update rich-text rendering and link sanitization in `src/app/(public)/blog/[slug]/page.tsx`.
3) Add HTML escaping in `src/lib/services/catalog.ts` and verify service page usage remains unchanged.
4) Align scheduling filters in `src/app/(public)/blog/page.tsx` and `src/payload/collections/Articles.ts`.
5) Require auth in `src/app/api/analytics/stats/route.ts` and restore public aggregation via `overrideAccess` in `src/lib/payload/client.ts`.
6) Add/adjust tests and run:

    npm run lint
    npx playwright test src/__tests__/e2e/payload-cms.spec.ts

If Playwright is not configured locally, document the limitation and run the smaller unit tests you add instead.

## Validation and Acceptance

- Draft preview links load unpublished content when the token is valid and show “Preview Not Found” when invalid or expired.
- Blog pages render rich text with bold/italic/code formatting and do not execute HTML tags inserted into CMS content.
- Scheduled articles appear on the public blog listing and detail pages once `publishedAt` is in the past, without a cron job.
- `/api/analytics/stats` returns HTTP 401 when called without a CMS session cookie, and returns populated metrics when called from the Payload admin UI.
- Popular articles widgets render at least one entry when page-views exist.
- `npm run lint` completes with no errors.

## Idempotence and Recovery

These changes are safe to reapply. If a change breaks rendering, revert the individual file edits and rerun lint to isolate. Authentication changes can be rolled back by removing the new `payload.auth` and `createLocalReq` calls in the affected API route. If scheduled visibility causes unexpected results, revert to published-only filters and document that scheduled content requires cron-based status updates.

## Artifacts and Notes

Expected auth failure response example for unauthenticated analytics:

    HTTP/1.1 401 Unauthorized
    { "error": "Unauthorized" }

Expected preview behavior:

    /blog/preview/<token> renders the draft article with a visible preview banner.

## Interfaces and Dependencies

- Use Payload local API and auth helpers from the `payload` package: `payload.auth(...)` and `createLocalReq(...)`.
- In `src/app/api/articles/preview-token/route.ts`, ensure the handler sets up a `PayloadRequest` with `createLocalReq({ req: { headers }, user })` and passes that to `payload.findByID` and `payload.update`.
- In `src/app/(public)/blog/[slug]/page.tsx`, replace the `dangerouslySetInnerHTML` text-node path with React element wrappers and add a `sanitizeHref(url: string): string` helper.
- In `src/lib/services/catalog.ts`, define `escapeHtml(text: string): string` and use it when building `longDescription` HTML from Lexical content.
- In `src/payload/collections/Articles.ts`, update public `read` access to allow scheduled articles whose `publishedAt` is in the past.

Plan update note (2026-01-14): Marked preview auth, sanitization, scheduling alignment, and analytics fixes as completed after implementing the corresponding code changes, documented the shared HTML utility decision, and recorded the lint/install blockage due to Node version and the `date-fns` ENOTDIR error.

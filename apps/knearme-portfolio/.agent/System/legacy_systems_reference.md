# Legacy Systems Reference

This document summarizes legacy systems that are no longer in active use. Keep it as a reference for historical context, data models, and workflows that informed the current portfolio app.

Status note: The `directory-platforms/` and `rank-tracking/` folders were removed from the workspace on 2026-01-05. Paths below are historical references only.

## directory-platforms/astro-main
- Purpose: SEO-focused local business directory (KnearMe.co).
- Stack: Astro 4, Cloudflare Workers/Pages, Cloudflare D1, Cloudflare KV, Tailwind CSS.
- Key workflows: D1-backed listings, categories, reviews, and blog content; SEO structured data and sitemaps.
- Data dependencies: D1 tables in `directory-platforms/astro-main/schema.sql` (categories, businesses, reviews, blog_* tables, business_media, business_hours, admin users).
- Infra dependencies: Cloudflare Pages/Workers, D1 database, KV namespace (configured in `wrangler.toml` and `astro.config.mjs`).
- Notable files: `directory-platforms/astro-main/schema.sql`, `directory-platforms/astro-main/src/workers/api.ts`, `directory-platforms/astro-main/astro.config.mjs`, `directory-platforms/astro-main/wrangler.toml`.

## directory-platforms/supabase
- Purpose: Full-stack contractor directory with profiles, portfolios, and CMS resources.
- Stack: React + Vite + TypeScript, Express, Supabase Postgres/Auth/Storage, Drizzle ORM.
- Key workflows: contractor_profiles/projects, session-based auth, Supabase Storage uploads.
- Data dependencies: tables in `directory-platforms/supabase/shared/schema.ts` (users, contractor_profiles, projects, project_images, sessions; README also mentions resources and claim_requests).
- Infra dependencies: Supabase project, storage bucket `uploads` (see `directory-platforms/supabase/.env.example`), Express session store in Postgres, Vercel deployment.
- Notable files: `directory-platforms/supabase/shared/schema.ts`, `directory-platforms/supabase/server/db.ts`, `directory-platforms/supabase/server/supabaseAuth.ts`, `directory-platforms/supabase/app/api`.

## directory-platforms/v4
- Purpose: Earlier directory platform variant with clean architecture emphasis.
- Stack: Vite + React, Express, Drizzle ORM, Neon serverless Postgres.
- Key workflows: contractor profiles, project portfolios, SEO JSON-LD generation.
- Data dependencies: tables in `directory-platforms/v4/shared/schema.ts` (users, contractor_profiles, projects, project_images, sessions).
- Infra dependencies: Neon Postgres connection, Google Cloud Storage uploads (see package.json dependency), Express session store.
- Notable files: `directory-platforms/v4/shared/schema.ts`, `directory-platforms/v4/server/routes.ts`, `directory-platforms/v4/server/db.ts`.

## directory-platforms/mvp
- Purpose: Lovable prototype that introduced the case study builder.
- Stack: Vite + React, Supabase client + Edge Functions, Tailwind + shadcn UI.
- Key workflows: case study chat, image uploads + AI analysis, draft generation.
- Key tables: case_studies, case_study_details, case_study_images, chat_messages, agent_handoff_log.
- Data dependencies: Supabase Storage bucket `case-study-images` (see ImageUploader).
- Edge Functions: analyze-images, generate-draft, process-case-study.
- Notable files: `directory-platforms/mvp/src/lib/supabaseClient.ts`, `directory-platforms/mvp/src/hooks/useCaseStudyChat.tsx`, `directory-platforms/mvp/src/components/case-study/ImageUploader.tsx`, `directory-platforms/mvp/supabase/functions/process-case-study/index.ts`, `directory-platforms/mvp/supabase/functions/analyze-images/index.ts`, `directory-platforms/mvp/supabase/functions/generate-draft/index.ts`.

## rank-tracking/next-tracker
- Purpose: Local SEO rank tracking SaaS.
- Stack: Next.js App Router, Supabase Postgres/Auth, Playwright testing.
- Key workflows: auth flows, rank tracking records in rt_* tables, resource center content.
- Data dependencies: rt_users, rt_properties, rt_keywords, rt_locations, rt_rank_history, rt_resources and related rt_resource_* tables (see types file).
- Infra dependencies: Supabase project, Cloudflare Pages/Workers (README), Serper API for SERP data (README).
- Notable files: `rank-tracking/next-tracker/src/types/supabase.ts`, `rank-tracking/next-tracker/src/lib/auth.ts`, `rank-tracking/next-tracker/src/lib/resources.ts`, `rank-tracking/next-tracker/scripts/setup-supabase.js`.

## rank-tracking/local-beacon
- Purpose: Full-feature rank tracking platform with AI recommendations.
- Stack: pnpm + Turborepo, Vite + React apps, Supabase, PostGIS, Mapbox, Edge Functions.
- Key workflows: SERP ingestion, rank history, admin dashboards, SEO tools.
- Key packages: apps/api, apps/admin, apps/directory, packages/seo-tools, packages/database.
- Data dependencies: rt_* tables plus contractors, projects, leads types in `packages/database`.
- Edge Functions: api-config-manager, api-management, dashboard-summary, fetch-search-results, fetch-serp-data, quick-setup, scheduled-rank-checker, serp-simulator, update-demo-data.
- Infra dependencies: Supabase project with PostGIS, Mapbox tokens, Browserbase, Sentry, deployment scripts under `infrastructure/`.
- Notable files: `rank-tracking/local-beacon/apps/api/src/routes`, `rank-tracking/local-beacon/supabase/functions`, `rank-tracking/local-beacon/packages/seo-tools`, `rank-tracking/local-beacon/packages/database/src/types.ts`, `rank-tracking/local-beacon/turbo.json`.

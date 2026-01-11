# Legacy Systems Inventory

Legacy reference overview: `.agent/System/legacy_systems_reference.md`.
Deletion checklist: `.agent/System/legacy_systems_deletion_checklist.md`.
Legacy folders `directory-platforms/` and `rank-tracking/` were removed from the workspace on 2026-01-05.

## Canonical system (source of truth going forward)
- knearme-portfolio/ (Next.js 16 + Supabase)
  - Owns the primary product experience for contractor portfolios.
  - Supabase schema source: knearme-portfolio/supabase/migrations/20260103055338_remote_schema.sql.
  - Uses Supabase Auth/Storage, server/admin clients, and MCP tooling.

## Active supporting systems (still in use)
- review-agent-dashboard/
  - Purpose: UI for monitoring and managing review pipeline outputs.
  - Status: Active. Keep read access until review pipeline migration is complete.
  - Data access: Supabase queries via review-agent-dashboard/src/lib/supabase/queries.ts.
  - Tables: review_contractors, review_data, review_analysis, review_articles, ai_usage_log, searched_cities.
  - RPC usage: get_unique_cities, get_unique_states (see queries.ts).
  - Auth: Supabase SSR helpers with admin client for elevated queries.
- contractor-review-agent/
  - Purpose: Review discovery, analysis, and content generation pipeline.
  - Status: Active. Primary writer for review_* tables.
  - Data access: Supabase service role client (contractor-review-agent/src/lib/supabase.ts).
  - Tables: review_contractors, review_data, review_analysis, review_articles.
  - External APIs: DataForSEO (Google Maps/Reviews), Google GenAI (per package.json).
- business-agent/
  - Purpose: CLI agent for business consulting workflows.
  - Status: Active, non-DB (no Supabase usage found).
  - Data access: no direct Supabase usage found in business-agent/src.
  - Note: User indicated possible local SQLite usage; not found in repo. Confirm before decommission.
- business-agent-codex/
  - Purpose: CLI agent using OpenAI Codex SDK.
  - Status: Active, non-DB (no Supabase usage found).
  - Data access: no direct Supabase usage found in business-agent-codex/src.

## Predecessor apps (legacy but still referenceable)
- directory-platforms/supabase/
  - Tech: Next.js + Express + Drizzle ORM + Supabase.
  - Status: Deprecated reference only.
  - Schema: shared/schema.ts (contractor_profiles, projects, project_images, users, sessions).
  - Storage: Supabase Storage bucket for uploads.
- directory-platforms/v4/
  - Tech: Vite + Express + Drizzle ORM + Neon serverless Postgres.
  - Status: Deprecated reference only.
  - Schema: shared/schema.ts (same core entities as supabase variant).
- directory-platforms/mvp/
  - Tech: Vite + React + Supabase.
  - Status: Decommission target (Phase 1). Freeze new writes before disabling Edge Functions.
  - Data access: uses Supabase tables for case_studies, case_study_details, case_study_images, chat_messages, agent_handoff_log.
  - Supabase Edge Functions: analyze-images, process-case-study, generate-draft.
- directory-platforms/astro-main/
  - Tech: Astro + Cloudflare Pages/Workers + Cloudflare D1 (SQLite).
  - Status: Deprecated reference only.
  - Schema: directory-platforms/astro-main/schema.sql (categories, businesses, reviews, blog, admin users).
- rank-tracking/next-tracker/
  - Tech: Next.js + Supabase.
  - Status: Keep as potential future feature; avoid schema changes to rt_* during MVP.
  - Tables: rt_users, rt_properties, rt_keywords, rt_locations, rt_rank_history (see rank-tracking/next-tracker/src/types/supabase.ts).
- rank-tracking/local-beacon/
  - Tech: pnpm/Turborepo, Supabase, PostGIS.
  - Status: Keep as potential future feature; avoid schema changes to rt_* during MVP.
  - Data types: contractors, projects, leads (rank-tracking/local-beacon/packages/database/src/types.ts).
  - Supabase Edge Functions: rank tracking, SERP ingestion, dashboard summaries.

## Shared DB touchpoints
- Shared Supabase project is referenced in .env files across:
  - knearme-portfolio/.env.local
  - review-agent-dashboard/.env.local
  - contractor-review-agent/.env
  - rank-tracking/next-tracker/.env
  - rank-tracking/local-beacon/.env
  - directory-platforms/supabase/.env
- These files include secrets; treat them as sensitive and do not commit new credentials.

## Decommissioning risk areas
- review_* tables (review_contractors, review_data, review_analysis, review_articles) are actively written by contractor-review-agent and read by review-agent-dashboard.
- case_studies and chat_messages are used by directory-platforms/mvp and overlap with portfolio content workflows; scheduled for Phase 1 decommission.
- rt_* tables are used by rank-tracking/next-tracker and potentially local-beacon.
- Supabase Edge Functions in rank-tracking/local-beacon and directory-platforms/mvp may be scheduled or referenced by active workflows.

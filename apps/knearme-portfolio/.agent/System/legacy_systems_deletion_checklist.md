# Legacy Systems Deletion Checklist

Use this checklist before deleting legacy system folders. The goal is to ensure no active workflows or external services still depend on the code.

## Global checks
- Confirm the system is not actively used (no production traffic, no scheduled jobs, no recent writes).
- Identify all data dependencies (tables, storage buckets, queues) and confirm they are either archived or no longer written.
- Disable or remove external runtimes (Edge Functions, workers, cron jobs) before deleting code.
- Record any environment variables or secrets used by the system (names only, never values).
- Preserve a final snapshot of documentation in `.agent/System/legacy_systems_reference.md`.

## System-specific checks

### directory-platforms/mvp (case study prototype)
- Disable Edge Functions: analyze-images, generate-draft, process-case-study.
- Freeze UI writes to case_studies, case_study_details, case_study_images, chat_messages, agent_handoff_log.
- Verify storage bucket `case-study-images` is no longer receiving new uploads.

### directory-platforms/supabase
- Verify no traffic to the Express server or Vite client.
- Confirm no active writes to contractor_profiles, projects, project_images, sessions.
- Check storage bucket `uploads` for ongoing use.

### directory-platforms/v4
- Confirm no active writes to Neon Postgres.
- Confirm Google Cloud Storage uploads are disabled (if configured).

### directory-platforms/astro-main
- Disable Cloudflare Pages/Workers deployment.
- Confirm D1 database is no longer used (no queries or scheduled jobs).

### rank-tracking/next-tracker
- Disable Cloudflare Pages/Workers deployment.
- Confirm no active writes to rt_* tables.
- Confirm Serper API usage is no longer occurring.

### rank-tracking/local-beacon
- Disable Supabase Edge Functions listed in legacy reference.
- Confirm no active writes to rt_* tables and contractor/project/lead tables used by local-beacon.
- Confirm Mapbox, Browserbase, and Sentry integrations are no longer used.

## Acceptance criteria
- All legacy systems are offline or read-only.
- No active runtime depends on deleted code.
- Shared Supabase tables used by active apps remain intact.

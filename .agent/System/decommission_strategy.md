# Phased Decommission Strategy

## Goal
Reduce or retire predecessor apps and ad hoc systems safely while keeping the shared Supabase database stable and the canonical portfolio app fully functional.

## Principles
- Do not remove or alter shared tables without a documented owner and migration plan.
- Keep active systems running until their responsibilities are migrated or explicitly retired.
- Favor read-only or frozen legacy systems before deletion.
- Every phase must include observable checks that can be run without production impact.

## Phase 0: Documentation and dependency mapping (now)
- Produce the legacy systems inventory and shared DB contract.
- Identify all active jobs, Edge Functions, or scripts that write to shared tables.
- Acceptance: `.agent/System/legacy_systems_inventory.md`, `.agent/System/shared_db_contract.md`, and `.agent/System/decommission_strategy.md` exist and are indexed in `.agent/README.md`.

## Phase 1: Stabilize and fence legacy usage
- Inventory write paths for each non-canonical system:
  - review-agent-dashboard (admin queries and RPC usage).
  - contractor-review-agent (service role writes to review_* tables).
  - directory-platforms/mvp Edge Functions (case study pipeline).
  - rank-tracking/local-beacon Edge Functions (SERP/rank jobs).
- Introduce ownership labels in documentation: which system owns which tables and which systems are read-only.
- Establish change guardrails:
  - Any schema changes must be updated in knearme-portfolio migrations first.
  - Downstream type updates are required for next-tracker and local-beacon.
- Primary target for this phase: legacy case study pipeline in directory-platforms/mvp (see .agent/System/phase1_case_study_decommission_checklist.md).
- Acceptance: Each legacy system has an explicit read/write stance and the shared DB contract lists owners for all high-risk tables.

## Phase 2: Migrate responsibilities into canonical workflows
- Review pipeline:
  - Decide whether contractor-review-agent continues as an external pipeline or is replaced by a service inside knearme-portfolio.
  - If migrating, reimplement review ingestion and analysis endpoints in knearme-portfolio, then switch review-agent-dashboard to read from the new path.
- Case study pipeline:
  - Migrate case_studies, chat_messages, and agent_handoff_log usage to portfolio app endpoints.
  - Retire directory-platforms/mvp Edge Functions once the portfolio app can handle the same workflow.
- Rank tracking:
  - Decide whether rank-tracking stays as a separate product or is parked. If parked, freeze rt_* writes and snapshot data.
- Acceptance: A migration checklist exists for each pipeline, and a rollback path is documented if a migration fails.

## Phase 3: Archive or retire legacy systems
- Move legacy apps to an archive folder or separate repository (if retention is required).
- Remove environment variables and secrets from archived systems.
- Disable Supabase Edge Functions and scheduled jobs that are no longer needed.
- Update CLAUDE.md and .agent docs to mark systems as archived.
- Acceptance: No active runtime depends on archived systems, and the canonical app operates without legacy write paths.

## Verification checklist (run each phase)
- Confirm which systems are still writing to review_* tables.
- Confirm which systems are still invoking Supabase Edge Functions.
- Confirm that knearme-portfolio features work end-to-end without legacy code paths.
- Confirm that dashboards can read required data after migrations.
